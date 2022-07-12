
import Services from "services/Services"

import { KeyboardInputHandler } from 'core/input/KeyboardInputHandler'
import { ElementsLookup } from '../../core/project/ElementsLookup'

class DIProvider {

    constructor() {
        this._canvas = null;
        this._model = null;
        this._route = null;
        this._keyhandler = new KeyboardInputHandler();
        this._elLookup = null;

        this._listeners = {};

        const f = async () => {
            await this.__waitUntil(() => '_route', 5000);
            if (this._route !== null) {
                console.error("Setez model-ul")
                const modelService = Services.getModelService(this._route);
                let id = this._route.params.id;
                this.setModel(await modelService.findApp(id));
                console.error("Am setat modelul: ", this._model)
            }
            else {
                console.error("DIProvider: _route was not properly fed in 5 secs");
            }
        };
        f();
    }

    __set(fieldName) {
        return (value) => {
            if (this[fieldName] === null) {
                this[fieldName] = value;

                const lkey = fieldName.toLowerCase().slice(1);
                if (this._listeners[lkey] !== undefined) {
                    for (let l of this._listeners[lkey]) {
                        l(lkey, value);
                    }
                }
            }
            else {
                console.warn(`DIProvider: ${fieldName} was already set...`);
            }
        }
    }

    __waitUntil = (checkedField, timeoutMs = -1) => {
        let periodMs = 100;
        const condition = () => this[checkedField] !== null;

        return new Promise((resolve) => {
            let countMs = 0;
            let interval = setInterval(() => {
                if (countMs >= timeoutMs) {
                    console.error(`DIProvider: timeout of ${timeoutMs} ms reached trying to wait for condition ${condition}`);

                    clearInterval(interval)
                    resolve(null);
                }
                if (!condition()) {
                    countMs += periodMs;
                    return
                }
                clearInterval(interval)
                resolve(this[checkedField])
            }, periodMs);
        })
    }

    listenFor(data, callback) {
        data = data.toLowerCase();
        if (this["_" + data] !== null) {
            callback(data, this["_" + data]);
        }
        else {
            this._listeners[data] = this._listeners[data] === undefined ? [] : this._listeners[data];
            this._listeners[data].push(callback);
        }
    }

    setCanvas(canvas) {
        this.__set("_canvas")(canvas);
    }
    setModel(model) {
        this.__set("_model")(model);
    }
    setRoute(route) {
        this.__set("_route")(route);
    }

    canvas() { return this._canvas; }
    async canvasAsync() { return await this.__waitUntil('_canvas', 3000); }
    
    model() { return this._model; }
    async modelAsync() { return await this.__waitUntil('_model', 3000); }

    keyInputHandler() { return this._keyhandler; }
    elementsLookup() { // lazy inst because there is a circular dep between DIProvider<->ElementsLookup, and this is how we break it
        if (this._elLookup === null) {
            this._elLookup = new ElementsLookup();
        }
        return this._elLookup; 
    }
}

export default new DIProvider();