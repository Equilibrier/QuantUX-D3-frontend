import DIProvider from 'core/di/DIProvider'
import { MvvmSettingsService as MvvmSettings } from 'core/di/MvvmSettingsService'
import {Debouncer} from 'util/generic_utils'

export class OutputQueriesModuleSendingService {
    
    constructor() {

        this.queue_ = {}

        this.__private = {
            
            debouncer_: new Debouncer(this),

            scheduleConsume: () => {
                return this.__private.debouncer_.debounce(() => {
                    if (Object.keys(this.queue_).length > 0 && !DIProvider.isMvvmRunning()) {// if we have arrived external messages, we try to inject them into mvvm, only if it is not already done automatically, by the current running flow
                        console.error(`scheduleConsume() - VA FI CONSUMAT si queue length este ${Object.keys(this.queue_).length}`)
                        /*await */DIProvider.executeMvvm("return MVVM_CONTROLLER.Compute()") // if mvvm is not running, we run it forcely, because we have unconsumed external messages from this module, to be processed; we provide empty script, because input-module injecting code is already implemented into ScriptMixin.runScript(...) and we only need to trigger it
                    }
                }, 300)()
            }
        }
    }

    async sendExternalQuery(senderId, queryMsg) {
        
        const url_ = (await DIProvider.mvvmSettings().data())[MvvmSettings.KEY__HOST_OUTPUT_QUERY_MODULE_SERVER()]
        const orderId_ = DIProvider.externalCallsService().registerCall(url_, queryMsg)
        const results_ = await DIProvider.externalCallsService().waitForResult(orderId_)
        console.log(`OutputQueriesModuleSendingService: Inserting response in queue, for query ${JSON.stringify(queryMsg)}. Will be send asap to mvvm consume logic...`)
        this.queue_[orderId_] = {
            sender: senderId,
            query: queryMsg,
            response: results_
        }

        this.__private.scheduleConsume()
    }

    consume() {
        // console.log(`queue length: ${Object.keys(this.queue_).length}`)
        const oid_ = Object.keys(this.queue_).shift()
        const val_ = this.queue_[oid_]
        delete this.queue_[oid_]
        return val_
    }

    clearQueue() { this.queue_ = {} }
}