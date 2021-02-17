import { Request, response } from 'express'
import MongoDB from '../mongoDB'
import moment from 'moment'
import CardLoco from './cardLoco'

/*
    обработка запросов для Цифрового двойника локомотива
*/
class DigitalLoco {
    result: any[] = []
    error: any
    constructor(public request: Request) {
    }

    // метод получения данных по оборудованию цифрового двойника
    async getEquips() {
        const reqData = this.request.body
        const reqType = this.request.params.type
        const projection = { 'EQUIP': 1, '_id': 0 }
        
        try {
            const model = await MongoDB.setMongoModel('loco_equips', 'Data equip for digital loco')
            if (model) {
                let target = await MongoDB.findWithProjection(reqData, projection, model, reqType, 'Data equip for digital loco')
                if (target.length > 0) {
                    let firmCodes: any[] = []
                    let setFirmCodes = new Set()
                    target = Object.values(target[0].toJSON().EQUIP)
                    target = target.map((item: any) => {
                        item?.EQ_CHANGE_DATE ? item.EQ_CHANGE_DATE = moment(item.EQ_CHANGE_DATE).format('YYYY:MM:DD HH:mm') : item.EQ_CHANGE_DATE = null
                        item?.EQ_LAST_CHECK ? item.EQ_LAST_CHECK = moment(item.EQ_LAST_CHECK).format('YYYY:MM:DD HH:mm') : item.EQ_LAST_CHECK = null
                        item?.EQ_REPAIR_DATE ? item.EQ_REPAIR_DATE = moment(item.EQ_REPAIR_DATE).format('YYYY:MM:DD HH:mm') : item.EQ_REPAIR_DATE = null
                        if (item.REPAIR_COD_FIRM) { 
                            // формируем коллекцию уникальных кодов предприятий
                            setFirmCodes.add(item.REPAIR_COD_FIRM)
                        }
                        return item
                    })
                    // получение массива уникальных кодов предприятий
                    firmCodes = Array.from(setFirmCodes)
                    const cardLoco = new CardLoco(this.request)
                    const req = { OTR_KOD: { $in: firmCodes } }
                    const projection = { OTR_KOD: 1, NAME_S1: 1 }
                    // получение массива названий предприятий
                    const firmNames = await cardLoco.getDataNsiPreds(req, projection)
                    target = target.map((item: any) => {
                        // устанавливаем в поле REPAIR_COD_FIRM название предприятия соответствующее коду предприятия
                        const tempResult = firmNames.find((item2: any) => item2.toJSON().OTR_KOD === item.REPAIR_COD_FIRM)
                        tempResult ? item.REPAIR_COD_FIRM = tempResult.toJSON().NAME_S1 : item.REPAIR_COD_FIRM
                        return item
                    })

                    this.result = target
                }
            }
        } catch (error) {
            this.error = error
        }
    }
}
export default DigitalLoco