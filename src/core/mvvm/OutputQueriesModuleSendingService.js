import DIProvider from 'core/di/DIProvider'
import { MvvmSettingsService as MvvmSettings } from 'core/di/MvvmSettingsService'

export class OutputQueriesModuleSendingService {
    
    constructor() {
        this.queue_ = {}
    }

    async sendExternalQuery(senderId, queryMsg) {
        const url_ = (await DIProvider.mvvmSettings().data())[MvvmSettings.KEY__HOST_OUTPUT_QUERY_MODULE_SERVER()]
        const orderId_ = DIProvider.externalCallsService().registerCall(url_, queryMsg)
        const results_ = await DIProvider.externalCallsService().waitForResult(orderId_)
        this.queue_[orderId_] = {
            sender: senderId,
            query: queryMsg,
            response: results_
        }
    }

    consume() {
        return Object.values(this.queue_).shift()
    }
}