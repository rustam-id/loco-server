import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new CardLoco(request)
    const forUI = await resultForClient.getDataChartPredictAndLevel('Loco predictive and level chart', 'loco_calcs_dynamics')
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(forUI);
    }
})

module.exports = router