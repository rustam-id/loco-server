import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new CardLoco(request)
    const projection = { '_id': 0, END_TRIP: 1, PRS_LOC: 1, NUMBER_ENGINE: 1, PREDICT: 1 }
    await resultForClient.getDataPredictEngine(projection, 'loco_predicts', 'Predict engine')
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router