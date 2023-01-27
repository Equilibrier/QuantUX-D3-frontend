import {generateUuid} from './utils/generic_utils'

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
                const {url, msg} = this.queue_[id]
                try {
                    const res = fetch(url, {
                        method: 'post',
                        // credentials: "same-origin",
                        headers: this.__private.createDefaultHeader(),
                        body: JSON.stringify(msg),
                    })
                    if (res.status === 200) this.results_[id] = await res.json()
                    else throw new Error(`ExternalCallsService: Could not POST to url url for some reason`)
                }
                catch(err) {
                    console.error(err)
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
        return this.results_[id]
    }
}