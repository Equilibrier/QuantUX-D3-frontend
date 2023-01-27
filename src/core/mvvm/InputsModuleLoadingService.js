import DIProvider from "core/di/DIProvider"

export class InputsModuleLoadingService {
    
    constructor() {
        
        const mvvmSettings_ = DIProvider.mvvmSettings().data()
        this.url_ = mvvmSettings_.host_input_module_server
        this.error_ = false
        if (!this.url_) {
            console.error(`InputsModuleLoadingService: Something is wrong, mvvm setting 'host_input_module_server' could not be retrieved !`)
            this.error_ = true
        }

        this.queue_ = []

        this.timer_ = null

        this.__private = {

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
                    const res = fetch(this.url_, {
                        method: 'get',
                        // credentials: "same-origin",
                        // body: JSON.stringify(data),
                        headers: this.__private.createDefaultHeader()
                    })
                    if (res.status === 200) this.queue_.push(await res.json())
                    else throw new Error(`InputsModuleLoadingService: Could not GET from url ${this.url_} for some reason`)
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