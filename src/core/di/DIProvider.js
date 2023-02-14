
import Services from "services/Services"

import { KeyboardInputHandler } from 'core/input/KeyboardInputHandler'
import { ElementsLookup } from '../../core/project/ElementsLookup'

import { UIWidgetsActionQueue } from 'core/di/UIWidgetsActionQueue'
import { TempModelContext } from 'core/di/TempModelContext'
import { ScalingComputer } from 'core/di/ScalingComputer'
import { AsyncScheduler } from 'core/di/AsyncScheduler'
import { JSRunController } from 'core/di/JSRunController'
import { TransitionsNotifier } from 'core/di/TransitionsNotifier'
import { MvvmSettingsService } from 'core/di/MvvmSettingsService'
import { MvvmRuntimeCodeService } from 'core/di/MvvmRuntimeCodeService'
import { ExternalCallsService } from 'core/di/ExternalCallsService'
import { InputsModuleLoadingService } from 'core/mvvm/InputsModuleLoadingService'
import { OutputsModuleSendingService } from 'core/mvvm/OutputsModuleSendingService'
import { OutputQueriesModuleSendingService } from 'core/mvvm/OutputQueriesModuleSendingService'
import { SimulatorStateService } from 'core/di/SimulatorStateService'
import { MvvmStateObserver } from 'core/di/MvvmStateObserver'
import { MvvmCheckerService } from 'core/di/MvvmCheckerService'

class DIProvider {

    constructor() {

        this.__private = {
            initSimulatorStateService: () => new SimulatorStateService(),

            initMvvmCheckerService: () => new MvvmCheckerService(),

            initMvvmRuntimeCodeRetriever: () => new MvvmRuntimeCodeService(),
            initMvvmInputsService: () => new InputsModuleLoadingService(),
            initMvvmOutputsService: () => new OutputsModuleSendingService(),
            initMvvmOutputsQuery: () => new OutputQueriesModuleSendingService(),
            initExternalCallsService: () => new ExternalCallsService(),
        }
        this._simulator = null
        this._canvas = null;
        this._model = null;
        this._jwtToken = null;
        this._route = null;
        this._keyhandler = new KeyboardInputHandler();
        this._elLookup = null;
        this._uwActionQueue = new UIWidgetsActionQueue();
        this._tmpModelCtx = new TempModelContext();
        this._scaleComputer = new ScalingComputer();
        this._asyncScheduler = new AsyncScheduler();
        this._jsRunCtrl = new JSRunController();
        this._transitionsNotif = new TransitionsNotifier()
        this._mvvmSettingsService = new MvvmSettingsService()
        this._baseController = null // lazy instantiation, see __private init functions and the getters; @TODO: for now I only did for these, as these were using themselves in circular dependencies, but it can be done for everything, and this technique should solve every similar issue
        this._mvvmRuntimeCodeRetriever = null
        this._mvvmInputsService = null
        this._mvvmOutputsService = null
        this._mvvmOutputsQueryService = null
        this._externalCallsService = null
        this._simulatorStateService = null
        this._mvvmStateObserver = new MvvmStateObserver()
        this._mvvmCheckerService = null

        this._unexecutedJsScripts = [] // this should be a separate service, but for now, we implement this on the DIProvider

        this._listeners = {};

        this.__waitUntil('_route', 5000, () => {
            console.error(`DIProvider: timeout reached waiting for _route to be set`)
        }).then(async _route => {

            const jwtToken = Services.getUserService()?.getToken()
            if (jwtToken) {
                // console.log(`jwtToken: ${jwtToken}`)
                this.setJwtToken(jwtToken)
            }

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

    async isMvvmProject() {
        if (this._mvvmCheckerService === null) {
            this._mvvmCheckerService = this.__private.initMvvmCheckerService()
        }
        return await this._mvvmCheckerService.waitForIsMvvmProject()
    }

    emitMvvmStartedExecuting() { console.warn('sim-trace'); this._mvvmStateObserver.setRunning() }
    emitMvvmStoppedExecuting() { this._mvvmStateObserver.setStopped() }
    isMvvmRunning() { return this._mvvmStateObserver.isRunning() }
    async waitWhileMvvmRunning() { await this._mvvmStateObserver.waitWhileRunning() }

    async executeMvvm(script) {
        if (this._simulator) {
            const isMvvmProj_ = await this.isMvvmProject()
            if (isMvvmProj_) {
                await this.waitWhileMvvmRunning()
                this.emitMvvmStartedExecuting()
            }
            await this._simulator.runScript(script, null, null)
            if (isMvvmProj_) {
                this.emitMvvmStoppedExecuting()
            }
        }
        else {
            console.error(`SIMREF NESETAT, programam script ${script}`)
            this._unexecutedJsScripts.push(script)
        }
    }

    setBaseController(ref) {
        console.warn(`setez base controller la `, ref)
        this.__set("_baseController")(ref)
    }

    setCanvas(canvas) {
        this.__set("_canvas")(canvas);
    }
    setModel(model) {
        console.error(`model: \n\t${JSON.stringify(model)}`)
        this.__set("_model")(model);
    }
    setJwtToken(token) {
        console.error(`jwtToken: \n\t${JSON.stringify(token)}`)
        this.__set("_jwtToken")(token);
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
        if (started) {
            this.simulatorStateService().emitStarted()
        }
        else {
            this.simulatorStateService().emitStopped()
            this._simulator = null
        }
    }

    setSimulatorRef(sim) {
        this.__set("_simulator")(sim)
        if (sim) {
            const f = async () => {
                for (let s of this._unexecutedJsScripts) {
                    await this.executeMvvm(s)
                }
                this._unexecutedJsScripts = []
            }
            f()
        }
    }

    simulatorStarted() { return this.simulatorStateService().started() }

    canvas() { return this._canvas; }
    async canvasAsync() { return await this.__waitUntil('_canvas', 3000); }
    
    model() { return this._model; }
    async waitForAsync() { return await this.__waitUntil('_model', 3000); }

    jwtToken() { return this._jwtToken }
    async jwtTokenAsync() { return await this.__waitUntil('_jwtToken', 3000); }

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

    jsRunController() { return this._jsRunCtrl }

    simulatorRef() { return this._simulator }

    transitionsNotifier() { return this._transitionsNotif }

    mvvmSettings() { return this._mvvmSettingsService }

    editingModelDBController() { return this._baseController }

    mvvmRuntimeCodeRetriever() { this._mvvmRuntimeCodeRetriever = this._mvvmRuntimeCodeRetriever ? this._mvvmRuntimeCodeRetriever : this.__private.initMvvmRuntimeCodeRetriever(); return this._mvvmRuntimeCodeRetriever }

    mvvmInputsService() { this._mvvmInputsService = this._mvvmInputsService ? this._mvvmInputsService : this.__private.initMvvmInputsService(); return this._mvvmInputsService }
    mvvmOutputsService() { this._mvvmOutputsService = this._mvvmOutputsService ? this._mvvmOutputsService : this.__private.initMvvmOutputsService(); return this._mvvmOutputsService }
    mvvmOutputsQueryService() { this._mvvmOutputsQueryService = this._mvvmOutputsQueryService ? this._mvvmOutputsQueryService : this.__private.initMvvmOutputsQuery(); return this._mvvmOutputsQueryService }

    externalCallsService() { this._externalCallsService = this._externalCallsService ? this._externalCallsService : this.__private.initExternalCallsService(); return this._externalCallsService }

    simulatorStateService() { this._simulatorStateService = this._simulatorStateService ? this._simulatorStateService : this.__private.initSimulatorStateService(); return this._simulatorStateService }
}

export default new DIProvider();