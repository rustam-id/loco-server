import Logger from '../utils/logger';

/*
    MongoDB:
    Сервис для обращений к БД.
    Оптимизация структур данных перед записью.
*/

export default class MongoDB {
    constructor() { }
    // запись полученных данных в БД
    static async uploadEntries({ data: uploadedData, schema, type = '' }: { data: any[], schema: any, type?: string }) {
        Logger.info(`MongoDB загрузка ${type} началась:  ${Date()}`)
        if (Array.isArray(uploadedData)) {
            if (!uploadedData.length) {
                throw new Error(`MongoDB попытка сформировать пустую запись`)
            }
            Logger.info(`Записей ${type} для загрузки в MongoDB: ${uploadedData.length}`)
            await this.bulkHandler(uploadedData, schema)
                .then((_: any) => Logger.info(`MongoDB загрузка ${type} успешно завершена: ${Date()}`))
                .catch((e: Error) => Logger.error(`services.mongoDB.uploadEntries: MongoDB ошибка загрузки ${type}: ${e}`))
        }
    }
    // обработчик для разбивки и загрузки крупных массивов
    static async bulkHandler(uploadedData: any[], schema: any, bulkSize: number = 100) {
        let toInsert = [];
        for (let i = 0; i < uploadedData.length; i++) {
            toInsert.push(uploadedData[i]);
            const isLastItem = i === uploadedData.length - 1;
            if (i % bulkSize === 0 || isLastItem) {
                await schema.insertMany(toInsert);
                toInsert = [];
            }
        }
    }
    // получение и установка модели для требуемой коллекции данных
    static async setMongoModel(modelType: string, serviceType: string) {
        try {
            const Model = require('mongoose').model(modelType)
            Logger.info(`Success set a mongo model: ${modelType} for service: ${serviceType}`)
            return Model
        } catch (error) {
            Logger.error(`services.MongoDB.setMongoModel: mongo reading model error: ${error} on requested type: ${modelType} for service: ${serviceType}`)
            throw new Error(`MongoDB reading model error: on requested type: ${modelType} for service: ${serviceType}`)
        }
    }
    // простой поиск по условиям
    static async findBy(params: any, model: any, reqType: string, serviceType: string, lean?: boolean) {
        try {
            const result = lean ? await model.find(params).lean() : await model.find(params)
            Logger.info(result.length
                ? `Success read: ${result.length} items by data type: ${reqType} for service: ${serviceType} from a mongoDB`
                : `There is no items by data type: ${reqType} for service: ${serviceType} in a mongoDB`)
            return result
        } catch (error) {
            Logger.error(`services.MongoDB.findBy: mongo find error: ${error} on requested type: ${reqType} for service: ${serviceType}`)
            throw new Error(`MongoDB find error: on requested type: ${reqType} for service: ${serviceType}`)
        }
    }
    // поиск по условиям с проекцией
    static async findWithProjection(params: any, projection: any, model: any, reqType: string, serviceType: string) {
        try {
            const result = await model.find(params, projection)
            Logger.info(result.length
                ? `Success read: ${result.length} items by data type: ${reqType} for service: ${serviceType} from a mongoDB`
                : `There is no items by data type: ${reqType} for service: ${serviceType} in a mongoDB`)
            return result
        } catch (error) {
            Logger.error(`services.MongoDB.findWithProjection: mongo find error: ${error} on requested type: ${reqType} for service: ${serviceType}`)
            throw new Error(`MongoDB find error: on requested type: ${reqType} for service: ${serviceType}`)
        }
    }
    // поиск по условиям с проекцией и сортировкой
    static async findProjSort(params: any, projection: any, sort: any, model: any, reqType: string, serviceType: string) {
        try {
            const result = await model.find(params, projection).sort(sort)
            Logger.info(result.length
                ? `Success read: ${result.length} items by data type: ${reqType} for service: ${serviceType} from a mongoDB`
                : `There is no items by data type: ${reqType} for service: ${serviceType} in a mongoDB`)
            return result
        } catch (error) {
            Logger.error(`services.MongoDB.findProjSort: mongo find error: ${error} on requested type: ${reqType} for service: ${serviceType}`)
            throw new Error(`MongoDB find error: on requested type: ${reqType} for service: ${serviceType}`)
        }
    }
    // простое получение кол-ва документов 
    static async lengthFindBy(params: any, model: any, reqType: string, serviceType: string) {
        try {
            const result = await model.countDocuments(params)
            Logger.info(result
                ? `Success read: ${result} items by data type: ${reqType} for service: ${serviceType} from a mongoDB`
                : `There is no items by data type: ${reqType} for service: ${serviceType} in a mongoDB`)
            return result
        } catch (error) {
            Logger.error(`services.MongoDB.lengthFindBy: mongo find error: ${error} on requested type: ${reqType} for service: ${serviceType}`)
            throw new Error(`MongoDB find error: on requested type: ${reqType} for service: ${serviceType}`)
        }
    }
    // агрегирующий запрос
    static async aggregateBy({ query, model, reqType, serviceType }: { query: any[], model: any, reqType: string, serviceType: string }) {
        try {
            const result = await model.aggregate(query)
            Logger.info(result.length
                ? `Success aggregate: ${result.length} items by data type: ${reqType} for service: ${serviceType} from a mongoDB`
                : `There is no aggregated items by data type: ${reqType} for service: ${serviceType} in a mongoDB`)
            return result
        } catch (error) {
            Logger.error(`services.MongoDB.aggregateBy: mongo aggregate error: ${error} on requested type: ${reqType} for service: ${serviceType}`)
            throw new Error(`MongoDB find error: on requested type: ${reqType} for service: ${serviceType}`)
        }
    }
}
