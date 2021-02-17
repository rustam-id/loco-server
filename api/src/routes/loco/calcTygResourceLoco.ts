import { Router, Request, Response, NextFunction } from 'express'
import TygResourceLoco from '../../services/loco/tygResourceLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new TygResourceLoco(request)
    await resultForClient.calcResource()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.status(200).send(resultForClient.result)
    }
})

module.exports = router