import {generateUuid} from 'util/generic_utils'

export class ExternalCallsService {

    constructor() {
        // this.timer_ = null
        this.queue_ = {}
        this.results_ = {}

        this.__private = {

            createDefaultHeader: () => {
                let headers = new Headers({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                })
                return headers
            },

            makeExternalCall: async (id) => {
                let res_ = null, rej_ = null
                const p_ = new Promise((resolve, reject) => {
                    res_ = resolve
                    rej_ = reject
                })
                this.results_[id] = {
                    promise: p_
                }

                const {url, msg} = this.queue_[id]
                try {
                    const res = await fetch(url, {
                        method: 'post',
                        // credentials: "same-origin",
                        headers: this.__private.createDefaultHeader(),
                        body: JSON.stringify(msg),
                    })
                    if (res.status === 200) {
                        const r_ = await res.json()
                        this.results_[id].result = r_
                        console.log(`response from ${url} with body ${JSON.stringify(msg)}:\n\t${JSON.stringify(r_)}`)
                        res_(r_)
                    }
                    else {
                        this.results_[id].result = null
                        rej_(`ExternalCallsService: Could not POST to url ${url} for some reason: http code ${res.status}`)
                        //throw new Error(`ExternalCallsService: Could not POST to url url for some reason`)
                        console.error(`ExternalCallsService: Could not POST to url ${url} for some reason: http code ${res.status}`)
                    }
                }
                catch(err) {
                    console.error(err)
                    rej_(err)
                    this.results_[id].result = null
                }
            }
        }
    }

    registerCall(url, msg) {

        const id_ = generateUuid()
        this.queue_[id_] = { url, msg }

        //await 
        this.__private.makeExternalCall(id_)

        return id_
    }

    resultOf(id) {
        return this.results_[id].result
    }
    async waitForResult(id) {
        return this.results_[id].promise
    }
}