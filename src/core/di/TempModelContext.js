import lang from '../../dojo/_base/lang'

export class TempModelContext {
    
    constructor() {
        this.model = null;
    }

    resetModel(model) {
        this.model = lang.clone(model)
        // console.error(`reseted model to ${JSON.stringify(this.model)}`)
    }

    currentModel() {
        return lang.clone(this.model);
    }
    currentModelForReadOnly() {
        return this.model;
    }

    update(elementId, props) {
        // console.error(`Updating widget ${JSON.stringify(elementId)} to props ${JSON.stringify(props)}`)

        const element = this.model.widgets[elementId] || this.model.groups[elementId]
        for (let k of Object.keys(props)) {
            element[k] = props[k]
        }
    }
}