import { Request } from 'express'
import MongoDB from './mongoDB'

/*
    обработка запросов по выбору НСИ в словарях
*/
class Dictionary {
    result: any[] = []
    error: any
    constructor(public request: Request) {
    }

    async getNSI() {
        const reqData = this.request.body
        const reqType = this.request.params.type
        const serviceType = 'NSI dictionary'
        try {
            const model = await MongoDB.setMongoModel(reqType, serviceType)
            if (model) {
                this.result = await MongoDB.findBy(reqData, model, reqType, serviceType)
            }
        } catch (error) {
            this.error = error
        }
    }
}
export default Dictionary