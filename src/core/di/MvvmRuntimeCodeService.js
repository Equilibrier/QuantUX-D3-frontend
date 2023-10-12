import DIProvider from 'core/di/DIProvider'
import {code as MvvmCodebase} from 'core/mvvm/mvvm_core'

export class MvvmRuntimeCodeService {
    
    constructor() {

        this.finalCode_ = ""

        this.__private = {

            'generateCodeChunks': () => {
                const repoName = DIProvider.mvvmRepoName()
                return [
                    {key: 'IO-MODULES url'      , url: `/rest/mvvm/business-code-download/${repoName}/io_modules.js`},
                    // {key: 'SIM-EXT-MODULES url' , url: '/rest/mvvm/business-code-download/${repoName}/sim_ext_modules.js`}, // fisierele cu sim_ sunt fisiere care nu o sa fie in proiectul React final, ci numai pentru demo-ul QuantUX, in schimb, la proiectul ReactJS o sa fie rescrise de generatorul de cod; aici ai posibilitatea sa scrii outputModuleSendMessage si outputQueryModuleQuery cu care sa poti inregistra apelurile spre afara, incat sa poti simula ceva; @TODO: pentru o simulare completa, mi-ar trebuie in QuantUX, aici, pe parcursul simularii, si o platforma de timere, pe care sa le pot accesa cumva din aceste fisiere si sa execut ceva evenimente asincrone la un anumit timp
                    {key: 'MODELS url'          , url: `/rest/mvvm/business-code-download/${repoName}/models.js`},
                    {key: 'VIEW-MODELS url'     , url: `/rest/mvvm/business-code-download/${repoName}/viewmodels.js`},
                    {key: 'VIEWS url'           , url: `/rest/mvvm/business-code-download/${repoName}/views.js`},
                    {key: 'CONFIGURATOR url'    , url: `/rest/mvvm/business-code-download/${repoName}/configurator.js`},
                    {key: 'INIT-LOAD script url', url: `/rest/mvvm/business-code-download/${repoName}/initloads.js`}
                ]
            },

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
                const codeMeta_ = this.__private.generateCodeChunks()
                let outp = []
                for (let m of codeMeta_) {
                    const code_ = await this.__private.downloadExternalCode(m.url)
                    outp.push(code_)
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
            this.finalCode_ = extFileContents_.reduce((a, e) => a + e + "\n", corelib + "\n\n")

            this.__private.loadedFromServer_ = true
        }
        return this.finalCode_
    }
}