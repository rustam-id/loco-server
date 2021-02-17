import { Router, Request, Response, NextFunction } from 'express'
import TimeViolsCrew from '../../services/crews/timeViolsCrew'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new TimeViolsCrew(request)

    await resultForClient.get_Report()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router