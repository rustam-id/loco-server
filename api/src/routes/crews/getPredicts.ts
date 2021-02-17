import { Router, Request, Response, NextFunction } from 'express'
import Predicts from '../../services/crews/predictAnalytics'
import Logger from '../../utils/logger';

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Predicts(request)

    await resultForClient.getPredicts()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router