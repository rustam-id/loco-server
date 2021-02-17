import { Request } from 'express'
import MongoDB from '../mongoDB'
const ratingStruct = require('../../static/predictCrewsStruct')
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'
/*
    формирование данных для таблицы рейтинга бригад
*/

class Rating extends Predict {
    serviceType: string = 'Rating crews'

    constructor(public request: Request) {
        super(request)
    }
    // основная управляющая ф-я
    async getRatings() {
        const indexingField = super.getIndexedField()

        let uniqueHeaders = this.request.body[indexingField]
        if (!uniqueHeaders) return
        await Promise.all(ratingStruct[this.request.body.page].map(async (violation: any, indexViol: number) => {
            await this.handleResultTable(indexingField, violation, indexViol, uniqueHeaders)
        }))
        // console.log('result = ', this.result)
    }
    // формирование итоговой таблицы рейтинга
    async handleResultTable(indexingField: string, violation: any, indexViol: any, uniqueHeaders: any) {
        this.result.items[indexViol] = {
            ...this.result.items[indexViol],
            name: violation.name,
            title: violation.title,
        }
        // вычисляем строки
        await this.computeRows(uniqueHeaders, violation, indexViol, indexingField)

        // вычисляем рейтинги для заголовков таблицы
        this.getRateScore(uniqueHeaders, indexViol)
    }
    // вычисляем строки
    async computeRows(uniqueHeaders: any, violation: any, indexViol: any, indexingField: any) {
        return Promise.all(
            uniqueHeaders.map(async (item: any) => {
                let total: any = 0
                let target: any = 0
                let currValue: any = 0

                let dateParams = super.formatDate(this.request.body)
                let reqType = `total items for ${item}`
                let aggregateParams: IQueryBuilderArgs = {
                    basicFilter: {
                        [indexingField]: item
                    },
                    dateField: violation.dateField,
                    datesPeriod: dateParams,
                }
                let model = await MongoDB.setMongoModel(violation.collectionTotal, this.serviceType)
                total = await MongoDB.lengthFindBy({ [indexingField]: item }, model, reqType, this.serviceType)
                target = await super.getPredictData(QueryBuilder(aggregateParams, violation.name), violation.collection, item)
                if (violation.name === 'knowledge') {
                    currValue = target[0] && total
                        ? +target[0].avgQuantity.toPrecision(3)
                        : 0
                } else {
                    currValue = target[0] && total
                        ? +(target[0].total / total).toPrecision(3)
                        : 0
                }

                // иденитфикатор для заголовков
                if (!indexViol) this.result.headers.push({
                    value: item,
                })

                this.result.items[indexViol].value = {
                    ... this.result.items[indexViol].value,
                    [item]: currValue
                }
            })
        );
    }
    // вычисляем рейтинги для заголовков таблицы
    getRateScore(uniqueHeaders: any[], indexViol: number) {
        let rateItems: any[] = Object.values({ ...this.result.items[indexViol].value })
        let sortItems = [...rateItems].sort(function (a: any, b: any) {
            return a - b
        })
        // обратное вычисление рейтинга
        if (ratingStruct[this.request.body.page][indexViol].reverseRating) {
            sortItems.reverse()
        }
        uniqueHeaders.map((item: any, i: any) => {
            let currItemValue = this.result.items[indexViol].value[item]
            this.result.items[indexViol].scoreItems = {
                ...this.result.items[indexViol].scoreItems,
                [item]: [...sortItems].indexOf(currItemValue) * ratingStruct[this.request.body.page][indexViol].ratingWeight
            }
        })

    }
}
export default Rating