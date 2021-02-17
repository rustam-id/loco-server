import { Router, Request, Response, NextFunction } from 'express'
import Dictionary from '../services/dictionary'

const router = Router();

router.post('/:type', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Dictionary(request)
    await resultForClient.getNSI()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router