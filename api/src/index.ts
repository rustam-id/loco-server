const keys = require('./config/keys')
import Logger from './utils/logger'
import express from 'express'

function startServer(): void {
    const app = express()

    require('./loaders').default({ expressApp: app })

    app.listen(keys.PORT, () => {
        Logger.info(`Server started at ${Date()} on PORT: ${keys.PORT}`)
    }).on('error', (err: Error) => {
        if (err) {
            Logger.error(`index.startServer: server start error: ${err}`)
            process.exit(0)
        }
    });
}

startServer()

