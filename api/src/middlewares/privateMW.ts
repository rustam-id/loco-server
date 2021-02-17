import { Request, Response, NextFunction } from 'express'
import Logger from '../utils/logger'
const keys = require('../config/keys')

// access control by ip
export function accesByIPHandler(req: Request, res: Response, next: NextFunction) {
    if (process.env.ACCESS_MODE === 'private') {
        let requestIP: any = req.connection.remoteAddress;
        if (keys.privacy.trustedIps.indexOf(requestIP) >= 0) {
            next()
        } else {
            Logger.error(`Error:access denied for  ip ${req.connection.remoteAddress} - /${req.method} ${req.protocol}://${req.get('host')}${req.path}`)
            res.status(500).send(`Access denied for your ip: ${req.connection.remoteAddress}`)
        }
    } else {
        next()
    }

}
