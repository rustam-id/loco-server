import { Router, Request, Response, NextFunction } from 'express'
import Rating from '../../services/crews/rating'
import Logger from '../../utils/logger';

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Rating(request)
    
    await resultForClient.getRatings()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router