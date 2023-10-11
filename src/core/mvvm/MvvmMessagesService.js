import DIProvider from 'core/di/DIProvider'
import {Debouncer} from 'util/generic_utils'
import {fetchPOSTWithAuthorization} from 'core/mvvm/mvvm_fetching_utils'

export class MvvmMessagesService {
    
    constructor() {
        this.queue_ = []

        this.__private = {
            debouncer_: new Debouncer(this),
            inProcessing_: false,

            scheduleProcess: () => {
                return this.__private.debouncer_.debounce(() => {
                    if (this.queue_.length > 0 && !this.__private.inProcessing_) {// if we have arrived external messages, we try to inject them into mvvm, only if it is not already done automatically, by the current running flow
                        const {endpoint, data} = this.queue_.shift()
                        this.__private.processQueueItem(endpoint, data)
                    }
                }, 300)()
            },

            'processQueueItem': async (endpoint, data) => {
                this.__private.inProcessing_ = true

                const repoName_ = DIProvider.model().mvvm_repo_name
                const authToken_ = DIProvider.simulationAuthorizeToken()
                // @TODO idempotent call, so generating an unique id to resend the message if it fails... should store a queue with un ACK ed messages...
                const url_ = `/mvvm/apigateway/${repoName_}/${endpoint}`
                try {
                    /*const results_ = */await fetchPOSTWithAuthorization(url_, data, authToken_)
                }
                catch(e) {
                    console.error(e) // TODO resend the message after some time, with N max tries and a real console.critical/error message if the message didn't succeeded afterwords
                    // TODO if the apigateway ping/alive mechanism is already implemented, there can be a centralizing class/singleton that manages this functioning or non-functioning state of the api-gateway server and this kind of situations (likewise when a mvvm query was not sent correcly) can be implemented as anotehr source of non-functioning state registering, additionally to the ping() (with setInterval) call -> that class can notify some visual component that can trigger the spash layer with the error, on the current screen
                }

                this.__private.inProcessing_ = false
            }
        }
    }

    async sendExternalMessage(endpoint, data) {
        this.queue_.push({
            endpoint,
            data
        })
        this.__private.scheduleProcess()
    }

    clearQueue() {
        this.queue_ = []
    }
}