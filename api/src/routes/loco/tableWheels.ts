import { Router, Request, Response, NextFunction } from 'express'
import CardLoco from '../../services/loco/cardLoco'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new CardLoco(request)
    await resultForClient.getDataTable('MEASURE', 'Wheels loco table', 'loco_cards')
    // расшифровка кода организации
    const forUI = await resultForClient.tableWheelsDecodingOrg(resultForClient.result)

    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(forUI)
    }
})

module.exports = router