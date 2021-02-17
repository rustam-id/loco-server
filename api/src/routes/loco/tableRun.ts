import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new CardLoco(request)

    // данные по Пробегам
    await resultForClient.getDataTable('REPAIR', 'Loco run table (repair)', 'loco_cards')
    // let repairData: any[] = resultForClient.result[0].toJSON().REPAIR
    let repairData: any[] = []
    if (resultForClient.result.length > 0 && resultForClient.result[0].toJSON()?.REPAIR) {
        repairData = Object.values(resultForClient.result[0].toJSON().REPAIR)
    }

    // если пришли актуальные данные
    if (repairData.length > 0 && repairData[0].TYPE) {
        // с помощью коллекции Set формируем уникальные значения и затем преобразуем в обычный массив
        let codes = Array.from( new Set( repairData.map(item => item.ORG_CODE)))
        const req = { OTR_KOD: { $in: codes } }
        const projection = { OTR_KOD: 1, NAME_S1: 1 }
        // получение массива предприятии по коду
        // db.getCollection('nsi_preds').find({OTR_KOD: {$in: [372880, 312836, 36742]}})
        const resPreds = await resultForClient.getDataNsiPreds(req, projection)
        
        repairData = repairData.map(item => {
            // устанавливаем в поле ORG название предприятия соответствующее коду предприятия
            const tempResult = resPreds.find((item2: any) => item2.toJSON().OTR_KOD === item.ORG_CODE)
            tempResult ? item.ORG = tempResult.toJSON().NAME_S1 : item.ORG = ''
            return item
        })
    } else {
        repairData = []
    }
    

    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(repairData);
    }
})

module.exports = router