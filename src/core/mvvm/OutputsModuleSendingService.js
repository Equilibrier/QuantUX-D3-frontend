import DIProvider from 'core/di/DIProvider'
import { MvvmSettingsService as MvvmSettings } from 'core/di/MvvmSettingsService'

export class OutputsModuleSendingService {
    
    constructor() {
    }

    async sendExternalNotification(msg) {
        const url_ = (await DIProvider.mvvmSettings().data())[MvvmSettings.KEY__HOST_OUTPUT_MODULE_SERVER()]
        DIProvider.externalCallsService().registerCall(url_, msg)
    }
    // sendExternalQuery(msg)
}