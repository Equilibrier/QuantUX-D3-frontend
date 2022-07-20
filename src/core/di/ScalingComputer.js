import lang from '../../dojo/_base/lang'

// it might be an overwhelming logic bellow, because it seems the current my-quantux software can provide an accurate periodic 
// setExplicitScreenSize call with actual values, but for the sake of the OOP science and as an eulogy of math, we past 
// highest priority on the computing scale-factor rather than explicit resolutions (and because you can define 
// multiple size screens, although, in practice it should be one single size for all)
export class ScalingComputer {
    
    constructor() {
        this._scale = 1.0; // default assumption
        this._explicitSizes = {w: 1024, h: 800}
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

    projectedScreenSize(screenId = null, screenName = null) {
        if (!this._scale || Object.values(this._screensOrigSizes).length <= 0) return this._explicitSizes;

        const referenceScreen = screenId ? this._screensOrigSizes[screenId] : (screenName ? Object.values(this._screensOrigSizes).find(s => s.name.toLowerCase() === screenName.toLowerCase()) : Object.values(this._screensOrigSizes)[0]);
        const w = referenceScreen.w * this._scale;
        const h = referenceScreen.h * this._scale;
        return {w, h}
    }

    setExplicitScreenSize(w, h) {
        console.log(`ScalingComputer: Explicit sizes provided: ${w} X ${h}`)
        this._explicitSizes = {w, h};
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