import { Request } from 'express'
const reportStruct = require('../../static/predictCrewsStruct')       // the basic templates struct description
import Predict from './generalPredict'
import QueryBuilder from '../../utils/queryBuilder';
import { IQueryBuilderArgs } from '../../interfaces/index'
import moment from 'moment'

/*
    формирование данных для таблицы ДКФС
*/
class MonitoringCrews extends Predict {
    serviceType: string = 'Monitoring data crews'
    report_struct: any

    constructor(public request: Request) {
        super(request)
        this.report_struct = reportStruct[this.request.body.page]
    }
    // основная управляющая ф-я
    async get_Report() {
        this.result = await this.handleResultTable()
    }

    // формирование итоговой таблицы
    async handleResultTable() {
        const headers = this.computeHeaders()
        const items = await this.computeRows(headers)
        const meta = this.getMetaTableData()
        const table = { headers, items, meta }
        return table
    }

    computeHeaders() {
        return this.report_struct.headers
    }

    getMetaTableData() {
        return {
            table_name: this.report_struct.table_name
        }
    }

    async computeRows(headers: any[]) {
        let items: any[] = []
        let logInfo = `${this.request.body.page} crews item`         // label for logging
        let aggregateParams: IQueryBuilderArgs = {
            basicFilter: {}
        }
        let query = QueryBuilder(aggregateParams, this.report_struct.table_name.value)
        let aggregateResult = await super.getPredictData(query, this.report_struct.collection, logInfo)
        if (!aggregateResult) return []
        aggregateResult.forEach((aggrItem: any) => {
            aggrItem.DAYS_EXPIRE = this.computeDaysExpire(aggrItem)
            aggrItem.CTIME = this.formatCTIME(aggrItem)
            items = [...items, aggrItem]
        })
        return items
    }

    computeDaysExpire(aggrItem: any) {
        let { CTIME, DAYS_EXPIRE } = aggrItem
        let currDate = moment()
        let expDate = moment(CTIME).add(DAYS_EXPIRE, 'days')
        let deltaDays = moment.duration((currDate.diff(expDate))).days()
        DAYS_EXPIRE = {
            status: this.computeExpiredStatus(deltaDays),
            deltaDays
        }
        return DAYS_EXPIRE
    }

    computeExpiredStatus(deltaDays: number) {
        let status = 'green'
        if (deltaDays > 1) {
            status = 'red'
        }
        if (deltaDays === 1) {
            status = 'yellow'
        }
        return status
    }

    formatCTIME(aggrItem: any) {
        let { CTIME } = aggrItem
        CTIME = moment(CTIME).utc().format('YYYY-MM-DD HH:mm:ss')
        return CTIME
    }
}
export default MonitoringCrews