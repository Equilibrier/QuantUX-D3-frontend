import DIProvider from 'core/di/DIProvider'

export class SimulatorStateService {

    constructor() {
        this.listeners_ = []
        this.started_ = false
        this.mnService_ = DIProvider.mvvmNotificationsService()

        this.__private = {
            'acknowledge': () => { for (let l of this.listeners_) l(this.started_) }
        }
    }

    registerListener(clbk) { // should be function with only one parameter, a boolean, specifying if the simulator is started or not
        if (clbk) this.listeners_.push(clbk)
    }

    async emitStarted(dataBindingValues) {

        if (dataBindingValues === null || dataBindingValues === undefined) {
            console.error('dataBindingValues E null/undefined')
        }
        else {
            console.error('dataBindingValues e *VALID*')
        }

        class QueriesQueueMonitor {

            constructor(expectedResultsCheckers, timeoutMs = 2000) { // expectedResultsCheckers is a dictionary with some keys for each result and the value a lambda which checks if the corresponding result is present or not
                this.timeoutMs_ = timeoutMs
                this.timeoutId_ = null;
                this.results_ = {}
                for (let resultKey of Object.keys(expectedResultsCheckers)) {
                    this.results_[resultKey] = {
                        checker: expectedResultsCheckers[resultKey].checker,
                        handler: expectedResultsCheckers[resultKey].handler,
                        retrieved: false,
                        data: null
                    }
                }

                this.__private = {
                    'checkResults': () => {
                        let stillSearchingCounter = 0

                        let remainingResults_ = Object.keys(this.results_).filter(rk => !this.results_[rk].retrieved)
                        stillSearchingCounter = remainingResults_.length

                        remainingResults_.map(resultKey => {
                            for (let i = 0; i < DIProvider.mvvmQueriesService().queueSize(); i ++) {
                                const queueItem_ = DIProvider.mvvmQueriesService().peekQueue(i)
                                if (this.results_[resultKey].checker(queueItem_)) {
                                    this.results_[resultKey].retrieved = true
                                    this.results_[resultKey].data = queueItem_
                                    stillSearchingCounter --

                                    this.results_[resultKey].handler(queueItem_.response)
                                    DIProvider.mvvmQueriesService().removeById(queueItem_._id)
                                }
                            }
                        })

                        return stillSearchingCounter <= 0
                    }
                }
            }

            results() { return Object.keys(this.results_).map(rk_ => this.results_[rk_].data) }
        
            async waitForResult() {

                return new Promise((resolve, reject) => {

                    let checkQueue = () => {
                        // verificăm dacă rezultatul este în coadă
                        if (this.__private.checkResults()) {
                            clearTimeout(this.timeoutId_)
                            resolve(Object.keys(this.results_).map(rk => this.results_[rk].data))
                        }
            
                        this.timeoutId_ = setTimeout(checkQueue, 100); // re-verificăm la fiecare 100ms
                    };
            
                    // timeout if results are not provided at a certain time
                    setTimeout(() => {
                        if (!this.__private.checkResults()) {
                            clearTimeout(this.timeoutId_);
                            console.error(`Results not found in the specified interval: ${this.timeoutMs_/1000} seconds`);
                            reject(Object.keys(this.results_).filter(rk => !this.results_[rk].retrieved))
                        }
                    }, this.timeoutMs_);
            
                    checkQueue();
                })
            }
        }

        if (this.started_) { console.warn(`SimulatorStateService: simulator already (acknowledged as) started`); return }

        DIProvider.mvvmQueriesService().clearQueue()
        DIProvider.mvvmMessagesService().clearQueue()
        this.mnService_.discardQueue()

        DIProvider.mvvmQueriesService().sendExternalQuery('quantux-d3', 'get-early-resources', false, true)
        DIProvider.mvvmQueriesService().sendExternalQuery('quantux-d3', 'get-early-data', false, true)

        const resultsTimeout = 3000 // timeout of 3 seconds, enough...
        const queueMonitor = new QueriesQueueMonitor({
            'get-early-resources': {
                'checker': ({sender, query}) => sender == 'quantux-d3' && query == 'get-early-resources',
                'handler': (response) => { dataBindingValues['early_resources'] = response }
            },
            'get-early-data': {
                'checker': ({sender, query}) => sender == 'quantux-d3' && query == 'get-early-data',
                'handler': (response) => { dataBindingValues['early_data'] = response }
            }
        }, resultsTimeout)

        try {
            await queueMonitor.waitForResult()
        }
        catch(unresolvedResultKeys_) {
            for (let rk_ of unresolvedResultKeys_) {
                console.error(`Timeout of ${resultsTimeout/1000} seconds reached; result '${rk_}' was NOT retrieved`)
            }
        }

        this.mnService_.startListening()
        this.started_ = true
        this.__private.acknowledge()
        
        //DIProvider.executeMvvm("MVVM_CONTROLLER.loadInitialData()")
    }
    async emitStopped(dataBindingValues) {

        if (!dataBindingValues) { console.warn('emitStopped: dataBindingValues not used') }

        if (!this.started_) { console.warn(`SimulatorStateService: simulator already (acknowledged as) stopped`); return }

        this.started_ = false
        this.__private.acknowledge()

        this.mnService_.stopListening()
    }

    started() { return this.started_ }
}