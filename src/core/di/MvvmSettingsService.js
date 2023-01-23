import DIProvider from 'core/di/DIProvider'

export class MvvmSettingsService {
    
    constructor() {
        
        this.settingsMeta_ = [
            {key: 'is_mvvm_proj', label: 'MVVM proj', type: 'checkb', def: true},
            {key: 'host_js_server', label: 'JS-SERVER host', type: 'text', def: 'localhost:3005'},
            {key: 'host_input_module_server', label: 'INPUT-MODULE-SERVER host', type: 'text', def: 'localhost:3006'},
            {key: 'host_output_module_server', label: 'OUTPUT-MODULE-SERVER host', type: 'text', def: 'localhost:3007'},
            {key: 'host_output_query_module_server', label: 'OUTPUT-QUERY-MODULE-SERVER host', type: 'text', def: 'localhost:3008'},
        ]

        this.data_ = {}

        this.__private = {
            loadedFromDb_: false,

            loadFromDb: () => {
                const setts_ = DIProvider.model()["mvvm_settings"]
                for (let sm of this.settingsMeta_) {
                    this.data_[sm.key] = setts_ && setts_[sm.key] ? setts_[sm.key] : sm.def

                    if (!setts_ || setts_[sm.key] === undefined) { // we save the setting with the default value, if it does not exist
                        this.__private.saveDataRow(sm.key, this.data_[sm.key])
                    }
                }
                return this.data_        
            },

            getData: () => {
                if (!this.__private.loadedFromDb_) {
                    this.__private.loadedFromDb_ = true
                    return this.__private.loadFromDb()
                }
                return this.data_
            },

            saveDataRow: (key, value) => {
                if (DIProvider.simulatorStarted()) {
                    console.warn(`Ignoring writing mvvm settings ${key}->${value} to database, because we are in simulation mode; this should never happen...`)
                    return false
                }

                DIProvider.editingModelDBController().updateMvvmSettings([{key, value}])
                return true
            }
        }
    }

    data() { return this.__private.getData() }

    updateSettingsRow(key, val) {
        this.data_[key] = val
        if (this.__private.saveDataRow(key, val)) {
            console.log(`Successfully saved mvvm setting ${key} with value ${val} in the persistent database`)
        }
        else {
            console.error(`Error occured trying to save mvvm setting ${key} with value ${val} in the persistent database`)
        }
    }

    meta() { return [...this.settingsMeta_] }
}