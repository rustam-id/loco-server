import { Request } from 'express'
const PredictsStruct = require('../../static/predictCrewsStruct')
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'
import moment from 'moment'
const { performance } = require('perf_hooks');
/*
    формирование данных раздела "прогноз" для аналитики бригад
*/
class Predicts extends Predict {
    serviceType: string = 'Predict crews'

    constructor(public request: Request) {
        super(request)
    }
    // основная управляющая ф-я
    async getPredicts() {
        this.result = await this.handleResultTable()
    }

    // формирование итоговой таблицы для "прогноза"
    async handleResultTable() {
        let items: any[] = []
        if (this.request.body.page === "PredictCrewChart") {
            items = await this.computeRowsDynamincPredict()
        }
        if (this.request.body.page === "PredictCrewChartLevel") {
            items = await this.computeRowsLevelRisks()
        }
        return items
    }

    async computeRowsDynamincPredict() {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        await Promise.all(
            PredictsStruct[page].map(async (predictType: any, index: any) => {
                let item = `predict crews item` // logger info
                let dateParams = super.formatDate(this.request.body)
                let { startOfMonth, endOfMonth } = dateParams
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter,
                    dateField: predictType.dateField,
                    datesPeriod: dateParams,
                }
                const indexingField = super.getIndexedField()
                let currCollection = predictType.collection
                // для уровня одного машиниста отличается коллекция  (оптимизация производительности)
                if (indexingField === "TAB_NUM8") {
                    currCollection =  predictType.collectionPerson
                }
                let target = await super.getPredictData(QueryBuilder(aggregateParams, predictType.name), currCollection, item)
                let dailyPeriods = super.enumerateDaysBetweenDates(startOfMonth, endOfMonth)
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
                        dailyResult: +(dailySum / dailyTotal).toFixed(3)
                    }
                    items = [...items, day]
                })
            })
        )
        return items
    }
    async computeRowsLevelRisks() {
        let items: any[] = []
        let { month, year, page, ...basicFilter } = this.request.body
        const indexingField = super.getIndexedField()
        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders?.length) return []
        await Promise.all(
            uniqueHeaders.map(async (headerID: any) => {
                let cellItem: any = {
                    id: headerID,
                    risk: 0
                }
                await Promise.all(
                    PredictsStruct[page].map(async (structType: any, index: any) => {
                        let currLevel: any = {}
                        let item = `predict crews item` // logger info
                        let dateParams = super.formatDate(this.request.body)
                        let aggregateParams: IQueryBuilderArgs = {
                            basicFilter: {
                                [indexingField]: headerID
                            },
                            dateField: structType.dateField,
                            datesPeriod: dateParams,
                        }
                        let currCollection = structType.collection
                        // для уровня одного машиниста отличается коллекция  (оптимизация производительности)
                        if (indexingField === "TAB_NUM8") {
                            currCollection = structType.collectionPerson
                        }
                        let target = await super.getPredictData(QueryBuilder(aggregateParams, structType.name), currCollection, item)
                        if (!target.length) return
                        let monthSumRisk: any = target.reduce(((sum: any, el: any) => {
                            return sum + el.dailyResult || 0
                        }), 0).toFixed(2)
                        cellItem = {
                            ...cellItem,
                            risk: +(monthSumRisk / target.length).toPrecision(2) || 0
                        }
                    })
                )
                items = [...items, cellItem]
            })
        );
        let sortedItems = [...items].sort((a: any, b: any) => b.risk - a.risk)
        return sortedItems
    }
}
export default Predicts