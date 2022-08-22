
import Services from "services/Services"

import { KeyboardInputHandler } from 'core/input/KeyboardInputHandler'
import { ElementsLookup } from '../../core/project/ElementsLookup'

import { UIWidgetsActionQueue } from 'core/di/UIWidgetsActionQueue'
import { TempModelContext } from 'core/di/TempModelContext'
import { ScalingComputer } from 'core/di/ScalingComputer'
import { AsyncScheduler } from 'core/di/AsyncScheduler'
import { GlobalCache } from 'core/di/GlobalCache'
import { JSRunController } from 'core/di/JSRunController'

class DIProvider {

    constructor() {
        this._globalScripts = null;
        this._canvas = null;
        this._model = null;
        this._route = null;
        this._keyhandler = new KeyboardInputHandler();
        this._elLookup = null;
        this._uwActionQueue = new UIWidgetsActionQueue();
        this._tmpModelCtx = new TempModelContext();
        this._scaleComputer = new ScalingComputer();
        this._simStarted = false;
        this._asyncScheduler = new AsyncScheduler();
        this._globalCache = new GlobalCache();
        this._jsRunCtrl = new JSRunController();

        this._listeners = {};

        this.__waitUntil('_route', 5000, () => {
            console.error(`DIProvider: timeout reached waiting for _route to be set`)
        }).then(async _route => {
            if (_route !== null) {
                console.error("Setez model-ul")
                const modelService = Services.getModelService(this._route);
                let id = _route.params.id;
                const model = await modelService.findApp(id)
                this.setModel(model);
                this._scaleComputer.setModel(model);
                console.error("Am setat modelul: ", this._model)
            }
            else {
                console.error("DIProvider: _route was not properly fed in 5 secs");
            }
        });

        this.__waitUntil('_globalScripts', 5000, () => {
            console.error(`DIProvider: timeout reached waiting for _globalScripts to be set. We will have NO global JS scripts`)
        }).then(async _globalScripts => {
            console.log(`Set global JS scripts: ${JSON.stringify(_globalScripts)}`)
        });

        const buildJSUrls = async () => {
            let model = await this.modelAsync();
            if (model !== null) {
                const globalScripts = [];
                let comments = await Services.getCommentService().find(model.id, 'ScreenComment')
                for (let c of comments) {
                    if (c.message.toLowerCase().trim().startsWith("js_global:")) {
                            const url = c.message.substring(c.message.toLowerCase().indexOf("js_global:") + "js_global:".length).trim();
                            globalScripts.push(url)
                    }
                }
                this._globalScripts = globalScripts
            }
        }
        buildJSUrls()
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

    __waitUntil = (checkedField, timeoutMs = -1, timeoutClbk = () => {}) => {
        let periodMs = 100;
        const condition = () => this[checkedField] !== null;

        return new Promise((resolve) => {
            let countMs = 0;
            let interval = setInterval(() => {
                if (countMs >= timeoutMs) {
                    console.error(`DIProvider: timeout of ${timeoutMs} ms reached trying to wait for condition ${condition}`);

                    clearInterval(interval)
                    timeoutClbk();
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

    __clone(obj) { return JSON.parse(JSON.stringify(obj)) }

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
        console.error(`model: \n\t${JSON.stringify(model)}`)
        this.__set("_model")(model);
    }
    forceUpdateModel(model) {
        if (model !== undefined && model !== null) {
            this._model = model;
        }
        else {
            console.error(`DIProvider: forceUpdateModel: you should not pass a null/undefined model...`);
        }
    }
    setRoute(route) {
        console.error(`Cosmin: setRoute`);
        this.__set("_route")(route);
    }

    setSimulatorStartState(started) {
        this._simStarted = started;
    } 

    simulatorStarted() { return this._simStarted; }

    canvas() { return this._canvas; }
    async canvasAsync() { return await this.__waitUntil('_canvas', 3000); }
    
    model() { return this._model; }
    async modelAsync() { return await this.__waitUntil('_model', 3000); }

    keyInputHandler() { return this._keyhandler }
    elementsLookup() { // lazy inst because there is a circular dep between DIProvider<->ElementsLookup, and this is how we break it
        if (this._elLookup === null) {
            this._elLookup = new ElementsLookup()
        }
        return this._elLookup
    }

    uiWidgetsActionQueue() { return this._uwActionQueue }

    tempModelContext() { return this._tmpModelCtx }

    scalingComputer() { return this._scaleComputer }

    asyncScheduler() { return this._asyncScheduler }

    globalCache() { return this._globalCache }

    jsRunController() { return this._jsRunCtrl }

    globalJSScripts() { return this.__clone(this._globalScripts) }
}

export default new DIProvider();