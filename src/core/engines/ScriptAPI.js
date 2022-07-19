import Logger from '../Logger'
//import DIProvider from 'core/di/DIProvider'

class QModel {

    constructor (model, api, type, parent = null) {
        this.qModel = model
        this.api = api
        this.type = type
        this.parent = parent
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

    __childLookup(id, children) {
        for (let ch of children) {
            if (ch.split("@")[0] === id) {
                return true;
            }
        }
        return false;
    }

    __getParentScreen (widget, model) {
        for (var id in model.screens) {
            var screen = model.screens[id];
            if (this.__childLookup(widget.id, screen.children)) {
                return screen;
            }
        }
        return null;
    }

    getPosition() {
        
        // console.error(`qmodel: ${JSON.stringify(this?.qModel)}`)
        // console.error(`qmodel-attr: ${JSON.stringify(Object.getOwnPropertyNames(this.qModel))}`)
        // //console.error(`api.app: ${JSON.stringify(this.api.app)}`)
        // //this.qModel.x = this.qModel.x * 2
        
        // const pscr = this.__getParentScreen(this.qModel, this.api.app);
        // console.error(`pscreen: ${JSON.stringify(pscr)}`);
        // console.error(`parrent: ${JSON.stringify(this.parent.qModel)}`);

        // console.error(`rel pos: x=${this.qModel.x - pscr.x}; y=${this.qModel.y - pscr.y}`)

        // console.error(`widg: ${JSON.stringify(Object.getOwnPropertyNames(this.api.app.widgets[this.qModel.id]))}`)

        // console.error(`worker: ${this.api.worker}`)
        //console.error(`uiwidg: ${JSON.stringify(Object.getOwnPropertyNames(this.api.renderFactory.getUIWidget(this.qModel)))}`)
        postMessage({
            type: 'transform',
            action_payload: `translate(${-10}px,${70}px) `,
            widget: this.qModel
        })

        // let trans = "translate(" + pos.x + "px," + pos.y + "px) ";
        // this.qModel.node.style.transform = trans;
        // node.style.webkitTransform = trans;

        // console.error(`new-w: ${this.qModel.w}`)
        // const f = this?.qModel?.getPosition
        // return f && typeof f === "function" ? f() : {}
        return {}
    }

    setPosition(x, y) {
        this?.qModel?.setPosition(x, y)
    }
}

class QWidget extends QModel {

    constructor (model, api, parent) {
        super(model, api, 'Widget', parent)
    }

}

class QGroup extends QModel {

    constructor (model, api, parent) {
        super(model, api, 'Group', parent)
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

    getPosition() {
        return {};
    }

    setPosition(x, y) {
        console.log(x != x ? y : ""); // dummy write to get rid of the strict syntax checking 'x, y are never used'
        return;
    }

    __getMeta(id) {
        const widg = this.api.app.widgets[id]
        const grp = this.api.app.groups[id]
        return widg || grp
    }

    __isGroup(id) {
        const grp = this.api.app.groups[id]
        return grp !== undefined
    }

    getChild(name) {
        const groupChildren = this.qModel.children
        const elId = groupChildren.find(childId => {
            //console.error(`groupChild: ${JSON.stringify(this.__getMeta(childId))}`)
            const child = this.__getMeta(childId)
            return child.name.toLowerCase() === name.toLowerCase()
        })
        return this.__isGroup(elId) ? new QGroup(this.__getMeta(elId), this.api, this) : new QWidget(this.__getMeta(elId), this.api, this)
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
                return new QGroup(group, this.api, this)
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
        for (let i = 0; i < children.length; i++) {
            const widgetId = children[i]
            const widget = this.api.app.widgets[widgetId]
            if (widget && name && widget.name.toLowerCase() === name.toLowerCase()) {
                return new QWidget(widget, this.api, this)
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

    constructor(app, viewModel, worker) {
        Logger.log(2, "ScriptAPI.constructor() ", viewModel)
        this.app = app
        this.appDeltas = []
        this.worker = worker
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