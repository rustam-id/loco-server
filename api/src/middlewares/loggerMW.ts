import { Request, Response, NextFunction } from 'express'
import Logger from '../utils/logger'

// логирование происходящих запросов
export function requestsLogger(req: Request, res: Response, next: NextFunction) {
    Logger.info(`request from IP: ${req.ip} - /${req.method} ${req.protocol}://${req.get('host')}${req.path}`)
    next()
}
// логирование ошибок запросов
export function requestsErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    Logger.error(`Error: ${err.message}. request from IP: ${req.ip} - /${req.method} ${req.protocol}://${req.get('host')}${req.path}`)
    if (!err.statusCode) err.statusCode = 500
    res.status(err.statusCode).send(err.message)
}