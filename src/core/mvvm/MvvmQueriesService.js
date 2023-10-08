import DIProvider from 'core/di/DIProvider'
import {Debouncer} from 'util/generic_utils'
import {fetchGETWithAuthorization} from 'core/mvvm/mvvm_fetching_utils'

export class MvvmQueriesService {
    
    constructor() {

        this.queue_ = []
        this.cache_ = {} // this is a simple cache, but a very powerful feature for the simulation (and the mvvm PROD code as well) session

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

    async sendExternalQuery(senderId, queryEndpoint, forceRetrieve=false) {
        
        let results_ = null
        if (queryEndpoint in this.cache_ && !forceRetrieve) {
            results_ = this.cache_[queryEndpoint]
        }
        else {
            //const url_ = (await DIProvider.mvvmSettings().data())[MvvmSettings.KEY__HOST_OUTPUT_QUERY_MODULE_SERVER()]
            const repoName_ = DIProvider.model().mvvm_repo_name
            const authToken_ = DIProvider.simulationAuthorizeToken()
            const url_ = `/mvvm/apigateway/${repoName_}/${queryEndpoint}`
            try {
                results_ = await fetchGETWithAuthorization(url_, authToken_)
                this.cache_[queryEndpoint] = results_
            }
            catch(e) {
                console.error(e)
            }
        }
        console.log(`MvvmQueriesService: Inserting response in queue, for query ${JSON.stringify(queryMsg)}. Will be send asap to mvvm consume logic...`)
        this.queue_.push({
            sender: senderId,
            query: queryEndpoint,
            response: results_
        })

        this.__private.scheduleConsume()
    }

    consume() {
        // console.log(`queue length: ${Object.keys(this.queue_).length}`)
        //const oid_ = Object.keys(this.queue_).shift()
        //const val_ = this.queue_[oid_]
        //delete this.queue_[oid_]
        return this.queue_.shift()
        //return val_
    }

    clearQueue() { this.queue_ = []; this.cache_ = {} }
}