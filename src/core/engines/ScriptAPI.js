import Logger from '../Logger'

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
        const pscr = this.__getParentScreen(this.qModel, this.api.app);
        return {
            x: (this.qModel.x - pscr.x) * this.api.scalingFactor,
            y: (this.qModel.y - pscr.y) * this.api.scalingFactor
        }
    }

    getSize() {
        return {
            w: this.qModel.w * this.api.scalingFactor,
            h: this.qModel.h * this.api.scalingFactor
        }
    }

    getBoundingBox() {
        const pscr = this.__getParentScreen(this.qModel, this.api.app);
        
        return {
            x: 0,
            y: 0,
            w: pscr.w * this.api.scalingFactor,
            h: pscr.h * this.api.scalingFactor
        }
    }

    setPosition(nx, ny) {
        
        const {x, y} = this.getPosition();
        console.error(`old pos: ${x}-${y}`)
        const {tx, ty} = {
            tx: nx - x,
            ty: ny - y
        };
        console.error(`new tx,ty: ${tx}-${ty}`)

        // postMessage( {
        //     type: 'translate',
        //     action_payload: `translate(${tx}px,${ty}px) `,
        //     widget: this.qModel
        // })

        this.api.appDeltas.push({
            type: this.type,
            key: 'translate',
            id: this.qModel.id,
            props: {tx, ty}
        })

        const pscr = this.__getParentScreen(this.qModel, this.api.app);
        this.qModel.x = nx + pscr.x;
        this.qModel.y = ny + pscr.y;

        // console.error(`new (remained) x,y: ${this.qModel.x}-${this.qModel.y}`)
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

    getPosition() { // we return the top-left corner of the bounding-box that surrounds all children
        let ltx = 10000000, lty = 10000000;
        this.forEachChild(cid => {
            const w = this.api.app.widgets[cid] || this.api.app.groups[cid]
            const {x, y} = w.getPosition()
            if (x < ltx) ltx = x;
            if (y < lty) lty = y;
        });
        return {
            x: ltx,
            y: lty
        }
    }

    setPosition(nx, ny) {
        const {x, y} = this.getPosition() // we create a vector from left-top corner of the bounding-box of the group, and translate all children with that vector
        const {tx, ty} = {
            tx: nx - x,
            ty: ny - y
        }
        this.forEachChild(cid => {
            const w = this.api.app.widgets[cid] || this.api.app.groups[cid]
            const op = w.getPosition();
            w.setPosition(op.x + tx, op.y + ty)
        })
    }

    getSize() {
        let x1 = 0, y1 = 0;
        const {x, y} = this.getPosition();
        this.forEachChild(cid => {
            const w = this.api.app.widgets[cid] || this.api.app.groups[cid]
            const cp = w.getPosition()
            const cs = w.getSize()
            if (cp.x + cs.w > x1) x1 = cp.x + cs.w
            if (cp.y + cs.h > y1) y1 = cp.y + cs.h
        })
        return {
            w: x1 - x + 1,
            h: y1 - y + 1
        }
    }

    getBoundingBox() {
        return this.qModel.children.length > 0 (this.api.app.widgets[this.qModel.children[0]] || this.api.app.groups[this.qModel.children[0]]).getBoundingBox() 
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

    constructor(app, scalingFactor) {
        Logger.log(2, "ScriptAPI.constructor() ")
        this.app = app
        this.appDeltas = []
        console.error(`Scaling factor given: ${scalingFactor}`)
        this.scalingFactor = scalingFactor ? scalingFactor : 1.0;
        console.error(`Scaling factor set: ${this.scalingFactor}`)
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