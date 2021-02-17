import { Router, Request, Response, NextFunction } from 'express'
import Mery from '../../services/crews/mery'
import Logger from '../../utils/logger';

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Mery(request)

    await resultForClient.getMery()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router