import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new CardLoco(request)
    await resultForClient.getDataTable('CRASH_HIST', 'History loco table', 'loco_crashs')

    let historyData: any[] = []
    if (resultForClient.result.length > 0 && resultForClient.result[0].toJSON()?.CRASH_HIST) {
        historyData = Object.values(resultForClient.result[0].toJSON().CRASH_HIST)
    }

    // с помощью коллекции Set формируем уникальные значения и затем преобразуем в обычный массив
    let codes = Array.from(new Set(historyData.map(item => item.FINAL_GUILTY_FIRM)))
    const req = { OTR_KOD: { $in: codes } }
    const projection = { OTR_KOD: 1, NAME_S1: 1 }
    // получение массива предприятии по коду
    // db.getCollection('nsi_preds').find({OTR_KOD: {$in: [372880, 312836, 36742]}})
    const resPreds = await resultForClient.getDataNsiPreds(req, projection)

    historyData = historyData.map(item => {
        // устанавливаем в поле ORG название предприятия соответствующее коду предприятия
        const tempResult = resPreds.find((item2: any) => item2.toJSON().OTR_KOD === item.FINAL_GUILTY_FIRM)
        tempResult ? item.FINAL_GUILTY_FIRM = tempResult.toJSON().NAME_S1 : item.FINAL_GUILTY_FIRM = ''
        return item
    })
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(historyData);
    }
})

module.exports = router