import { Router, Request, Response, NextFunction } from 'express'
import DKFS from '../../services/crews/DKFS'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {
    const resultForClient = new DKFS(request)

    await resultForClient.getDKFS_Report()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})

module.exports = router