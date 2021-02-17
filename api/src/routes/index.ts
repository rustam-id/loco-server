import { Router } from 'express';

import { awaitTimeLogger } from '../middlewares/timerMW';

const getLogsRoute = require('./getLogs')
const getDictRoute = require('./getDictionary')

const getCalcRoute = require('./calculator/locoCalc')

const getRatingRoute = require('./crews/getRating')
const getMeryRoute = require('./crews/getMery')
const getAnalyticsRoute = require('./crews/getAnalytics')
const getPredictsRoute = require('./crews/getPredicts')
const getPersonRoute = require('./crews/getPerson')
const getAnalyticDKFSRoute = require('./crews/analyticDKFS')
const getMonitoringCrewsRoute = require('./crews/monitoringCrews')
const getTimeViolsCrewRoute = require('./crews/timeViolsCrew')

const getDislocationRoute = require('./loco/dislocation')
const getMiniCardDiagnosticRoute = require('./loco/miniCardDiagnostic')
const getOpenCardDiagnosticRoute = require('./loco/openCardDiagnostic')
const getChartErrEngineRoute = require('./loco/chartErrEngine')
const getTablePredictEngineRoute = require('./loco/tablePredictEngine')
const getTableRunRoute = require('./loco/tableRun')
const getTableWheelsRoute = require('./loco/tableWheels')
const getTableHistoryRoute = require('./loco/tableHistory')
const getChartPredictAndLevelRoute = require('./loco/chartPredictAndLevel')
const getLocoResourceRoute = require('./loco/locoResource')
const getLocoEquipsRoute = require('./loco/locoEquips')
const getCalcTygResourceLocoRoute = require('./loco/calcTygResourceLoco')
const getDiagnosticMapRoute = require('./loco/diagnosticMap')

const router = Router()

/* 
    system services routes
*/
router.use('/logs', getLogsRoute)                        // маршрут для доступа к логам
router.use('/dictionary', getDictRoute)                 // маршрут для получения словарей дорог и тд.

/*
    calculation services routes
*/
router.use('/loco_calc', getCalcRoute)                 // маршрут для обращений к калькулятору

/*
    crews routes
*/
router.use('/rating', awaitTimeLogger, getRatingRoute)                 // маршрут для получения данных к таблице рейтинга бригад
router.use('/mery', awaitTimeLogger, getMeryRoute)                 // маршрут для получения данных по мерам
router.use('/analytics', awaitTimeLogger, getAnalyticsRoute)                 // маршрут для получения аналитики
router.use('/predicts', awaitTimeLogger, getPredictsRoute)                 // маршрут для получения прогнозов
router.use('/person', awaitTimeLogger, getPersonRoute)                 // маршрут для карточки машиниста
router.use('/analytic_dkfs', awaitTimeLogger, getAnalyticDKFSRoute)                     // маршрут получения данных для таблицы Анлитики ДКФС
router.use('/monitoring_data_crew', awaitTimeLogger, getMonitoringCrewsRoute)                     // маршрут получения данных по бригадам для таблицы Мониторинг поступления данных
router.use('/time_viols_crew', awaitTimeLogger, getTimeViolsCrewRoute)                     // маршрут получения данных по бригадам для таблицы Анализ соответствия выявляемых нарушений бригад времени работы

/*
    loco routes
*/
router.use('/dislocation', getDislocationRoute)                     // маршрут получения данных для таблицы Пробеги
router.use('/miniCardDiagnostic', getMiniCardDiagnosticRoute)       // маршрут получения данных для мини карточек диагностики
router.use('/openCardDiagnostic', getOpenCardDiagnosticRoute)       // маршрут получения данных для раскрытой карточки оборудования
router.use('/chartErrEngine', getChartErrEngineRoute)               // маршрут получения данных для графика Уровень аномальности двигателей на секции
router.use('/tablePredictEngine', getTablePredictEngineRoute)       // маршрут получения данных для таблицы Вероятность выхода из строя двигателя
router.use('/tableRun', getTableRunRoute)                           // маршрут получения данных для таблицы Пробеги
router.use('/tableWheels', getTableWheelsRoute)                     // маршрут получения данных для таблицы Обмеры колесных пар
router.use('/tableHistory', getTableHistoryRoute)                   // маршрут получения данных для таблицы История неплановых ремонтов
router.use('/chartPredictAndLevel', getChartPredictAndLevelRoute)   // маршрут получения данных для графиков Предиктивной оц. тех. сост. локо. и Уровня сост. оборуд.
router.use('/locoResource', getLocoResourceRoute)                   // маршрут получения данных для прогресс бара Остаточный ресурс
router.use('/locoEquips', getLocoEquipsRoute)                       // маршрут получения данных по оборудованию для цифрового двойника
router.use('/calcTygResourceLoco', getCalcTygResourceLocoRoute)     // маршрут получения данных для расчета Оценки эффективности тяговых ресурсов
router.use('/diagnosticMap', getDiagnosticMapRoute)                 // маршрут получения данных для Диагностической карты

export default router