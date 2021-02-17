import { Request } from 'express'
import MongoDB from '../mongoDB'
import moment from 'moment'

/*
    обработка запросов для раздела Карточка локомотива
*/
class CardLoco {
    result: any[] = []
    error: any
    constructor(public request: Request) {
    }

    // метод получения данных для раскрытой карточки оборудования
    async getOpenDeviceCard(collection: string, sTypeParam: string) {
        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {
                const reqData = this.request.body                                               // фильтр по локомотиву
                reqData.DATE = { $gt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }         // добавляем фильтр на 1 месяц
                const projection = { '_id': 0, PREDICT_LEVEL: 1, SEC: 1, DATE: 1, RESULT: 1 }   // проекция
                const sort = { "DATE": -1 }                                                     // сортировка дат по убыванию
                let rawDataOneCard: any[] = await MongoDB.findProjSort(reqData, projection, sort, model, '', sTypeParam)

                const obj31Day: string[] = []
                // коллекции данных по секциям
                const mapSec1 = new Map()
                const mapSec2 = new Map()
                const mapSec3 = new Map()
                // массивы объектов с данными по секциям
                const dataSec1: any[] = []
                const dataSec2: any[] = []
                const dataSec3: any[] = []
                // данные для таблицы
                const dataTable: any[] = []

                rawDataOneCard = rawDataOneCard.map((item, i, arr) => {
                    item = item.toJSON()
                    item.DATE = moment(item.DATE).format('YYYY-MM-DD')
                    if (item.PREDICT_LEVEL) {
                        item.PREDICT_LEVEL = +item.PREDICT_LEVEL.toFixed(2)
                    }
                    if (item.RESULT) {
                        // формируем данные для таблицы
                        dataTable.push({date: item?.DATE, section: item?.SEC || 1, message: item?.RESULT})
                    }
                    // разделяем данные по секциям для графиков
                    if (item.SEC === 1 || !item?.SEC) {
                        dataSec1.push(item)
                    } else if (item.SEC === 2) {
                        dataSec2.push(item)
                    } else if (item.SEC === 3) {
                        dataSec3.push(item)
                    }
                    return item
                })
                
                for (let i = 31; i > 0; i--) {
                    const dateNow = new Date()
                    let date: any = dateNow.setDate(dateNow.getDate() - i)
                    date = moment(date).format('YYYY-MM-DD')
                    // формируем массив дат
                    obj31Day.push(date)
                    // формируем исходные коллекции для секции по которым есть данные
                    if (dataSec1.length > 0) {
                        mapSec1.set(date, 0)
                    }
                    if (dataSec2.length > 0) {
                        mapSec2.set(date, 0)
                    }
                    if (dataSec3.length > 0) {
                        mapSec3.set(date, 0)
                    }
                }

                // начальные значения для PREDICT_LEVEL
                let predictLevelSec1 = 0
                let predictLevelSec2 = 0
                let predictLevelSec3 = 0
                obj31Day.forEach((date, i, arr) => {
                    // формирование данных для графика по  Секции 1
                    if (dataSec1.length > 0 || predictLevelSec1 !== 0) {
                        const foundInd = dataSec1.findIndex(itemSec1 => itemSec1.DATE === date)
                        let foundObj: any = null
                        if (foundInd >= 0) {
                            // вырезаем найденный объект, что бы не повторять поиск
                            [foundObj] = dataSec1.splice(foundInd, 1)
                        }
                        // если в найденном объекте PREDICT_LEVEL не 0 и не null
                        if (foundObj?.PREDICT_LEVEL) {
                            predictLevelSec1 = foundObj.PREDICT_LEVEL
                            mapSec1.set(foundObj.DATE, foundObj.PREDICT_LEVEL)
                        } else {
                            // иначе добавляем в коллекцию последнее имеющееся значение
                            mapSec1.set(date, predictLevelSec1)
                        }
                    }
                    
                    // формирование данных для графика по  Секции 2
                    if (dataSec2.length > 0 || predictLevelSec2 !== 0) {
                        const foundInd = dataSec2.findIndex(itemSec2 => itemSec2.DATE === date)
                        let foundObj: any = null
                        if (foundInd >= 0) {
                            [foundObj] = dataSec2.splice(foundInd, 1)
                        }
                        if (foundObj?.PREDICT_LEVEL) {
                            predictLevelSec2 = foundObj.PREDICT_LEVEL
                            mapSec2.set(foundObj.DATE, foundObj.PREDICT_LEVEL)
                        } else {
                            mapSec2.set(date, predictLevelSec2)
                        }
                    }
                    
                    // формирование данных для графика по  Секции 3
                    if (dataSec3.length > 0 || predictLevelSec3 !== 0) {
                        const foundInd = dataSec3.findIndex(itemSec3 => itemSec3.DATE === date)
                        let foundObj: any = null
                        if (foundInd >= 0) {
                            [foundObj] = dataSec3.splice(foundInd, 1)
                        }
                        if (foundObj?.PREDICT_LEVEL) {
                            predictLevelSec3 = foundObj.PREDICT_LEVEL
                            mapSec3.set(foundObj.DATE, foundObj.PREDICT_LEVEL)
                        } else {
                            mapSec3.set(date, predictLevelSec3)
                        }
                    }
                })

                const dataChart: any[] = []
                if ( mapSec1.size > 0) {
                    let arrSec1 = Array.from(mapSec1)
                    dataChart.push({name: 1, data: arrSec1})
                }
                if ( mapSec2.size > 0) {
                    let arrSec2 = Array.from(mapSec2)
                    dataChart.push({name: 2, data: arrSec2})
                }
                if ( mapSec3.size > 0) {
                    let arrSec3 = Array.from(mapSec3)
                    dataChart.push({name: 3, data: arrSec3})
                }

                // для UI
                this.result = [{
                    dataChart,
                    dataTable
                    // dataTable: dataTable.length > 0 ? dataTable : null
                }]
            }
        } catch(error) {
            this.error = error
        }
    }

    // метод получения данных для мини карточек
    async getDataMiniCard(collection: string, sTypeParam: string) {
        // const reqData = { LOCO_SER: 640, LOCO_NUM: 317, DEVICE: 7000005, DATE: { $gt: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000) } }
        const listCards: any[] = this.request.body.LIST_CARDS                       // массив мини карточек для диагностики оборудования
        const reqData = this.request.body                                           // фильтр по локомотиву
        delete reqData.LIST_CARDS
        reqData.DATE = { $gt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }     // добавляем фильтр на 1 месяц
        const projection = { '_id': 0, PREDICT_LEVEL: 1, SEC: 1, DEVICE: 1, RESOURCE_TIME: 1, REPAIR_TIME: 1, REPAIR: 1, TRIGGER_FAIL: 1, DATE_TIME: 1, DATE: 1, FILE_NAME: 1 }        // проекция
        const sort = { "DATE": -1 }                                                 // сортировка дат по убыванию

        interface IOneMiniCard {
            deviceInfo: {
                deviceId: number,
                locoNum: number,
                locoSer: number
            },
            title: string,
            bgColor: number,                                                        // цвет фона мини карточки
            repair: string,
            resource_time: number,
            repair_time: number,
            lastDate: string,
            fileName: string,
            barChartDiagnostic: {
                section: string[],                                                  // массив номеров секций
                state: number[]                                                     // состояние оборудования
            }
        }
        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {
                for (const item of listCards) {
                    const mapMiniCards = new Map()                                  // коллекция мини карточек
                    reqData.DEVICE = item.DEVICE_ID                                 // добавляем фильтр по ИД оборудования
                    let trigger = 0                                                 // признак цвета фона (0 или 1)
                    const rawDataOneCard: any[] = await MongoDB.findProjSort(reqData, projection, sort, model, '', sTypeParam)
                    if (rawDataOneCard.length > 0) {
                        let objectWithMaxPredict = rawDataOneCard[0]                // объект у которого PREDICT_LEVEL максимален
                        let lastDate: string = ''                                   // дата последней диагностики
                        let fileName: string = ''
                        rawDataOneCard.forEach((el : any) => {
                            if (el.toJSON().PREDICT_LEVEL > objectWithMaxPredict.toJSON().PREDICT_LEVEL) {
                                objectWithMaxPredict = el
                            }
                            if ((el.toJSON().PREDICT_LEVEL > 0.8) && (el.toJSON().RESOURCE_TIME < (el.toJSON().REPAIR_TIME*0.85))) {
                                trigger = 1
                            }
                        })
                        // формируем данные для передачи в UI
                        const sec1 = rawDataOneCard.find(item => (item.toJSON().SEC === 1 || !item.toJSON()?.SEC) && item.toJSON().PREDICT_LEVEL)
                        if (sec1) {
                            const value = +sec1.toJSON().PREDICT_LEVEL.toFixed(2)
                            mapMiniCards.set('секция 1', value)
                            if ((sec1.toJSON().DATE_TIME || sec1.toJSON().DATE) && lastDate === '') {
                                lastDate = moment(sec1.toJSON().DATE_TIME).format('YYYY:MM:DD HH:mm') || moment(sec1.toJSON().DATE).format('YYYY:MM:DD HH:mm') || ''
                                fileName = sec1.toJSON().FILE_NAME ||  ''
                            }

                        }
                        const sec2 = rawDataOneCard.find(item => item.toJSON().SEC === 2 && item.toJSON().PREDICT_LEVEL)
                        if (sec2) {
                            const value = +sec2.toJSON().PREDICT_LEVEL.toFixed(2)
                            mapMiniCards.set('секция 2', value)
                            if ((sec2.toJSON().DATE_TIME || sec2.toJSON().DATE) && lastDate === '') {
                                lastDate = moment(sec2.toJSON().DATE_TIME).format('YYYY:MM:DD HH:mm') || moment(sec2.toJSON().DATE).format('YYYY:MM:DD HH:mm') || ''
                                fileName = sec2.toJSON().FILE_NAME ||  ''
                            }
                        }
                        const sec3 = rawDataOneCard.find(item => item.toJSON().SEC === 3 && item.toJSON().PREDICT_LEVEL)
                        if (sec3) {
                            const value = +sec3.toJSON().PREDICT_LEVEL.toFixed(2)
                            mapMiniCards.set('секция 3', value)
                            if ((sec3.toJSON().DATE_TIME || sec3.toJSON().DATE) && lastDate === '') {
                                lastDate = moment(sec3.toJSON().DATE_TIME).format('YYYY:MM:DD HH:mm') || moment(sec3.toJSON().DATE).format('YYYY:MM:DD HH:mm') || ''
                                fileName = sec3.toJSON().FILE_NAME ||  ''
                            }
                        }
                        let arrSection = ['']
                        if (mapMiniCards.size > 0) {
                            arrSection = Array.from(mapMiniCards.keys())
                        }
                        // для передачи в UI
                        const oneMiniCard: IOneMiniCard = {
                            deviceInfo: {
                                deviceId: item.DEVICE_ID,
                                locoNum: this.request.body.LOCO_NUM,
                                locoSer: this.request.body.LOCO_SER
                            },
                            title: item.title,
                            bgColor: trigger,
                            repair: objectWithMaxPredict?.toJSON().REPAIR || null,
                            resource_time:  objectWithMaxPredict?.toJSON().RESOURCE_TIME || null,
                            repair_time: objectWithMaxPredict?.toJSON().REPAIR_TIME || null,
                            lastDate,
                            fileName,
                            barChartDiagnostic: {
                                section: arrSection,
                                state: Array.from(mapMiniCards.values())
                            }
                        }
                        this.result.push(oneMiniCard)
                    }
                }
                // console.log("this.result", this.result)
            }
        } catch (error) {
            this.error = error
        }
    }

    // метод получения данных для таблицы Вероятность выхода из строя двигателя
    async getDataPredictEngine(projection: any, collection: string, sTypeParam: string) {
        const reqData = this.request.body
        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {
                this.result = await MongoDB.findWithProjection(reqData, projection, model, '', sTypeParam)
                this.result = this.result.map(item => {
                    item = item.toJSON()
                    item.END_TRIP = moment(item.END_TRIP).format('YYYY:MM:DD HH:mm')
                    item.PREDICT = Number(item.PREDICT.toFixed(3))
                    return item
                })
                // console.log("this.result", this.result)
            }
        } catch (error) {
            this.error = error
        }
    }

    // метод получения данных для графика Уровень аномальности двигателей на секции
    async getDataErrEngine() {
        // const reqData = { 'SER_LOC': 145, 'ZNS_LOC': 387 }
        const reqData = this.request.body
        const projection = { '_id': 0, 'PRS_LOC': 1, 'NUMBER_ENGINE': 1, 'PREDICT': 1, 'DATE_TIME': 1 }
        interface IResultArr {
            prsLoc2: any[],    // данные для графика по секции 2
            prsLoc1: any[]     // данные для графика по секции 1
        }
        let resultArr: IResultArr = {
            prsLoc1: [],
            prsLoc2: []
        }
        let target: any[] = []
        let predict1: any[] = [
            { name: "1", data: [] },
            { name: "2", data: [] },
            { name: "3", data: [] },
            { name: "4", data: [] }
        ]
        let predict2: any[] = [
            { name: "1", data: [] },
            { name: "2", data: [] },
            { name: "3", data: [] },
            { name: "4", data: [] }
        ]

        try {
            const model = await MongoDB.setMongoModel('loco_errs', 'Chart level error engine')
            if (model) {
                target = await MongoDB.findWithProjection(reqData, projection, model, '', 'Chart level error engine')
            }
            if (target.length > 0) {
                // формирование данных для apexCharts
                target.forEach(item => {
                    item = item.toJSON()
                    if (item.PRS_LOC === 1) {
                        const arrData1 = [item.DATE_TIME.getTime(), Number(item.PREDICT.toFixed(3))]
                        // данные для графика apexCharts типа scatter
                        predict1[item.NUMBER_ENGINE - 1].data.push(arrData1)
                    } else if (item.PRS_LOC === 2) {
                        const arrData2 = [item.DATE_TIME.getTime(), Number(item.PREDICT.toFixed(3))]
                        // данные для графика apexCharts типа scatter
                        predict2[item.NUMBER_ENGINE - 1].data.push(arrData2)
                    }
                })
                // для передачи в UI
                resultArr.prsLoc1 = predict1
                resultArr.prsLoc2 = predict2
            } else {
                resultArr.prsLoc1 = []
                resultArr.prsLoc2 = []
            }
        } catch (error) {
            this.error = error
        }

        // console.log("resultArr", resultArr)
        return resultArr
    }

    // метод получения данных для прогресс бара Остаточный ресурс
    async getResource() {
        const reqType = this.request.params.type
        const reqData = this.request.body
        const projection = { 'REPAIR': 1 }
        interface IResultArr {
            dataCards: any,             // из коллекции loco_cards
            dataCalcsDynamics: any[]      // из коллекции loco_calcs_dynamics
        }
        // для передачи в UI
        let resultArr: IResultArr = {
            dataCards: {},
            dataCalcsDynamics: []
        }
        
        let cards, calcsDynamics, time
        
        try {
            let model = await MongoDB.setMongoModel('loco_cards', 'Progress bar loco resource')
            const reqCards = Object.assign({}, reqData)
            reqCards["REPAIR.TO2.TYPE"] = "ТО-2"
            // запрос в Robo Mongo: db.getCollection('loco_cards').find({ LOCO_SER: 606, LOCO_NUM: 280, 'REPAIR.TO2.TYPE': 'ТО-2' }, { "REPAIR": 1 })
            if (model) {
                // получение данных из коллекции loco_cards
                [cards] = await MongoDB.findWithProjection(reqCards, projection, model, reqType, 'Progress bar loco resource')
            }
            if (cards && cards.toJSON()?.REPAIR?.TO2) {
                resultArr.dataCards = cards.toJSON()?.REPAIR?.TO2
                
                model = await MongoDB.setMongoModel('loco_calcs_dynamics', 'Progress bar loco resource')
                const reqCalcsDynamics = Object.assign({}, reqData)
                time = cards.toJSON().REPAIR.TO2.TIME
                // console.log("DATE", new Date(Date.now()), Date.now(), ' - ', time * 60 * 60 * 1000, 'миллисекунд = ', Date.now() - (time * 60 * 60 * 1000))
                reqCalcsDynamics.DATE = { $gt: new Date(Date.now() - (time * 60 * 60 * 1000)) }
                // запрос в Robo Mongo: db.getCollection('loco_calcs_dynamics').find({ LOCO_SER: 606, LOCO_NUM: 280, DATE: { $gt: new ISODate('2020-10-04T22:48:46.668Z') } }, { DATE: 1, LOCO_SER: 1, LOCO_NUM: 1, RESOURCE_DIST: 1, RESOURCE_TIME: 1, RESULT: 1 })
                if (model) {
                    // получение данных из коллекции loco_calcs_dynamics
                    calcsDynamics = await MongoDB.findBy(reqCalcsDynamics, model, '', 'Progress bar loco resource')
                }
                if (calcsDynamics) {
                    resultArr.dataCalcsDynamics = calcsDynamics
                }
            } else {
                resultArr.dataCards = []
                resultArr.dataCalcsDynamics = []
            }
            
        } catch (error) {
            this.error = error
        }
        // console.log("resultArr", resultArr)
        return resultArr
    }

    // метод получения табличных данных с проекцией
    async getDataTable(projectionParam: string, sTypeParam: string, collection: string) {
        const reqData = this.request.body
        const reqType = this.request.params.type
        const projection = { [projectionParam]: 1 }
        
        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {
                this.result = await MongoDB.findWithProjection(reqData, projection, model, reqType, sTypeParam)
            }
        } catch (error) {
            this.error = error
        }
    }

    // получение названия предприятия по коду
    async getDataNsiPreds(req: any, projection: any) {
        let preds
        try {
            const model = await MongoDB.setMongoModel('nsi_preds', 'NSI dictionary')
            if (model) {
                preds = await MongoDB.findWithProjection(req, projection, model, 'nsi_preds', 'NSI dictionary')
            }
        } catch (error) {
            this.error = error
        }
        // console.log("preds", preds)
        return preds
    }

    // расшифровка кода организации в таблице Обмер колесных пар
    async tableWheelsDecodingOrg(dataParam: any[]) {
        let measureData: any[] = []
        let orgCode: number = 0
        let date: any = null
        let type: string = ''
        if (dataParam.length > 0 && dataParam[0].toJSON()?.MEASURE && dataParam[0].toJSON()?.MEASURE?.PARAMS) {
            measureData = Object.values(dataParam[0].toJSON().MEASURE.PARAMS)
            orgCode = dataParam[0].toJSON().MEASURE.ORG_CODE
            date = dataParam[0].toJSON().MEASURE.DATE
            type = dataParam[0].toJSON().MEASURE.TYPE
        }
        // если есть данные по обмерам колесных пар
        if (measureData.length > 0) {
            const req = { OTR_KOD: orgCode }
            const projection = { OTR_KOD: 1, NAME_S1: 1 }
            // получение массива предприятии по коду
            // db.getCollection('nsi_preds').find({OTR_KOD: 39639}, { OTR_KOD: 1, NAME_S1: 1 })
            const [resPred] = await this.getDataNsiPreds(req, projection)
            // если соответствие названия и кода организации найдено
            if (resPred) {
                measureData = measureData.map(item => {
                    // добавляем поля для UI
                    item.ORG_FOR_TITLE = resPred
                    item.DATE_FOR_TITLE = date
                    item.TYPE_FOR_TITLE = type
                    return item
                })
            } else {
                measureData = measureData.map(item => {
                    // добавляем поля для UI
                    item.ORG_FOR_TITLE = orgCode
                    item.DATE_FOR_TITLE = date
                    item.TYPE_FOR_TITLE = type
                    return item
                })
            }

        } else {
            measureData = []
        }
        return measureData
    }

    // метод получения данных для графиков Предиктивной оценки тех. состояния локомотива и Уровень состояния оборудования
    async getDataChartPredictAndLevel(sTypeParam: string, collection: string) {
        const reqData = this.request.body
        reqData.DATE = { $gt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }
        const reqType = this.request.params.type
        interface IResultArr{
            chartPredictState: any[],   // для графика Предиктивной оценки тех. состояния локомотива
            chartLevelState: {          // для графика Уровень состояния оборудования
                device?: any[],
                state?: any []
            }
        }
        // для передачи в UI
        let resultArr: IResultArr = {
            chartPredictState: [],
            chartLevelState: {
                device: [],
                state: []
            }
        }

        try {
            const model = await MongoDB.setMongoModel(collection, sTypeParam)
            if (model) {  
                // TODO проверить необходимость сортировкой по дате получаемых из монги данных
                // запрос в Robo Mongo: db.getCollection('loco_calcs_dynamics').find({ "LOCO_SER_ID": 816966075, "LOCO_NUM" : 280, "DATE": {$gte: new ISODate("2020-09-17T17:29:20.201Z")} }).sort({ "DATE": -1 })
                this.result = await MongoDB.findBy(reqData, model, reqType, sTypeParam)
                // console.log("this.result",this.result);
            }
        } catch (error) {
            this.error = error
        }

        if (this.result.length > 0) {
            // полученные данные
            let resData: any[] = this.result
            // меняем формат даты в полученных данных к единому стилю 
            resData = resData.map(item => {
                item.DATE = moment(item.toJSON().DATE).format('YYYY-MM-DD')
                return item
            })
            // коллекция с 31 ключом в виде даты на каждый день заданного периода
            const map31Days = new Map()
            // коллекция с уникальным оборудованием
            const mapDevice = new Map()
            // сумма значений оценки состояния локомотива по всему оборудованию
            let sum: number = 0
            // список оборудования для расшифровки кодов
            const objNameDevices = await this.getDevicesName()
            // цикл по 31-му дню
            for (let i: number = 30; i >= 0; i--) {
                const dateNow = new Date()
                let date: any = dateNow.setDate(dateNow.getDate() - i)
                date = moment(date).format('YYYY-MM-DD')
                
                for (let i: number = 0; i < resData.length; i++) {
                    const findInd = resData.findIndex(item => item.DATE === date)
                    if (findInd >= 0) {
                        // удаляем, что бы ни повторять поиск в этом элементе массива
                        const [removedItem] = resData.splice(findInd, 1)
                        // const objNameDevices = await this.getDevicesName()
                        // находим название оборудования по коду оборудования
                        const foundNameObj = objNameDevices.find( item => item.toJSON().DEVICE_ID === removedItem.toJSON().DEVICE)
                        if (removedItem && removedItem.toJSON().PREDICT_LEVEL) {
                            removedItem.PREDICT_LEVEL = +removedItem.toJSON().PREDICT_LEVEL.toFixed(2)
                        }
                        // обновляем коллекцию с оборудованием, если данного оборудования нет, оно добавляется, если есть обновляется значение
                        mapDevice.set(foundNameObj.toJSON().DEVICE_NAME, removedItem.PREDICT_LEVEL)
                        // mapDevice.set(foundNameObj.toJSON().DEVICE_NAME, +removedItem.toJSON().PREDICT_LEVEL.toFixed(2))
                    } else {
                        // в массиве не найдены совпадения по дате, завершаем цикл for
                        break
                    }
                }

                // суммируем значения в коллекции с уникальным оборудованием
                // ТРЕБУЕТ РЕФАКТОРИНГА
                let tempSum: number = 0
                mapDevice.forEach((value: any) => {
                    if (tempSum <= value){
                        tempSum = value
                    } 
                })
                sum = tempSum

                // формируем коллекцию
                map31Days.set(date, +sum.toFixed(2))
            }

            // console.log("map31Days", map31Days)
            // console.log("mapDevice", mapDevice)
            // console.log("resultArr", resultArr)
            resultArr.chartPredictState = Array.from(map31Days)

            resultArr.chartLevelState.device = Array.from(mapDevice.keys())
            resultArr.chartLevelState.state = Array.from(mapDevice.values())
            // console.log("resultArr", resultArr)
        }
        return resultArr
    }

    // данные для расшифровки кода Оборудования
    async getDevicesName(reqData = {}) {
        let nameDevices: any[] = []
        try {
            const model = await MongoDB.setMongoModel('loco_devices', 'Loco name divices')
            if (model) {
                nameDevices = await MongoDB.findBy(reqData, model, '', 'loco_devices')
            }
        } catch (error) {
            this.error = error
        }
        return nameDevices
    }
}
export default CardLoco