import { Request, Response, NextFunction } from 'express'
import Logger from '../utils/logger'


// логирование времени обработки запросов
export function awaitTimeLogger(req: Request, res: Response, next: NextFunction) {
    const startHrTime = process.hrtime();
    res.on("finish", () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
        Logger.info(`MW awaiting time ${req.path} ${elapsedTimeInMs}`);
    })
    next()
}
