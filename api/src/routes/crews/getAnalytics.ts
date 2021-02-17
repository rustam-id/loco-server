import { Router, Request, Response, NextFunction } from 'express'
import Analytics from '../../services/crews/analytics'
import Logger from '../../utils/logger';

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Analytics(request)

    await resultForClient.getAnalytics()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router