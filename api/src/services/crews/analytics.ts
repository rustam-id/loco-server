import { Request } from 'express'
const AnalyticStruct = require('../../static/predictCrewsStruct')
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'

/*
    формирование данных для таблицы аналитики бригад
*/
class Analytics extends Predict {
    serviceType: string = 'Analytics crews'

    constructor(public request: Request) {
        super(request)
    }
    // основная управляющая ф-я
    async getAnalytics() {
        const indexingField = super.getIndexedField()
        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders?.length) return
        this.result = await this.handleResultTable(indexingField, uniqueHeaders)
    }

    // формирование итоговой таблицы аналитики
    async handleResultTable(indexingField: string, uniqueHeaders: any[]) {
        let items = await this.computeRows(uniqueHeaders, indexingField)
        return items
    }

    async computeRows(headers: any[], indexingField: string) {
        let items: any[] = []
        let { page } = this.request.body
        await Promise.all(
            headers.map(async (item: any) => {
                let cellItem: any = {
                    id: item,
                    viols: []
                }
                await Promise.all(
                    AnalyticStruct[page].map(async (violation: any, index: any) => {
                        let currViol: any = {}
                        let dateParams = super.formatDate(this.request.body)
                        let aggregateParams: IQueryBuilderArgs = {
                            basicFilter: {
                                [indexingField]: item
                            },
                            dateField: violation.dateField,
                            datesPeriod: dateParams,
                        }
                        let [target] = await super.getPredictData(QueryBuilder(aggregateParams, violation.name), violation.collection, item)

                        let currValue = target
                            ? +target.total
                            : 0
                        currViol = {
                            name: violation.name,
                            text: violation.title,
                            value: currValue
                        }
                        cellItem.viols[index] = currViol
                    })
                )
                items = [...items, cellItem]
                
            })
        );
        return items
    }
}
export default Analytics