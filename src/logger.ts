import { Logger } from 'tslog'

export const log = new Logger({ name: 'common' })
export const chartLog = new Logger({ name: 'chart' })
export const authLog = new Logger({ name: 'auth' })
export const hasuraLog = new Logger({ name: 'hasura' })
