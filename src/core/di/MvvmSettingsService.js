import DIProvider from 'core/di/DIProvider'

export class MvvmSettingsService {
    
    static KEY__IS_MVVM_PROJ() 
        { return "is_mvvm_proj" }
    static KEY__IO_MODULES_URL() 
        { return "io_modules_url" }
    static KEY__SIM_EXT_MODULES_URL()
        { return "sim_ext_modules_url" }
    static KEY__MODELS_URL()
        { return "models_url" }
    static KEY__VIEWMODELS_URL() 
        { return "viewmodels_url" }
    static KEY__VIEWS_URL() 
        { return "views_url" }
    static KEY__CONFIGURATOR_URL()
        { return "configurator_url" }
    static KEY__INITLOAD_SCRIPT_URL()
        { return "initload_script_url" }
    static KEY__HOST_JS_SERVER()
        { return "host_js_server" }
    static KEY__HOST_INPUT_MODULE_SERVER()
        { return "host_input_module_server" }
    static KEY__HOST_OUTPUT_MODULE_SERVER()
        { return "host_output_module_server" }
    static KEY__HOST_OUTPUT_QUERY_MODULE_SERVER()
        { return "host_output_query_module_server" }

    constructor() {

        
        this.settingsMeta_ = [
            {key: MvvmSettingsService.KEY__IS_MVVM_PROJ                     , label: 'MVVM proj'                      , type: 'checkb', def: true},

            {key: MvvmSettingsService.KEY__IO_MODULES_URL()                 , label: 'IO-MODULES url'                 , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=io_modules.js', categ: 'ext_mvvm_code'},
            {key: MvvmSettingsService.KEY__SIM_EXT_MODULES_URL()            , label: 'SIM-EXT-MODULES url'            , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=sim_ext_modules.js', categ: 'ext_mvvm_code'}, // fisierele cu sim_ sunt fisiere care nu o sa fie in proiectul React final, ci numai pentru demo-ul QuantUX, in schimb, la proiectul ReactJS o sa fie rescrise de generatorul de cod; aici ai posibilitatea sa scrii outputModuleSendMessage si outputQueryModuleQuery cu care sa poti inregistra apelurile spre afara, incat sa poti simula ceva; @TODO: pentru o simulare completa, mi-ar trebuie in QuantUX, aici, pe parcursul simularii, si o platforma de timere, pe care sa le pot accesa cumva din aceste fisiere si sa execut ceva evenimente asincrone la un anumit timp
            {key: MvvmSettingsService.KEY__MODELS_URL()                     , label: 'MODELS url'                     , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=models.js', categ: 'ext_mvvm_code'},
            {key: MvvmSettingsService.KEY__VIEWMODELS_URL()                 , label: 'VIEW-MODELS url'                , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=viewmodels.js', categ: 'ext_mvvm_code'},
            {key: MvvmSettingsService.KEY__VIEWS_URL()                      , label: 'VIEWS url'                      , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=views.js', categ: 'ext_mvvm_code'},
            {key: MvvmSettingsService.KEY__CONFIGURATOR_URL()               , label: 'CONFIGURATOR url'               , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=configurator.js', categ: 'ext_mvvm_code'},
            {key: MvvmSettingsService.KEY__INITLOAD_SCRIPT_URL()            , label: 'INIT-LOAD script url'           , type: 'text', def: 'https://equilibrium.go.ro/quantux-apis/smartbasket/js?filename=initloads.js', categ: 'ext_mvvm_code'},

            {key: MvvmSettingsService.KEY__HOST_JS_SERVER()                 , label: 'JS-SERVER host'                 , type: 'text', def: 'localhost:3005'},
            {key: MvvmSettingsService.KEY__HOST_INPUT_MODULE_SERVER()       , label: 'INPUT-MODULE-SERVER host'       , type: 'text', def: 'localhost:3006'},
            {key: MvvmSettingsService.KEY__HOST_OUTPUT_MODULE_SERVER()      , label: 'OUTPUT-MODULE-SERVER host'      , type: 'text', def: 'localhost:3007'},
            {key: MvvmSettingsService.KEY__HOST_OUTPUT_QUERY_MODULE_SERVER(), label: 'OUTPUT-QUERY-MODULE-SERVER host', type: 'text', def: 'localhost:3008'},
        ]

        this.data_ = {}

        this.__private = {
            loadedFromDb_: false,

            loadFromDb: async () => {
                const setts_ = (await DIProvider.waitForAsync())["mvvm_settings"] || {}
                for (let sm of this.settingsMeta_) {
                    this.data_[sm.key] = setts_ && setts_[sm.key] ? setts_[sm.key] : sm.def

                    if (!setts_ || setts_[sm.key] === undefined) { // we save the setting with the default value, if it does not exist
                        this.__private.saveDataRow(sm.key, this.data_[sm.key])
                    }
                }
                return this.data_
            },

            getData: async () => {
                if (!this.__private.loadedFromDb_) {
                    this.__private.loadedFromDb_ = true
                    return await this.__private.loadFromDb()
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

    async data() { return await this.__private.getData() }

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
    filteredMeta(categ) { return this.meta().filter(e => e.categ === categ) }
}