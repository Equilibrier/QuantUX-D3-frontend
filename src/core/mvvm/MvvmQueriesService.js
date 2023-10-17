import DIProvider from 'core/di/DIProvider'
import {Debouncer} from 'util/generic_utils'
import {fetchGETWithAuthorization} from 'core/mvvm/mvvm_fetching_utils'
import {generateUuid} from 'util/generic_utils'

export class MvvmQueriesService {
    
    constructor() {

        this.queue_ = []
        this.cache_ = {} // this is a simple cache, but a very powerful feature for the simulation (and the mvvm PROD code as well) session

        this.__private = {
            
            debouncer_: new Debouncer(this),

            scheduleConsume: () => {
                return this.__private.debouncer_.debounce(() => {
                    if (this.queue_.length > 0 && !DIProvider.isMvvmRunning()) {// if we have arrived external messages, we try to inject them into mvvm, only if it is not already done automatically, by the current running flow
                        console.error(`scheduleConsume() - VA FI CONSUMAT si queue length este ${this.queue_.length}`)
                        /*await */DIProvider.executeMvvm("return MVVM_CONTROLLER.Compute()") // if mvvm is not running, we run it forcely, because we have unconsumed external messages from this module, to be processed; we provide empty script, because input-module injecting code is already implemented into ScriptMixin.runScript(...) and we only need to trigger it
                    }
                }, 300)()
            }
        }
    }

    async sendExternalQuery(senderId, queryEndpoint, forceRetrieve=false, autoResolvable=false) {
        
        let results_ = null
        if (queryEndpoint in this.cache_ && !forceRetrieve) {
            results_ = this.cache_[queryEndpoint]
        }
        else {
            const repoName_ = DIProvider.mvvmRepoName()
            const authToken_ = DIProvider.simulationAuthorizeToken()
            const url_ = `/rest/mvvm/apigateway/${repoName_}/${queryEndpoint}`
            try {
                results_ = await fetchGETWithAuthorization(url_, authToken_)
                this.cache_[queryEndpoint] = results_
            }
            catch(e) {
                console.error(e)
            }
        }
        console.log(`MvvmQueriesService: Inserting response in queue, for query ${JSON.stringify(queryEndpoint)}.`)
        this.queue_.push({
            sender: senderId,
            query: queryEndpoint,
            response: results_,
            auto_resolvable: autoResolvable,
            _id: generateUuid()
        })

        if (!autoResolvable) {
            console.log('...Will be send asap to mvvm consume logic !')
            this.__private.scheduleConsume()
        }
    }

    consume() {
        const index = this.queue_.findIndex(item => item.auto_resolvable === false);
        if (index !== -1) {
            return this.queue_.splice(index, 1)[0];
        }
        return undefined;
    }
    

    peekQueue(index) {
        return index >= 0 && index < this.queue_.length ? this.queue_[index] : null
    }
    queueSize() { return this.queue_.length }
    removeById(id) { this.queue_ = this.queue_.filter(qi => qi._id != id) }

    clearQueue() { this.queue_ = []; this.cache_ = {} }
}