import { Request, response } from 'express'
const keys = require('../../config/keys')      // Подключение глобальных переменных
const fetch = require('node-fetch')
import Logger from '../../utils/logger';
import axios from 'axios';

/*
    обработка запросов для Оценка эффективности планирования и использования тяговых ресурсов при осуществлении перевозок
*/
class TygResourceLoco {
    result: number = 0
    error: any
    constructor(public request: Request) {}

    // метод получения расчета
    async calcResource() {
        const reqData = this.request.body
        // URL для отправки запроса
        const urlReq = keys.calcResourceLoco

        this.result = await axios.post(urlReq, reqData)
            .then((response: any) => {
                Logger.info(`API calcResource request done`);
                this.result = response.data
                return response.data
            })
            .catch((err: any) => {
                Logger.error(`services.calculation.getCalculation.get: API calculator ошибка запроса: ${err}`)
                this.error = err
                return false
            })
    }
}
export default TygResourceLoco