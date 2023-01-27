import DIProvider from 'core/di/DIProvider'
import Mvvm from 'core/di/MvvmSettingsService'

export class OutputsModuleExternalService {
    
    constructor() {
    }

    sendExternalNotification(msg) {
        const url_ = DIProvider.mvvmSettings().data[Mvvm.KEY__HOST_OUTPUT_MODULE_SERVER()]
        DIProvider.externalCallsService().registerCall(url_, msg)
    }
    // sendExternalQuery(msg)
}