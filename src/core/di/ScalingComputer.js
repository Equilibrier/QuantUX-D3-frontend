import lang from '../../dojo/_base/lang'

export class ScalingComputer {
    
    constructor() {
        this._scale = 1.0; // default assumption
        this._model = null;
        this._screensOrigSizes = {}
    }

    __computerOrigSize() {
        if (!this._model) {
            console.warn(`Could not compute orig sizes because the model is not provided yet or it is invalid: ${JSON.stringify(this._model)}`);
        }
        for (let scr of Object.values(this._model.screens)) {
            this._screensOrigSizes[scr.id] = {
                w: scr.w,
                h: scr.h,
            }
        }
        console.log(`ScalingComputer: Orig sizes computed: \n\t${JSON.stringify(this._screensOrigSizes)}`)
    }

    scaleFactor() { 
        console.log(`ScalingComputer: Returning scale factor of ${this._scale}...`)
        return this._scale; 
    }

    setModel(model) { 
        console.log(`ScalingComputer: setting model to ${JSON.stringify(model)}\n\n\t, computing orig-sizes hash...`)
        this._model = lang.clone(model); // we want it only for read-only purposes
        this.__computerOrigSize();
    }

    screenCreated(scr) {
        if (scr && scr.id && this._screensOrigSizes[scr.id]) {
            const {w, h} = this._screensOrigSizes[scr.id]
            const sf1 = scr.w/w
            const sf2 = scr.h/h
            if (Math.abs(sf1 - sf2) > 0.001) {
                console.warn(`ScalingComputer: Computed scaling factors are not identical, for w/h: ${sf1}/${sf2}. Using the first one as default`)
            }
            console.log(`ScalingComputer: Setting scaling-factor to ${sf1}...`)
            this._scale = sf1;
        }
        else {
            console.warn(`ScalingComputer: screen creation ignored because it is invalid (${JSON.stringify(scr)}) or it is not available in the orig-sizes hash ${JSON.stringify(this._screensOrigSizes)}`)
        }
    }
}