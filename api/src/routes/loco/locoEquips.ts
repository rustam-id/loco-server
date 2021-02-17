import { Router, Request, Response, NextFunction } from 'express'
import DigitalLoco from '../../services/loco/digitalLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new DigitalLoco(request)
    await resultForClient.getEquips()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router