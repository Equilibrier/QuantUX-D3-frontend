import DIProvider from 'core/di/DIProvider'
import {code as MvvmCodebase} from 'core/mvvm/mvvm_core'

export class MvvmRuntimeCodeService {
    
    constructor() {

        this.finalCode_ = ""

        this.__private = {
            loadedFromServer_: false,

            noCacheOptions: () => {
                var myHeaders = new Headers();
                myHeaders.append('pragma', 'no-cache');
                myHeaders.append('cache-control', 'no-cache');
                myHeaders.append('Content-Type', 'text/javascript');
                var myInit = {
                    method: 'GET',
                    headers: myHeaders,
                };
                return myInit;
            },

            downloadExternalCode: async (url) => {
                let js = ""
                try {
                    const resp = await fetch(url, this.__private.noCacheOptions());
                    js = await resp.text()
                }
                catch(e) {
                    // file not found on server, just ignoring
                    console.error(`Could not download mvvm external code js file from url ${url} for some reason. Completely ignoring this file...!`)
                }
                return js
            },

            downloadMvvmCode: async () => {
                const codeMeta_ = DIProvider.mvvmSettings().filteredMeta('ext_mvvm_code')
                const settingsData_ = await DIProvider.mvvmSettings().data()
                let outp = {}
                for (let m of codeMeta_) {
                    const url_ = settingsData_[m.key]
                    const code_ = await this.__private.downloadExternalCode(url_)
                    outp[m.key] = code_
                }
                return outp
            },

            retrieveCoreLib: () => {
                let corelibRaw_ = MvvmCodebase.toString()
                const _llines = corelibRaw_.split("\n") // removing the first line ("let data = null") from the script
                let _llinesFinal = []
                for (let l of _llines) {
                    if (l.trim() === "//REMOVE FROM HERE") {
                        break
                    }
                    if (l.toLowerCase().includes("//") && l.toLowerCase().includes("@strict-remove")) continue

                    _llinesFinal.push(l)
                }
                return _llinesFinal.join("\n")
            }
        }
    }

    async cachedCode() {
        if (!this.__private.loadedFromServer_) {
            let corelib = this.__private.retrieveCoreLib()
            const extFileContents_ = await this.__private.downloadMvvmCode()
            this.finalCode_ = Object.values(extFileContents_).reduce((a, e) => a + e + "\n", corelib + "\n\n") // @TODO good order is guaranteed for now by the MvvmSettingsService order in which the settings are defined in the db, but the order should have been explicitely defined somewhere, I think

            this.__private.loadedFromServer_ = true
        }
        return this.finalCode_
    }
}