import { Request, response } from 'express'
import MongoDB from '../mongoDB'
import CardLoco from './cardLoco'
import moment from 'moment'

/*
    обработка запросов для Диагностической карты
*/
class DiagnosticMap {
    result: any[] = []
    error: any
    constructor(public request: Request) {
    }

    // метод получения данных для Диагностической карты
    async getDataDiagnostic(collection: string, sTypeParam: string) {
        // const reqData = { LOCO_SER: 640, LOCO_NUM: 33, DATE: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        const reqData = this.request.body                                           // фильтр по локомотиву
        reqData.DATE = { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }     // добавляем фильтр на 30 дней
        const projection = { '_id': 0, LOCO_ROAD: 1, LOCO_DEPO: 1, LOCO_SER: 1, LOCO_NUM: 1, DATE: 1, FILE_NAME: 1, PREDICT_LEVEL: 1, DEVICE: 1, SEC: 1, RESULT: 1, RESULT_FIX: 1 }        // проекция
        const sort = { "DATE": -1 }                                                 // сортировка дат по убыванию

        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {
                const target: any[] = await MongoDB.findProjSort(reqData, projection, sort, model, '', sTypeParam)
                if(target.length > 0) {
                    const targetLoco = target[0]?.toJSON()
                    const req = { 
                        RAILWAY: targetLoco.LOCO_ROAD || null,
                        DEPO: targetLoco.LOCO_DEPO || null,
                        SERIES_CODE: targetLoco.LOCO_SER || null,
                        NUMBER_LOCO: targetLoco.LOCO_NUM || null,
                    }
                    const projection = { _id: 0, ROAD_NAME: 1, DEPO_NAME: 1, SERIES_NAME: 1 }
                    // расшифровка Дороги, Депо и Серии
                    let decode = await DiagnosticMap.getDataNsiSections(req, projection)
                    decode = decode?.toJSON()

                    const cardLoco = new CardLoco(this.request)
                    const device = await cardLoco.getDevicesName({VIEW_CARD: true})
                    device.forEach((itemD: any) => {
                        itemD = itemD.toJSON()
                        const noResult = 'Диагностика пока еще не проводилась, или не получено надежных данных'
                        // для секции 1
                        const sec1 = {
                            PREDICT_LEVEL: null,
                            RESULT: null
                        }
                        target.some((itemCL: any) => {
                            itemCL = itemCL.toJSON()
                            // поиск первого попавшегося PREDICT_LEVEL у оборудования с секцией 1
                            if (itemCL.SEC === 1 && itemCL.DEVICE === itemD.DEVICE_ID && itemCL.PREDICT_LEVEL && !sec1.PREDICT_LEVEL) { 
                                sec1.PREDICT_LEVEL = itemCL.PREDICT_LEVEL.toFixed(2)
                            }
                            // поиск первого попавшегося RESULT и RESULT_FIX у оборудования с секцией 1
                            if (itemCL.SEC === 1 && itemCL.DEVICE === itemD.DEVICE_ID && itemCL.RESULT && itemCL.RESULT_FIX && !sec1.RESULT) { 
                                sec1.RESULT = itemCL.RESULT
                            }
                            // true прерывает цикл,
                            return (sec1.PREDICT_LEVEL && sec1.RESULT)
                        })
                        // для секции 2
                        const sec2 = {
                            PREDICT_LEVEL: null,
                            RESULT: null
                        }
                        target.some((itemCL: any) => {
                            itemCL = itemCL.toJSON()
                            // поиск первого попавшегося PREDICT_LEVEL у оборудования с секцией 2
                            if (itemCL.SEC === 2 && itemCL.DEVICE === itemD.DEVICE_ID && itemCL.PREDICT_LEVEL && !sec2.PREDICT_LEVEL) { 
                                sec2.PREDICT_LEVEL = itemCL.PREDICT_LEVEL.toFixed(2)
                            }
                            // поиск первого попавшегося RESULT и RESULT_FIX у оборудования с секцией 2
                            if (itemCL.SEC === 2 && itemCL.DEVICE === itemD.DEVICE_ID && itemCL.RESULT && itemCL.RESULT_FIX && !sec2.RESULT) { 
                                sec2.RESULT = itemCL.RESULT
                            }
                            // true прерывает цикл,
                            return (sec2.PREDICT_LEVEL && sec2.RESULT)
                        })
                        
                        // формируем данные для передачи в UI
                        const diagnosticMap: any = {}
                        diagnosticMap.deviceName = itemD?.DEVICE_NAME || null
                        diagnosticMap.deviceComment = itemD?.COMMENT || null
                        if (decode) {
                            diagnosticMap.locoRoad = decode.ROAD_NAME  || targetLoco.LOCO_ROAD || null
                            diagnosticMap.locoDepo = decode.DEPO_NAME || targetLoco.LOCO_DEPO || null
                            diagnosticMap.locoSer = decode.SERIES_NAME || targetLoco.LOCO_SER || null
                        }
                        diagnosticMap.locoNum = targetLoco.LOCO_NUM || null
                        diagnosticMap.lastDate = moment(targetLoco.DATE).format('DD.MM.YYYY') || null
                        diagnosticMap.fileName = targetLoco.FILE_NAME || null
                        diagnosticMap.predictLevel = [sec1?.PREDICT_LEVEL || null, sec2?.PREDICT_LEVEL || null]
                        diagnosticMap.section = [1, 2]
                        diagnosticMap.message = [sec1?.RESULT || [noResult], sec2?.RESULT || [noResult]]
                        this.result.push(diagnosticMap)
                    })
                }
            }
        } catch (error) {
            this.error = error
        }
    }

    // получение данных для расшифровки Дороги, Депо и Серии
    static async getDataNsiSections(req: any, projection: any) {
        let found
        try {
            const model = await MongoDB.setMongoModel('nsi_sections', 'NSI dictionary')
            if (model) {
                found = await MongoDB.findWithProjection(req, projection, model, 'nsi_sections', 'NSI dictionary')
            }
        } catch (error) {
            console.log(error)
        }
        return found[0] || null
    }
}
export default DiagnosticMap