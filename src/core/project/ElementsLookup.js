import DIProvider from '../di/DIProvider';


export class ElementsLookup {

    constructor() {
        this.model = null;
        
        DIProvider.listenFor("model", (fieldName, value) => {
            this.model = value;
        });
    }

    available() {
        return this.model !== null;
    }

    __checkPreconditions() {
        if (!this.available()) throw new "ElementsLookup: model not yet available or it is invalid (null)";
    }

    groupFromId(id) {
        this.__checkPreconditions();
        const res = Object.values(this.model.groups).filter(e => e.id === id);
        return res.length > 0 ? res[0] : null;
    }
    widgetFromId(id) {
        this.__checkPreconditions();
        const res = Object.values(this.model.widgets).filter(e => e.id === id);
        return res.length > 0 ? res[0] : null;
    }
    screenFromId(id) {
        this.__checkPreconditions();
        const res = Object.values(this.model.screens).filter(e => e.id === id);
        return res.length > 0 ? res[0] : null;
    }
    isGroup(id) {
        this.__checkPreconditions();
        return this.groupFromId(id) !== null;
    }
    isWidget(id) {
        this.__checkPreconditions();
        return this.widgetFromId(id) !== null;
    }
    isScreen(id) {
        this.__checkPreconditions();
        return this.screenFromId(id) !== null;
    }
    getObjectFromId(id) {
        this.__checkPreconditions();
        let res = this.groupFromId(id);
        if (res !== null) {
            return res;
        }
        res = this.widgetFromId(id);
        if (res !== null) {
            return res;
        }
        return this.screenFromId(id);
    }
    screenOf(id) {
        this.__checkPreconditions();
        if (!this.isGroup(id)) {
            const screens = Object.values(this.model.screens).filter(screen => this.isChildOfScreen(id, screen))
            return screens.length > 0 ? screens[0] : null;
        }
        else {
            const screens = Object.values(this.model.screens).filter(screen => Object.values(this.groupFromId(id).children).filter(childId => this.isChildOfScreen(childId, screen)).length > 0);
            return screens.length > 0 ? screens[0] : null;
        }
    }
    groupOf(id) {
        this.__checkPreconditions();
        const groups = Object.values(this.model.groups).filter(group => this.isChildOfGroup(id, group))
        return groups.length > 0 ? groups[0] : null;
    }

    __childLookup(id, group, clbk, childGetterClbkOrValue) {
        if (!group) {
            return false;
        }
        if (!childGetterClbkOrValue) {
            childGetterClbkOrValue = (group) => group.children;
        }
        const children = typeof childGetterClbkOrValue === 'function' ? childGetterClbkOrValue(group) : childGetterClbkOrValue;
        let idx = 0;
        for (let ch of children) {
            //if (ch.split("@")[0] === id.split("@")[0]) {
            if (ch === id) { // this is an exact match, because the @ appears only on template-screens widgets, and only on those widget + on the (template)screen.children list, so it is a special case, where the == should work fine (the mixings between @ and non-@ should not exist)
                if (clbk) clbk(idx);
                return true;
            }
            idx ++;
        }
        return false;
    }

    isChildOfGroup(id, group, childGetterClbkOrValue) { // childrenGetterClbk receives one param: the group ref and returns the children refs
        return this.__childLookup(id, group, null, childGetterClbkOrValue);
    }
    isChildOfScreen(id, screen, childGetterClbkOrValue) {
        return this.isChildOfGroup(id, screen, childGetterClbkOrValue); // the very same field ('children') and same logic... (actually a screen is a group)
    }

    removeChildFromGroup(id, group, childGetterClbkOrValue) {
        return this.__childLookup(id, group, (idx) => group.children.splice(idx, 1), childGetterClbkOrValue);
    }
    removeChildFromScreen(id, screen, childGetterClbkOrValue) {
        return this.removeChildFromGroup(id, screen, childGetterClbkOrValue);
    }


    loadScriptWidgets() { // TODO you can cache these, if you can ack widgets-modification events (adding/removing/editing) in this class...
        return Object.values(this.model.widgets).filter(w => w.type === 'Script' && w.props.trigger === 'load');
    }
    dataBindingScriptWidgets() { // likewise, cache-ing is not a bad idea...
        return Object.values(this.model.widgets).filter(w => w.type === 'Script' && w.props.trigger === 'databinding')
    }
    keyupScriptWidgets() { // likewise, cache-ing is not a bad idea...
        return Object.values(this.model.widgets).filter(w => w.type === 'Script' && w.props.trigger === 'keyup')
    }
}

//export default new ElementsLookup();