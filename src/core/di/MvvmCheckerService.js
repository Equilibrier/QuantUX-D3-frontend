import DIProvider from 'core/di/DIProvider'
import { MvvmSettingsService as MvvmSettings } from 'core/di/MvvmSettingsService'

export class MvvmCheckerService {
    
    constructor() {
        this.__private = { // for now, it's just a checkbox in the settings panel, but @TODO, in the future, a true checker must be computed in here, which maybe searches for the js-scripts, as there should be at least one to call the MVVM controller; then, the upload of the MVVM-core can be conditioned, based on this exact boolean
            checkIsMvvm: async () => (await DIProvider.mvvmSettings().data())[MvvmSettings.KEY__IS_MVVM_PROJ()]
        }

        this.isMvvmProject_ = null
    }

    isMvvmProject() { return this.isMvvmProject_ }

    async waitForIsMvvmProject() { 
        if (this.isMvvmProject_ === null) {
            this.isMvvmProject_ = await this.__private.checkIsMvvm()
        }
        return this.isMvvmProject_ 
    }
}