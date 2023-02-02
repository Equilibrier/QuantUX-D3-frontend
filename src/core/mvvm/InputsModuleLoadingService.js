import DIProvider from "core/di/DIProvider"

export class InputsModuleLoadingService {
    
    constructor() {
        
        this.queue_ = []

        this.timer_ = null

        this.__private = {

            url: null,

            retrieveUrl: async () => {

                if (this.__private.url) return this.__private.url // lazy instantiation

                const mvvmSettings_ = await DIProvider.mvvmSettings().data()
                this.__private.url = mvvmSettings_.host_input_module_server
                this.error_ = false
                if (!this.__private.url) {
                    console.error(`InputsModuleLoadingService: Something is wrong, mvvm setting 'host_input_module_server' could not be retrieved !`)
                    this.error_ = true
                }
                return this.__private.url
            },

            createDefaultHeader: () => {

                let headers = new Headers({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                return headers
            },

            makeExternalCall: async () => {

                if (this.error_) { console.warn('InputsModuleLoadingService: startListening: module is in error mode, call ommited !'); return }

                try {
                    const url_ = await this.__private.retrieveUrl()
                    const res = await fetch(url_, {
                        method: 'get',
                        // credentials: "same-origin",
                        // body: JSON.stringify(data),
                        headers: this.__private.createDefaultHeader()
                    })
                    if (res.status === 200) {
                        const result_ = await res.json()
                        if (Array.isArray(result_)) {
                            for (let r of result_) {
                                this.queue_.push(r)
                            }
                        }
                        else {
                            this.queue_.push(result_)
                        }
                    }
                    else throw new Error(`InputsModuleLoadingService: Could not GET from url ${url_} for some reason (status ${res.status})`)
                }
                catch(err) {
                    console.error(err)
                }
            }
        }
    }

    startListening() {
        if (this.error_) { console.warn('InputsModuleLoadingService: startListening: module is in error mode, call ommited !'); return }

        if (!this.timer_) {
            this.timer_ = setInterval(async () => {
                
                await this.__private.makeExternalCall()

                if (this.queue_.length > 0) { // if we have arrived external messages, we try to inject them into mvvm, only if it is not already done automatically, by the current running flow
                    setTimeout(async () => {
                        if (this.queue_.length > 0 && !DIProvider.isMvvmRunning()) {
                            await DIProvider.executeMvvm("") // if mvvm is not running, we run it forcely, because we have unconsumed external messages from this module, to be processed; we provide empty script, because input-module injecting code is already implemented into ScriptMixin.runScript(...) and we only need to trigger it
                        }
                    }, 300)
                }

            }, 1000)
        }
        else {
            console.warn(`InputsModuleLoadingService: startListening: Timer already started, ignoring request !`)
        }
    }

    stopListening() {
        if (this.error_) { console.warn('InputsModuleLoadingService: startListening: module is in error mode, call ommited !'); return }

        if (this.timer_) {
            clearInterval(this.timer_)
            this.timer_ = null
        }
        else {
            console.warn(`InputsModuleLoadingService: stopListening: Timer was not started, ignoring request !`)
        }
    }

    discardQueue() {
        const q = JSON.parse(JSON.stringify(this.queue_))
        this.queue_ = []
        return q
    }
}