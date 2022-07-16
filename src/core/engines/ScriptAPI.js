import Logger from '../Logger'
//import DIProvider from 'core/di/DIProvider'

class QModel {

    constructor (model, api, type) {
        this.qModel = model
        this.api = api
        this.type = type
    }

    getName() {
        return this.qModel.name
    }

    setStyle(newStyleDelta) {
        this.api.appDeltas.push({
            type: this.type,
            key: 'style',
            id: this.qModel.id,
            style: newStyleDelta
        })
    }

    setProp(newStyleDelta) {
        this.api.appDeltas.push({
            type: this.type,
            id: this.qModel.id,
            key: 'props',
            props: newStyleDelta
        })
    }

    hide () {
        this.setStyle({display: 'none'})
    }

    isHidden () {
        return this?.qModel?.style?.display === 'none'
    }

    show () {
        this.setStyle({display: 'block'})
    }

    toggle () {
        if (this.isHidden()) {
            this.show()
        } else {
            this.hide()
        }
    }
}

class QWidget extends QModel {

    constructor (model, api) {
        super(model, api, 'Widget')
    }

}

class QGroup extends QModel {

    constructor (model, api) {
        super(model, api, 'Group')
    }

    forEachChild (callback) {
        this.qModel.children.forEach(callback)
    }

    setStyle(newStyleDelta) {
        this.forEachChild(id => {
            this.api.appDeltas.push({
                type: 'Widget',
                key: 'style',
                id: id,
                style: newStyleDelta
            })
        })
    }

    setProp(newStyleDelta) {
        this.forEachChild(id => {
            this.api.appDeltas.push({
                type: 'Widget',
                key: 'props',
                id: id,
                props: newStyleDelta
            })
        })
    }

    isHidden () {
        let hidden = this.qModel.children.filter(id => {
            let widget = this.api.app.widgets[id]
            return widget?.style?.display === 'none'
        })
        return hidden.length === this.qModel.children.length
    }

}


class QScreen extends QModel {

    constructor (model, api) {
        super(model, api, 'Screen')
    }

    __childLookup(id, children) {
        for (let ch of children) {
            if (ch.split("@")[0] === id) {
                return true;
            }
        }
        return false;
    }


    getGroup (name) {
        const res = this.__groupFromName(name);
        if (!res) { 
            throw new Error(`Group "${name}" in screen "${this.qModel.name}" not found.`)
        }
        return res;
    }

    __groupFromName(name) {
        Logger.log(2, "QScreen.getGroup() ", name)
        if (this.api.app.groups) {
            const groups = this.api.app.groups
            let group = Object.values(groups).find(g => { 
                if (name && g.name.toLowerCase() === name.toLowerCase()) {
                    const groupChildren = g.children
                    const contained = groupChildren.filter(groupChild => this.__childLookup(groupChild, this.qModel.children))
                    return contained.length === groupChildren.length
                }
                return false
            })
            if (group) {
                return new QGroup(group, this.api)
            }
        } 
        return null;
    }

    groupExists(name) {
        return this.__groupFromName(name) !== null;
    }

    __widgetFromName(name) {
        Logger.log(2, "QScreen.getWidget() ", name)
        const children = this.qModel.children
        for (let i =0; i < children.length; i++) {
            const widgetId = children[i]
            const widget = this.api.app.widgets[widgetId]
            if (widget && name && widget.name.toLowerCase() === name.toLowerCase()) {
                return new QWidget(widget, this.api)
            }
        }
        return null;
    }

    getWidget(name) {
        const res = this.__widgetFromName(name);
        if (!res) { 
            throw new Error(`Widget "${name}" in screen "${this.qModel.name}" not found.`)
        }
        return res;
    }

    widgetExists(name) {
        return this.__widgetFromName(name) !== null;
    }

    elementExists(name) {
        return this.widgetExists(name) || this.groupExists(name)
    }
}

export default class ScriptAPI {

    constructor(app, viewModel) {
        Logger.log(2, "ScriptAPI.constructor() ", viewModel)
        this.app = app
        this.appDeltas = []
    }

    getScreen(name) {
        const found = Object.values(this.app.screens).filter(s => name !== undefined && s.name.toLowerCase() === name.toLowerCase())
        if (found.length === 1) {
            return new QScreen(found[0], this)
        }
        throw new Error(`Screen "${name}" not found.`)
    }

    getAppDeltas () {
        return this.appDeltas
    }

}