import { Request } from 'express'
import MongoDB from '../mongoDB'
const reportStruct = require('../../static/predictCrewsStruct')       // the basic templates struct description
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'

/*
    формирование данных для таблиц Анализ соответствия выявляемых нарушений бригад времени работы
*/
class TimeViolsCrew extends Predict {
    serviceType: string = 'timeViolsCrew crews'
    report_struct: any

    constructor(public request: Request) {
        super(request)
        this.report_struct = reportStruct[this.request.body.page]
    }
    // основная управляющая ф-я
    async get_Report() {
        const indexingField = super.getIndexedField()
        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders?.length) return
        this.result = await this.handleResultTable(indexingField, uniqueHeaders)
    }

    // формирование итоговой таблицы
    async handleResultTable(indexingField: string, uniqueHeaders: any[]) {
        let headers: any[] = []
        let items: any[] = []
        // анализ
        if (this.request.body.page === "TabeTimeViols") {
            headers = this.computeHeaders(uniqueHeaders)
            items = await this.computeRows(headers, indexingField)
        }
        // детализация
        if (this.request.body.page === "TabeTimeViolsDetails") {
            headers = this.computeHeadersDetails()
            items = await this.computeRowsPredictDetails(headers, indexingField)
        }

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

        let violTypes = this.report_struct.items                                       // unique viol types based on static structure
        let violTypesFlat = this.violItemsRestructure(this.report_struct.items)        // flat array of viol types (includes sub-rows)
        let combinedItems: any = []
        await Promise.all(
            violTypes.map(async (type: any) => {
                await Promise.all(
                    headers.map(async (header, i) => {
                        let dateParams = super.formatDate(this.request.body)
                        let aggregateParams: IQueryBuilderArgs = {
                            basicFilter: {
                                [indexingField]: header.value,
                                SRC: type.viol_type.SRC
                            },
                            dateField: this.report_struct.dateField,
                            datesPeriod: dateParams,
                        }
                        let query = QueryBuilder(aggregateParams, this.report_struct.table_name.value)
                        let [aggregateResult] = await super.getPredictData(query, this.report_struct.collection, header.value)

                        let fixViolsTrue = aggregateResult?.resultFixViols[0]?.total || 0
                        let totalItems = aggregateResult?.resultCount[0]?.total || 0
                        let fixViolsFalse = totalItems - fixViolsTrue
                        let percentage = +fixViolsFalse > 0 ? ((fixViolsTrue / totalItems) * 100).toFixed() : 100

                        let dataCell: any = {
                            fixViolsTrue,
                            totalItems,
                            fixViolsFalse,
                            percentage,
                            header: header.value,
                            SRC: type.viol_type.SRC,
                        }
                        combinedItems.push(dataCell)
                    })
                )
            })
        )
        violTypesFlat.forEach((flatType: any) => {
            let row: any = {}

            headers.map(async (header, i) => {
                // the first column (contains row titles)
                if (header.value === "viol_type") {
                    row[header.value] = {
                        value: flatType.viol_type.title
                    }
                    return
                }
                let currDatacell = combinedItems.find((el: any) => {
                    return el.header === header.value && el.SRC === (flatType.viol_type.SRC || flatType.SRC)
                })
                row[header.value] = {
                    value: currDatacell[flatType.viol_type.type],
                    SRC: flatType.viol_type.SRC || flatType.SRC,
                    type: flatType.viol_type.type
                }
            })
            items.push(row)
        })
        return items
    }

    /* 
        recursively flattens array of table rows and pass the 'SRC' field into child items 
    */
    violItemsRestructure(struct: any, group?: any) {
        let result: any = []
        struct.forEach((el: any) => {
            if (!el.viol_type.items) {
                if (!el.SRC) {
                    el.SRC = group
                }
                result = [...result, el]
            } else {
                const { SRC } = el.viol_type
                result = [...result, el, ...this.violItemsRestructure(el.viol_type.items, SRC)]
            }
        })
        return result
    }

    computeHeadersDetails() {
        return this.report_struct.headers
    }

    async computeRowsPredictDetails(headers: any[], indexingField: string) {
        let items: any[] = []
        let { month, year, page, path, [indexingField]: [ID], SRC, ...rest } = this.request.body
        let basicFilter = {
            [indexingField]: ID,
            SRC,
            ...rest
        }
        let dateParams = super.formatDate(this.request.body)
        let item = `${page} crews item` // logger info
        let aggregateParams: IQueryBuilderArgs = {
            basicFilter,
            dateField: this.report_struct.dateField,
            datesPeriod: dateParams,
            aliasId: this.report_struct.collectionDict[SRC]
        }
        let target = await super.getPredictData(QueryBuilder(aggregateParams, this.report_struct.table_name.value), this.report_struct.collection, item)
        if (!target.length) return []
        items = [...target]
        return items
    }

}
export default TimeViolsCrew