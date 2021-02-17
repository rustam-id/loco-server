import { Request } from 'express'
import MongoDB from '../mongoDB'
const reportStruct = require('../../static/predictCrewsStruct')       // the basic templates struct description
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'

/*
    формирование данных для таблицы ДКФС
*/
class DKFS extends Predict {
    serviceType: string = 'DKFS crews'
    report_struct: any

    constructor(public request: Request) {
        super(request)
        this.report_struct = reportStruct[this.request.body.page] 
    }
    // основная управляющая ф-я
    async getDKFS_Report() {
        const indexingField = super.getIndexedField()
        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders?.length) return
        this.result = await this.handleResultTable(indexingField, uniqueHeaders)
    }

    // формирование итоговой таблицы
    async handleResultTable(indexingField: string, uniqueHeaders: any[]) {
        const headers = this.computeHeaders(uniqueHeaders)
        const items = await this.computeRows(headers, indexingField)
        const meta = this.getMetaTableData()
        const table = { headers, items, meta }
        return table
    }

    computeHeaders(uniqueHeaders: any[]) {
        const headerIDs = uniqueHeaders.map(header => {
            return {
                value: header
            }
        })
        return [
            ...this.report_struct.headers,
            ...headerIDs
        ]
    }

    getMetaTableData() {
        return {
            table_name: this.report_struct.table_name
        }
    }

    async computeRows(headers: any[], indexingField: string) {
        let items: any[] = []
        let [totalRow] = this.report_struct.items   // summary info default row 

        const reqType = 'unique DKFS types'         // label for logging
        const orderedField = "ORDER"                // sortable result field

        const model = await MongoDB.setMongoModel(this.report_struct.collection, this.serviceType)
        const params = this.report_struct.DAN_TYPE

        // get exists types of dkfs
        const [dkfs] = await MongoDB.findBy(params, model, reqType, this.serviceType)
        let dkfsTypes = dkfs.toObject().DATA.sort((a: any, b: any) => (a[orderedField] - b[orderedField]))

        await Promise.all(
            dkfsTypes.map(async (type: any) => {
                let row: any = {}
                await Promise.all(
                    headers.map(async (header, i) => {
                        // the first column (contains DKFS titles)
                        if (header.value === "DKFS_name") {
                            row[header.value] = type.PARAM_NAME
                            return
                        }
                        let dateParams = super.formatDate(this.request.body)
                        let aggregateParams: IQueryBuilderArgs = {
                            basicFilter: {
                                [indexingField]: header.value
                            },
                            dateField: this.report_struct.dateField,
                            datesPeriod: dateParams,
                            aliasId: type.CODE
                        }
                        let query = QueryBuilder(aggregateParams, this.report_struct.table_name.value)
                        let [aggregateResult] = await super.getPredictData(query, this.report_struct.collectionCell, header.value)
                        let [cellValue] = aggregateResult.resultFilters            // cell aggregated result 
                        let [totalItems] = aggregateResult.resultCount              // total row aggregated result
                        totalRow = { ...totalRow, [header.value]: totalItems?.count || 0 }
                        row[header.value] = cellValue?.total || 0
                    })
                )
                items.push(row)
            })
        )
        return [ totalRow, ...items ]
    }
}
export default DKFS