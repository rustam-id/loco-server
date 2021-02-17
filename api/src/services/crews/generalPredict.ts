import { Request } from 'express'
import MongoDB from '../mongoDB'
const keys = require('../../config/keys')
import moment from 'moment'


/*
    general services for predict analytics of loco crews
*/

abstract class GeneralPredict {
    result: any = {
        headers: [],
        items: []
    }
    error: any
    serviceType: string = 'general predict service'

    constructor(public request: Request) {
    }
    getIndexedField(): string {
        const reqKeys = Object.keys(this.request.body)
        let index = 0
        Object.values(keys.analyticFields).forEach((field: any, i: number) => {
            if (reqKeys.includes(field)) {
                index = i
            }
        })
        return keys.analyticFields[index]
    }
    // получение массива данных к формированию рейтингов
    async getPredictData(query: any[], reqType: string, currItem: string) {
        try {
            const model = await MongoDB.setMongoModel(reqType, this.serviceType)
            if (model) {
                return await MongoDB.aggregateBy({ query, model, reqType, serviceType: `${this.serviceType} for ${currItem}` })
            }
        } catch (error) {
            this.error = error
        }
    }
    // форматирование условия по дате из запроса
    formatDate({ year, month }: { year: number, month: number }) {
        const startOfMonth = moment([year, (month - 1)]).startOf('month').format()
        const endOfMonth = moment([year, (month - 1)]).endOf('month').format()
        return { startOfMonth, endOfMonth }
    }
    // словарь с разбивкой дней по месяцу
    enumerateDaysBetweenDates(startDate: any, endDate: any) {
        let dates = [];
        let currDate = moment(new Date(startDate));
        let lastDate = moment(new Date(endDate));
        // 1000 - разница по датам создаваемая moment
        while (currDate.clone().add(1, 'days').diff(lastDate) <= 1000) {
            let interval = {
                start: currDate.format(),
                end: currDate.clone().add(1, 'days').format(),
            }
            currDate.add(1, 'days')
            dates.push({ ...interval });
        }
        return dates;
    }
    durationHoursBetweenDates(startDate: any, endDate: any) {
        let duration = moment.duration((endDate - startDate), "milliseconds").hours()
        return duration;
    }
}
export default GeneralPredict