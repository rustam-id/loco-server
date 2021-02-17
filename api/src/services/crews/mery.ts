import { Request } from 'express'
import MongoDB from '../mongoDB'
const MeryBasicStruct = require('../../static/predictCrewsStruct')
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'

/*
    формирование данных для таблицы рейтинга бригад
*/
class Mery extends Predict {
    serviceType: string = 'Mery crews'

    constructor(public request: Request) {
        super(request)
    }
    // основная управляющая ф-я
    async getMery() {
        const indexingField = super.getIndexedField()
        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders?.length) return
        this.result = await this.handleResultTable(indexingField, uniqueHeaders)
    }

    // формирование итоговой таблицы рейтинга
    async handleResultTable(indexingField: string, uniqueHeaders: any[]) {
        let headers = this.computeHeaders(uniqueHeaders)
        let items = await this.computeRows(headers, indexingField)
        let table = { headers, items }
        return table
    }

    computeHeaders(uniqueHeaders: any[]) {
        const headerIDs = uniqueHeaders.map(header => {
            return {
                value: header
            }
        })
        return [
            ...MeryBasicStruct[this.request.body.page].headers,
            ...headerIDs
        ]
    }

    async computeRows(headers: any[], indexingField: string) {
        let model = await MongoDB.setMongoModel(MeryBasicStruct[this.request.body.page].collection, this.serviceType)
        let params = MeryBasicStruct[this.request.body.page].DAN_TYPE
        let reqType = 'unique mera types'
        let [mery] = await MongoDB.findBy(params, model, reqType, this.serviceType)
        let meryTypes = mery.toJSON().DATA
        let items: any[] = []
        await Promise.all(
            meryTypes.map(async (type: any) => {
                // меры не относящиеся в локомотивным бригадам
                if (type.CODE_EVENT === 0) {
                    return
                }
                let row: any = {}
                await Promise.all(
                    headers.map(async (header, i) => {
                        if (header.value === "name") {
                            row[header.value] = type.EVENT_NAME
                            return
                        }
                        let dateParams = super.formatDate(this.request.body)
                        let aggregateParams: IQueryBuilderArgs = {
                            basicFilter: {
                                [indexingField]: header.value
                            },
                            dateField: MeryBasicStruct[this.request.body.page].dateField,
                            datesPeriod: dateParams,
                            aliasId: type.ID_EVENT
                        }
                        let query = QueryBuilder(aggregateParams, MeryBasicStruct[this.request.body.page].table_name.value)
                        let [cellValue] = await super.getPredictData(query, MeryBasicStruct[this.request.body.page].collectionCell, header.value)
                        row[header.value] = cellValue?.total || 0
                    })
                )
                items.push(row)
            })
        )
        return items
    }
}
export default Mery