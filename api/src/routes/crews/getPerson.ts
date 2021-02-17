import { Router, Request, Response, NextFunction } from 'express'
import Person from '../../services/crews/person'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new Person(request)

    await resultForClient.getPerson()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router