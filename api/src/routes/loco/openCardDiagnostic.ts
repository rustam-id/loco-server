import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new CardLoco(request)
    await resultForClient.getOpenDeviceCard('loco_calcs_dynamics', 'Open card diagnostic')
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router