import { Request } from 'express'
const PredictsStruct = require('../../static/predictCrewsStruct')
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'
import MongoDB from '../mongoDB'
import Logger from '../../utils/logger';
import moment from 'moment'

/*
    формирование данных для карточки машиниста
*/
class Person extends Predict {
    serviceType: string = 'Person crews'
    constructor(public request: Request) {
        super(request);
    }
    // основная управляющая ф-я
    async getPerson() {
        let struct = PredictsStruct[this.request.body.page]
        if (!struct) {
            this.error = this.errorStructHandler(this.request.body.page)
            Logger.error(`services.crews.person.getPerson: ${this.error.message}`)
            return false
        }
        this.result = struct[0].isChart
            ? await this.handleResultChart(struct)
            : struct[0].isCard
                ? await this.handleResultCard(struct)
                : await this.handleResultTable(struct[0])
        return true
    }
    errorStructHandler(errText: string): Error {
        return new Error(`Не удалось получить структуры для отчета: ${errText}.`)
    }

    // формирование диаграмм для "карточки машиниста"
    async handleResultChart(struct: any) {
        if (this.request.body.page === "PersonHiddenFactChart") {
            return await this.computeRowsHiddenFact(struct)
        }
        if (this.request.body.page === "personViolsChartRisk") {
            return await this.computeRowsViolsChartRisk(struct)
        }
        if (this.request.body.page === "personViolsChartWeight") {
            return await this.computeRowsViolsChartWeight(struct)
        } else {
            return false
        }
    }
    // формирование таблиц для "карточки машиниста"
    async handleResultTable(struct: any) {
        let headers: any[] = []
        let items: any[] = []
        if (this.request.body.page === "personShortMery" || this.request.body.page === "personLongMery") {
            headers = this.computeHeadersBasic(struct)
            items = await this.computeRowsShortLongMery(headers, struct)
        }
        if (this.request.body.page === "personPredictViols") {
            headers = this.computeHeadersBasic(struct)
            items = await this.computeRowsPredictTables(headers, struct)
        }
        if (this.request.body.page === "personRecommendPredict") {
            headers = this.computeHeadersBasic(struct)
            items = await this.computeRowsRecommendPredictTables(headers, struct)
        }
        if (this.request.body.page === "personViolsTable") {
            headers = this.computeHeadersBasic(struct)
            items = await this.computeRowsViolsTable(headers, struct)
        }
        if (this.request.body.page === "personAboutTable") {
            return PredictsStruct[this.request.body.page]
        }
        if (this.request.body.page === "personControlDates") {
            items = await this.computeControlDates(PredictsStruct[this.request.body.page])
            return items
        }
        let table = { headers, items }
        return table
    }
    // info card constructor
    async handleResultCard(struct: any) {
        if (this.request.body.page === "personInfoCards") {
            return await this.computeRowsInfoCard(struct)
        } else {
            return false
        }
    }
    async computeRowsHiddenFact(struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(
            struct.map(async (predictType: any, index: any) => {
                let item = `${page} crews item` // logger info
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter,
                }
                let [target] = await super.getPredictData(QueryBuilder(aggregateParams, predictType.name), predictType.collection, item)
                items = [...items, target?.FACTORS]
            })
        )
        return items

    }
    computeHeadersBasic(struct: any) {
        return struct.headers
    }
    async computeRowsShortLongMery(headers: any[], struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        let model = await MongoDB.setMongoModel(struct.collection, this.serviceType)
        let reqType = `${page} crews item` // logger info
        let [mery] = await MongoDB.findBy(basicFilter, model, reqType, this.serviceType)
        let meryTypes = mery?.toJSON().AUTO_EVENTS?.[struct.totalField]
        if (!meryTypes) return []
        items = Object.values(meryTypes)
        return items
    }
    async computeRowsViolsTable(headers: any[], struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        let dateParams = super.formatDate(this.request.body)
        let item = `${page} crews item` // logger info
        let aggregateParams: IQueryBuilderArgs = {
            basicFilter,
            dateField: struct.dateField,
            datesPeriod: dateParams,
        }
        let target = await super.getPredictData(QueryBuilder(aggregateParams, struct.table_name.value), struct.collection, item)
        if (!target.length) return []
        let model = await MongoDB.setMongoModel(struct.dictCollection, this.serviceType)
        let params = struct.DAN_TYPE
        let reqType = `${page} dictionary crews item` // logger info
        let [violsCat] = await MongoDB.findBy(params, model, reqType, this.serviceType)
        let types = violsCat?.toJSON().DATA
        if (types?.length) {
            target.map((el: any) => {
                types.forEach((cat: any) => {
                    if (el.category === cat.id) {
                        el.category = cat.name
                    }
                })
            })
        }
        return target
    }
    async computeRowsViolsChartRisk(struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(
            struct.map(async (structType: any, index: any) => {
                let item = `crews page ${page} item` // logger info
                let dateParams = super.formatDate(this.request.body)
                let { startOfMonth, endOfMonth } = dateParams
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter,
                    dateField: structType.dateField,
                    datesPeriod: dateParams,
                }
                let target = await super.getPredictData(QueryBuilder(aggregateParams, structType.name), structType.collection, item)
                let dailyPeriods = super.enumerateDaysBetweenDates(startOfMonth, endOfMonth)
                let currDefaultResult = 0
                dailyPeriods.forEach((day: any, j: any) => {
                    let risks = target.filter((el: any, i: any) => {
                        return (el.start >= new Date(day.start) && el.start <= new Date(day.end))
                    })
                    let dailySum: any = risks.reduce(((sum: any, el: any) => {
                        return sum + el.dailyResult
                    }), 0)
                    let dailyTotal = risks.length
                    day = {
                        ...day,
                        dailyResult: +(dailySum / dailyTotal).toPrecision(3)
                    }
                    if (day.dailyResult) {
                        currDefaultResult = day.dailyResult
                    }
                    // заполнение для дней без данных
                    if (!day.dailyResult && new Date(day.start) < new Date()) {
                        day.dailyResult = currDefaultResult
                    }
                    items = [...items, day]
                })
            })
        )
        return items
    }
    async computeRowsViolsChartWeight(struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(
            struct.map(async (structType: any, index: any) => {
                let item = `crews page ${page} item` // logger info
                let dateParams = super.formatDate(this.request.body)
                let { startOfMonth, endOfMonth } = dateParams
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter,
                    dateField: structType.dateField,
                    datesPeriod: dateParams,
                }
                let target = await super.getPredictData(QueryBuilder(aggregateParams, structType.name), structType.collection, item)
                let dailyPeriods = super.enumerateDaysBetweenDates(startOfMonth, endOfMonth)
                dailyPeriods.forEach((day: any, j: any) => {
                    let risks = target.filter((el: any, i: any) => {
                        return (el.date >= new Date(day.start) && el.date <= new Date(day.end))
                    })
                    let dailySum: any = risks.reduce(((sum: any, el: any) => {
                        return sum + el.weight
                    }), 0)
                    let dailyTotal = risks.length
                    day = {
                        ...day,
                        dailyResult: +dailySum || 0
                        // dailyResult: +(dailySum / dailyTotal).toPrecision(3) || 0
                    }
                    items = [...items, day]
                })
            })
        )
        return items
    }
    async computeRowsInfoCard(struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(
            struct.map(async (structType: any, index: any) => {
                // case for temporary hidden values
                if (structType.hidden) {
                    return
                }
                // case for temporary undescribed values
                if (!structType.isComputed) {
                    items = [...items, structType]
                    return
                }
                let item = `crews page ${page} item` // logger info
                let dateParams = super.formatDate(this.request.body)
                let { startOfMonth, endOfMonth } = dateParams
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter,
                    datesPeriod: dateParams,
                    ...(structType.dateFieldPeriod ? { dateFieldPeriod: structType.dateFieldPeriod } : {}),
                    ...(structType.dateField ? { dateField: structType.dateField } : {}),
                }
                let total: any
                let target = await super.getPredictData(QueryBuilder(aggregateParams, structType.name), structType.collection, item)
                if (!target?.length) {
                    items = [...items, structType]
                    return
                }
                if (structType.name === "info_card_hours") {
                    total = target.reduce((sum: any, trip: any) => {
                        let start = Math.max(moment(startOfMonth).valueOf(), moment(trip.start).valueOf())
                        let end = Math.min(moment(endOfMonth).valueOf(), moment(trip.end).valueOf())
                        return sum + super.durationHoursBetweenDates(start, end)
                    }, 0)
                    structType = {
                        ...structType,
                        value: total,
                    }
                }
                if (structType.name === "info_card_ter") {
                    let param = target.reduce((sum: any, trip: any) => {
                        return sum + (trip.WORK.F_ELCT || 0) + (trip.WORK.F_TOPL || 0)
                    }, 0).toFixed()
                    let value = target.reduce((sum: any, trip: any) => {
                        return sum + (trip.WORK.N_ELCT || 0) + (trip.WORK.N_TOPL || 0)
                    }, 0).toFixed()
                    structType = {
                        ...structType,
                        value,
                        param,
                    }
                }
                if (structType.name === "info_card_aspt") {
                    let param: any
                    let value: any
                    let currParamDate = new Date(startOfMonth)
                    let currValueDate = new Date(startOfMonth)
                    target.forEach((document: any) => {
                        // TODO добавить комментарий
                        if (document.ASPT.TYPE_ASPT === 1 && document.ASPT.DATE_ASPT > currParamDate) {
                            currParamDate = document.ASPT.DATE_ASPT
                            param = document.ASPT.RESULT_ASPT
                        }
                        if (document.ASPT.TYPE_ASPT === 2 && document.ASPT.DATE_ASPT > currValueDate) {
                            currValueDate = document.ASPT.DATE_ASPT
                            value = document.ASPT.RESULT_ASPT
                        }
                    })
                    structType = {
                        ...structType,
                        value: value || '-',
                        param: param || '-',
                    }
                }
                items.unshift(structType)
            })
        )
        return items
    }
    async computeRowsPredictTables(headers: any[], struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        let dateParams = super.formatDate(this.request.body)
        let item = `${page} crews item` // logger info
        let aggregateParams: IQueryBuilderArgs = {
            basicFilter,
            dateField: struct.dateField,
            datesPeriod: dateParams,
        }
        let [target] = await super.getPredictData(QueryBuilder(aggregateParams, struct.table_name.value), struct.collection, item)
        if (!target) return []
        Object.entries(target[struct.preField][struct.totalField]).forEach((type, i) => {
            let row: any = {}
            headers.forEach((header, j) => {
                row[header.value] = type[j]
            })
            items = [...items, row]
        })
        return items
    }
    async computeRowsRecommendPredictTables(headers: any[], struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        let dateParams = super.formatDate(this.request.body)
        let item = `${page} crews item` // logger info
        let aggregateParams: IQueryBuilderArgs = {
            basicFilter,
            dateField: struct.dateField,
            datesPeriod: dateParams,
        }
        let target = await super.getPredictData(QueryBuilder(aggregateParams, struct.table_name.value), struct.collection, item)
        if (!target) return []
        return target
    }
    async computeControlDates(struct: any) {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(struct.map(async (el: any) => {
            if (!el.collection) {
                items = [...items, el]
                return
            }
            let item = `${page} crews item` // logger info
            let aggregateParams: IQueryBuilderArgs = {
                basicFilter,
            }
            let [target] = await super.getPredictData(QueryBuilder(aggregateParams, el.table_name), el.collection, item)
            if (!target) {
                items = [...items, el]
                return
            }
            let isExpired: Boolean = target.date < new Date()

            el = {
                ...el,
                date: moment(target.date).format('DD-MM-YYYY'),
                isExpired,
                text: "",
            }

            if (el.table_name === "pfo") {
                el = {
                    ...el,
                    text: target.group ? `группа ${target.group}` : "",
                }
            }
            if (el.table_name === "dkfs") {
                el = {
                    ...el,
                    text: target.text,
                }
            }
            items = [...items, el]
        })
        )
        return items
    }


}
export default Person