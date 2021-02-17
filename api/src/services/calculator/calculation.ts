import { Request } from 'express'
import axios from 'axios';
const keys = require('../../config/keys')
import Logger from '../../utils/logger';
import CalcResult from '../../models/calcResult'
import MongoDB from '../mongoDB'
import moment from 'moment'
const tripsStruct = require('../../static/lifecycle_tables_trips') 

// обработка запросов к калькулятору
class Calculation {
    result: any
    error: any
    serviceType: string = "Lifecycle calculator"
    constructor(public request: Request) {
    }

    async mainCalculation() {
        const reqData = this.request.body
        if (this.request.params.type === 'model') {
            this.result = await this.getCalculation(reqData)
        }
        if (this.request.params.type === 'trips') {
            this.result = await this.getTripsItems(reqData)
        }


    }
    async getCalculation(reqData: any) {
        const type = this.request.params.type
        return axios.post(keys.calculator.calcURL[type], reqData)
            .then((response) => {
                Logger.info(`API calculator request done`);
                if (response.data.errors.length) {
                    this.error = this.calculationErrorHandler(response.data.errors[0])
                    Logger.error(`services.calculation.getCalculation.get: API calculator ошибка запроса: ${this.error.errText}`)
                    return false
                }
                return response.data
            })
            .catch(err => {
                Logger.error(`services.calculation.getCalculation.get: API calculator ошибка запроса: ${err}`)
                this.error = err
                return false
            })
    }
    calculationErrorHandler({ errText }: { errText: string }): Error {
        return new Error(`Ошибка вычислений: ${errText}`)
    }
    async saveResultToDB() {
        const resultObj: any = new CalcResult(this.request.body)
        try {
            await resultObj.save()
            Logger.info(`Result successfully saved`)
        } catch (error) {
            Logger.error(`services.calculation.saveResultToDB: Result saved Error error`)
        }
    }
    // получение таблиц для сравнения рез-та
    async getCompareTables() {
        const reqType: string = 'compare tables'    // тип запроса для логгера
        const basicParams = this.request.body
        try {
            this.result = await MongoDB.findBy(basicParams, CalcResult, reqType, this.serviceType)
        } catch (error) {
            this.error = error
        }
    }
    async getTripsItems(params: any) {
        let datePeriod = this.formatDate(params)
        let query = [{
            $match: {
                tripDt: {
                    $gt: datePeriod.startOfMonth,
                    $lt: datePeriod.endOfMonth
                },
                locoNum: params.locoNum,
                roadId: params.roadId,
            }
        },
        {
            $addFields: {
                serie: params.serie
            }
        },
        {
            $lookup: {
                from: "nsi_series",
                localField: "serie",
                foreignField: "ID",
                as: "ser"
            }
        },
        { $unwind: "$ser" },
        { $match: { "ser.ID": params.serie } }
        ]
        let tableRows = await this.getResultData(query, "life_cycles", 'calc2')
        tripsStruct.table_items = [...tableRows] 
        return tripsStruct
    }
    // получение массива данных результатов вычислений
    async getResultData(query: any[], reqType: string, currItem: string) {
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
        const startOfMonth = moment([year, (month - 1)]).startOf('month').format("YYYY-MM-DDTHH:mm:ss")
        const endOfMonth = moment([year, (month - 1)]).endOf('month').format("YYYY-MM-DDTHH:mm:ss")
        return { startOfMonth, endOfMonth }
    }
}
export default Calculation