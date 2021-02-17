import { Router } from 'express';
const router = Router()
import Caclulation from '../../services/calculator/calculation'

router.post('/:type', async (request, response, next) => {
    const resultForClient = new Caclulation(request)
    await resultForClient.mainCalculation()
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.send(resultForClient.result);
    }
})
router.post('/:type/save', async (request, response, next) => {
    const saveResult = new Caclulation(request)
    await saveResult.saveResultToDB()
    if (saveResult.error) {
        next(saveResult.error)
    } else {
        response.send(saveResult.result);
    }
})
router.post('/:type/compare', async (request, response, next) => {
    const saveResult = new Caclulation(request)
    await saveResult.getCompareTables()
    if (saveResult.error) {
        next(saveResult.error)
    } else {
        response.send(saveResult.result);
    }
})

module.exports = router