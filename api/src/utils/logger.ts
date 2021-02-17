const { transports, createLogger, format } = require('winston');
const { combine, timestamp, label, printf } = format;
const keys = require('../config/keys')
require('winston-mongodb');

const msgFormat = printf(({ level, message, timestamp }: any) => {
    return `[${timestamp}]  [${level}]: [${message}]`;
});

// настройки сервиса логирования
const LoggerInstance = createLogger({
    format: format.combine(
        format.timestamp(),
        format.simple(),
        msgFormat,
    ),
    transports: [
        new transports.File({
            filename: `${keys.LOGS_DIR}/error.log`,
            level: 'error',
            maxsize: keys.logs.maxLogFileSizeBytes,
        }),
        new transports.File({
            filename: `${keys.LOGS_DIR}/combined.log`,
            maxsize: keys.logs.maxLogFileSizeBytes,
        }),
        // new transports.MongoDB({
        //     silent: false,           // выключает логирование в монгу
        //     db: keys.mongo.mongoURL,
        //     collection: keys.logs.mongoCollection,
        //     expireAfterSeconds: keys.mongo.timeToLiveSeconds,   // время хранения записей
        // }),
        new transports.Console({ 
            format: format.combine(
                format.cli() ,
                msgFormat,
            ),
        })
    ]
});


export default LoggerInstance;