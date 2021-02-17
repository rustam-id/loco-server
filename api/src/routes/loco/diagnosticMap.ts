import { Router, Request, Response, NextFunction } from 'express'
import DiagnosticMap from '../../services/loco/diagnosticMap'

const router = Router();

router.post('/', async (request: Request, response: Response, next: NextFunction) => {   
    const resultForClient = new DiagnosticMap(request)
    await resultForClient.getDataDiagnostic('loco_calcs_dynamics', 'Diagnostic Map')
    if (resultForClient.error) {
        next(resultForClient.error)
    } else {
        response.status(200).send(resultForClient.result)
    }
})

module.exports = router