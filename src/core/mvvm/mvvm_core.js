const codeFunction = function(){
let data = null // this must stay on line 1, as it is hardcode-removed from the sources, when building the Qux script

class Model {

	constructor() {
		this.listeners_ = {}
		this.loaded_ = this._load()
		if (!this.loaded_) {
			console.error(`Model ${this.constructor.name} could not be properly loaded...`)
		}
	}
		
	// PUBLIC, to be used methods
	loaded() { return this.loaded_ }
	
	get(prop) { // do NOT be overriden, this will be the public method used by external callers
		return this._get(prop)
	}
	set(prop, value) { // do NOT be overriden, this will be the public method used by external callers
		const res = this._set(prop, value)
		if (res) {
			this._save()
			if (res.signal) {
				this._trigger(res.signal, res.payload)
			}
		}
		return res != null; // true/false, set succeeded or not
	}
	operate(op, payload, prop=null) { // do NOT be overriden, this will be the public method used by external callers -- prop as null means an operation on the whole model, props != null means operation on a certain prop (sub-model/characteristic of the model)
		const res = this._operate(op, payload, prop)
		if (res) {
			this._save()
			if (res.signal) {
				this._trigger(res.signal, res.payload)
			}
		}
		// this does an operation on the model
		return res !== null; // true/false, operate succeeded or not
	}
	lookup(method, payload, prop=null) { // do NOT be overriden, this will be the public method used by external callers -- prop as null means a lookup on the whole model, props != null means lookup on a certain prop (sub-model/characteristic of the model)
		const res = this._lookup(method, payload, prop)
		return res; // true/false, lookup succeeded or not
	}
	
	registerForModelChange(signal, clbk) { // clbk has two params: prop/op and value/payload
		this.listeners_[signal] = this.listeners_[signal] === undefined ? [] : this.listeners_[signal]
		this.listeners_[signal].push(clbk)
	}
	
	// INTERNAL methods
	_trigger(signal, payload) {
		if (this.listeners_[signal]) {
			for (let clbk of this.listeners_[signal]) {
				if (clbk) {
					clbk(signal, payload)
				}
			}
		}
	}
	
	// TO-be-OVERRIDEN methods
	_save() { // to be overriden, method that saves the model into a persistent db
		return false // returns true/false if the data was succesfully saved
	}
	_load() { // to be overriden, method that loads the model from a persistent db
		return false // returns true/false if the data was succesfully loaded
	}
	_get(prop) { // to be overriden
		prop ? null : null // get rid of strict-mode error
		return null;
	}
	_set(prop, value) { // to be overriden, method that sets a property
		prop ? null : null // get rid of strict-mode error
		value ? null : null // get rid of strict-mode error
		return false; // true/false, set succeeded or not
	}
	_operate(op, payload, prop) { // to be overriden, method that does an operation on the model  -- you can implement any number of operations with a simple switch in here
		op ? null : null // get rid of strict-mode error
		payload ? null : null // get rid of strict-mode error
		prop ? null : null // get rid of strict-mode error
		return false; // true/false, operate succeeded or not
	}
	_lookup(method, payload, prop) { // to be overriden, method that is applying a special lookup method to retrieve some specific value from the model -- you can implement any number of lookups with a simple switch in here
		method ? null : null // get rid of strict-mode error
		payload ? null : null // get rid of strict-mode error
		prop ? null : null // get rid of strict-mode error
		return null
	}
}

class ModelFactory {
	getModel(key) {
		key ? null : null // get rid of strict-mode error
		return null; // returns a Model instance of the 'key' model (key is the name of the model you want)
	}
}

class ModelEvent {
	constructor(key, propOrOp, valOrPayload) {
		this.key = key
		this.propOrOp = propOrOp
		this.valOrPayload = valOrPayload
		
		//key is the model identifier, prop is the property/operation of/on the respective model, payload is the new data of the prop/data of the operation that is being applied to the model
	}
}

class UIEvent {
	constructor(uiElementId, evType="click", payload=undefined) {
		this.elementId_ = uiElementId
		this.evType_ = evType
		this.payload_ = payload
	}
	uiElementId() { return this.elementId_ }
	type() { return this.evType_ }
	payload() { return this.payload_ }
}

class VM {
	
	constructor() {
		this.pendingEvents_ = []
		this.listeners_ = []
		this.id_ = parseInt(Math.random() * 1000)
	}
	
	init() { // must be called by VM Factory immediately after the constructor; this can be overwritten and put some inherited logic in here, for initializing whole internal state
	}
	
	_initViewMeta() { // to be overriden, and specify view UI elements to be on/off
		return null
	}
	
	onTransitionTo() {} // called only after the screen associated with this VM was pushed on the screen stack (it means you are on the first time on that screen or you returned on that screen)
	
	initView() { // initializes the View (Screen), by passing messages to it, for hiding/showing/formatting widgets on it, so that it will have the final form this VM expects it to have; in our case, the messages are ScriptAPI calls
	
		this._trigger("init_ui", this._initViewMeta())
		this.sendRefresh2View()
	}
	
	sendRefresh2View() {
		this._trigger("refresh", {}) // send refresh signal to View, which can interogate the viewmodel data, by calling data(), and then auto-refresh itself
	}
	
	uiEvent(ev) {
		ev ? null : null // get rid of strict-mode error
		// handles an ui event and return true/false if it was handled correctly (TODO: or transition ?!...)
	}
	
	modelEvent(ev) {
		ev ? null : null // get rid of strict-mode error
		// handles a model change event and returns true/false if it handled it or not
	}
	
	_data() { // TO BE overriden, sends relevant view-model data to the view
		
	}
	
	data() { // DO NOT EDIT
		return {
			'vmdata': this._data(),
			'vmmeta': this._initViewMeta()
		}
	}
	
	registerForVMChange(clbk) {
		this.listeners_.push(clbk)
	}
	
	_trigger(change, payload) {
		if (this.listeners_.length === 0) {
			this.pendingEvents_.push({change, payload})
			return 
		}
		
		const triggerIt = (change, payload) => {
			//console.log(`num listeners: ${this.listeners_.length}`)
			for (let clbk of this.listeners_) {
				if (clbk) {
					if (!clbk(change, payload)) {
						console.warn(`view did not completely handled vm event ${change}`)
					}
					//console.log(`clbk called...`)
				}
			}
		}
		if (this.pendingEvents_.length > 0) { // triggerring old scheduled events, for that time when no listener was active
			for (let pe of this.pendingEvents_) {
				triggerIt(pe.change, pe.payload)
			}
			this.pendingEvents_ = []
		}
		triggerIt(change, payload)
	}
}

class VMFactory {
	constructor() {
		this.vmrefs_ = {}
	}
	// it will also register the created VM to the current screen, for events, which, in turn, will also register the screen to the VM for VM-changes; BUT will let the VM register itself to the model, for certain changes
	
	_createVM(key, viewRef, params) { // key is the VM type you want // can use the screenRef.constructor.name
		key ? null : null // get rid of strict-mode error
		viewRef ? null : null // get rid of strict-mode error
		params ? null : null // get rid of strict-mode error
		return null; // it returns the newly created VM
	}
	
	__registerVM(key, viewRef, params) { // this should NOT be overwritten, only _createVM method
		const vm = this._createVM(key, viewRef, params)
		vm.init()
		return vm
	}
	
	getVM(key, viewRef, params, resetInstance=false) {
		const create_ = () => {
			return this.__registerVM(key.trim().toLowerCase(), viewRef, params)
		}
		const k = `${key.trim().toLowerCase()}_${viewRef.constructor.name.toLowerCase()}`
		if (resetInstance) {
			this.vmrefs_[k] = create_()
		}
		else {
			this.vmrefs_[k] = this.vmrefs_[k] ? this.vmrefs_[k] : create_()
		}
		return this.vmrefs_[k]
	}
}

class MVVMInputMessage {

}

class MVVMOutputMessage {

}

class MVVMInputModule {
	notify(ev) { // MVVMInputMessage type
		ev ? null : null
		// doing nothing, this method should be overriden by io_modules.js unit
	}
}

class MVVMOutputModule {
	sendMessage(payload) {
		payload ? null : null
		// doing nothing, but after being overriden by io_modules.js unit, it should build a MVVMOutputMessage and should send it to the responsible external module
	}
}

class PScreen { // projected screen

	constructor() {
		this.resetVMRetrieve_ = true
	}
	
	init() {
		const vm = this.getVM()
		if (vm) {
			vm.registerForVMChange((vmEvent, payload) => {
				switch (vmEvent?.toLowerCase()) {
					
					case "init_ui":
						// todo manage UI reconfiguration...
						this.configureUI(payload)
						return true
						
					case "refresh":
						this.refreshView()
						return true
						
					default:
						return this.applyVMChange(vmEvent, payload)
				}
			})
		}
		else {
			console.warn(`getVM() returns an invalid VM for screen ${this.constructor.name}`)
		}
	}
	
	configureUI(params) {
		params ? {} : {}
	}
	
	screenId() { return null } // the qux screen id associated with the current screen class
	
	_getVM(resetFactoryInstance) { // should implement it as lazy get, using the VMFactory to create a VM, and also cache-ing it for later calls (like a "singleton" VM, using (other class's) this getVM method)
		resetFactoryInstance ? {} : {}
		return null;
	}
	
	getVM() {
		const vm = this._getVM(this.resetVMRetrieve_)
		this.resetVMRetrieve_ = false
		return vm
	}
	
	applyVMChange(vmEvent, payload) {
		vmEvent ? {} : {}
		payload ? {} : {}
	}
	refreshView() {
		
	}
	
	sendUIEvent(ev) {
		let vmSucceeded = false
		const vm = this.getVM()
		if (!vm) {
			console.warn(`current screen ${this.constructor.name} doesn't have a valid VM`)
		}
		else {
			vmSucceeded = vm.uiEvent(ev)
			if (!vmSucceeded) {
				console.warn(`uiEvent on the VM failed, for event ${JSON.stringify(ev)}`)
			}
		}
		const nextScr = MVVM_STARTER.context().transitionController().uiEvent(this, ev)
		return nextScr ? nextScr : (vmSucceeded ? "same_screen" : null)
	}

	transitionValid() {} // checks if the actual context (previous screen, current UI event (pe)) are valid for this screen to appear
	
	//transitionTarget() { return null } // this instructs quantUX to instantiate this screen, next render time, when the context is ready (transitionValid) -- null means, the caller will decide what screen to instantiate (a default one)

	build() {
		if (!this.transitionValid()) return;
		this._ibuild()
	} // both methods are dealing with GUI contents, but this one is trigered only one time, before transitioning to the screen, and the second one, virtually any time you are modifying something in the model
}


class MVVM_UIUtils {

	parseWidgetIdx(name) {
        return parseInt(name.trim().slice(-1))
    }
    
	__hideIfExists(widgName, scr) {
		//console.log(`hiding: ${widgName}`)
		if (scr.groupExists(widgName)) {
			//console.log('exists: group')
			scr.getGroup(widgName).hide();
			//console.log('hidden')
			return true
		}
		else if (scr.widgetExists(widgName)) {
			//console.log('exists: widget')
			scr.getWidget(widgName).hide();
			//console.log('hidden')
			
			//scr.getWidget(widgName).setStyle({'background-color': 'yellow'})
			return true
		}
		return false
	}
	__showIfExists(widgName, scr) {
		//console.log(`showing: ${widgName}`)
		if (scr.groupExists(widgName)) {
			//console.log('exists: group')
			scr.getGroup(widgName).show();
			//console.log('shown')
			return true
		}
		else if (scr.widgetExists(widgName)) {
			//console.log('exists: widget')
			scr.getWidget(widgName).show();
			//console.log('shown')
			return true
		}
		return false
	}
	
	setVisibility(visible, widgName, scr) {
		if (visible) {
			return MVVM_STARTER.UIUtils().__showIfExists(widgName, scr)
		}
		else {
			return MVVM_STARTER.UIUtils().__hideIfExists(widgName, scr)
		}
	}

	title(tit) {
		//console.log(`setting title to ${tit}`)
		
		data.uimeta = {
			...data.uimeta,
			generic_list_title: tit
		};
	}
}


class TransitionController {
	uiEvent(screenRef, ev) { // will return class names (string)
		screenRef ? {} : {}
		ev ? {} : {}
		return "same"
	}
}


class ScreenFactory {
	instantiate_(scrCls, params) { return new scrCls(params) }
	
	screenIdFromClsName(clsName) {
		const scrInst = this.createScreen(clsName)
		return scrInst ? scrInst.screenId() : null
	}
	
	// to be overwritten
	createScreen(clsName, params) { clsName ? {} : {}; params ? {} : {}; return null }
	screenClsFromId(screenId) { screenId ? {} : {}; return null }
}

class MVVMConfigurator {
	AsyncScreens() {
		return {}
	} 
	BindedWidgets() {
		return {}
	}
	ScreenTransitionMeta() {
		return {}
	}
	
	TransitionController() { return null }
	ModelFactory() { return null }
	VMFactory() { return null }
}


let MVVM_STARTER = null; // will be later instantiated

class MVVMContext {
	
	static Controller = class {
		constructor() {
			this.evQueue_ = [] // it doesn't support but single events from qux, but we presume we have support for multiple events or an events-queue
		}
		pushEvent(ev) { this.evQueue_.push(ev) }
		consumeLastEvent() { return this.evQueue_.pop() }
	}
	
	
	manualUpdateBindedWidget(bwid, value) {
		const bindKey = MVVM_STARTER.configurator().BindedWidgets()[bwid]
		if (bindKey) {
			data[bindKey] = value
			this.saveBindedWidgetsState()
		}
	}
	
	_saveState() {
		data.screensStack = JSON.parse(JSON.stringify(this.screensStack_))
		data.bindedwidgetsstate = JSON.parse(JSON.stringify(this.bwstate_))
	}
	
	constructor(asyncEvId = null) {
		this.valid_ = true
		
		this.screensStack_ = data.screensStack ? data.screensStack : []
		this.bwstate_ = data.bindedwidgetsstate ? data.bindedwidgetsstate : {}
		this.controller_ = new MVVMContext.Controller()
		const eid = data.__sourceElement ? data.__sourceElement.toLowerCase() : undefined
		
		console.log(`asyncEvId: ${asyncEvId}`)
		if (asyncEvId) {
			console.log(`*************building async event: ${MVVM_STARTER.configurator().AsyncScreens()[asyncEvId]}`)
			this.controller_.pushEvent(new UIEvent(asyncEvId, 'async_screen', MVVM_STARTER.configurator().AsyncScreens()[asyncEvId]))
		}
		else if (eid) {
			this.controller_.pushEvent(new UIEvent(eid))
		}
		else { // *NU* am un CLICK
			const changedBind = data.__sourceData
			const newVal = data.__sourceNewValue
			let foundChange = false
			if (changedBind) {
				const bwidgs = MVVM_STARTER.configurator().BindedWidgets()
				for (let widgname of Object.keys(bwidgs)) {
					const binding = bwidgs[widgname]
					if (binding === changedBind) {
						console.log(`create bind event with ${newVal}`)
						this.controller_.pushEvent(new UIEvent(widgname, 'type', newVal))
						foundChange = true
						break // only ONE event, it should not be possible to interract with multiple binded-widgets in the same time; if, for some reason, you want to support multiple events, then you must also impl another scheme for the consumeLastEvent call bellow
					}
				}
				if (!foundChange) { // nu am bind
					this.valid_ = false
				}
				else {
					this.saveBindedWidgetsState()
				}
			}
			else if (changedBind === null) { // nu am bind
				this.valid_ = false
			}
		}
		
		if (!this.valid_) {
			return // no more continuing, to affect data. (state) because the context is not valid (MVVM controller should return immediately) -- this is only possible if you have databinded scripts in QUX, and some non-widgets data. changes were done (and this is the case whenever the data. changes, which is kind of bad, but this is the situation...)
		}
		
		const lastScreenIsNotRegistered = (ps) => ps && this.lastScreen()?.screen && MVVM_STARTER.configurator().ScreenFactory().createScreen(this.lastScreen()?.screen, {})?.screenId()?.toLowerCase() !== ps.toLowerCase()
		// this will contain class names
		
		// the first screen before this script is starting to run as a MVVM router, will not be registered here, unless we make this as a special case, like so:
		const ps = data.__sourceScreen ? data.__sourceScreen.toLowerCase() : undefined
		if (ps && (this.screensStack_.length <= 0 || lastScreenIsNotRegistered(ps))) {
			const scr_ = MVVM_STARTER.configurator().ScreenFactory().screenClsFromId(ps)
			if (scr_) {
				console.log(`pushing screen to stack MANUALLY: ${scr_}`)
				this.screensStack_.push({
					screen: scr_,
					params: {}
				})
				this._saveState()
			}
			else {
				console.warn(`Detected unregistered screen (${ps}) but could not instantiate a cls name from it to add it into the screens stack`)
			}
		}
	}
	
	controller() { return this.controller_}
	
	transitionController() { return MVVM_STARTER.configurator().TransitionController() }
	modelFactory() { return MVVM_STARTER.configurator().ModelFactory() }
	vmFactory() { return MVVM_STARTER.configurator().VMFactory() }
	
	screenMeta(screenCls) { return MVVM_STARTER.configurator().ScreenTransitionMeta()[screenCls] ? MVVM_STARTER.configurator().ScreenTransitionMeta()[screenCls] : {} }
	
	pushScreen(screenClsName, params) {
		console.log(`PUSHIIINGGGGGGGGGGGG SCREEN ${screenClsName}`)
		this.screensStack_.push({
			screen: screenClsName,
			params
		})
		this._saveState()
	}
	updateLastScreenParams(params) {
		if (this.screensStack_.length >= 1) {
			let cparams = this.screensStack_[this.screensStack_.length - 1].params
			for (let k of Object.keys(params)) {
				cparams[k] = params[k]
			}
			this.screensStack_[this.screensStack_.length - 1].params = cparams
			this._saveState()
			return true
		}
		return false
	}
	
	saveBindedWidgetsState() {
		const bwidgs = MVVM_STARTER.configurator().BindedWidgets()
		for (let widgname of Object.keys(bwidgs)) {
			const binding = bwidgs[widgname]
			this.bwstate_[widgname] = data[binding]
		}
		this._saveState()
	}
	
	lastScreen() { return this.screensStack_.length >= 1 ? this.screensStack_[this.screensStack_.length - 1] : undefined }
	previousScreen() { return this.screensStack_.length >= 2 ? this.screensStack_[this.screensStack_.length - 2] : undefined }
	
	popLastScreen() { return this.screensStack_.pop() }
	
	valid() { return this.valid_ }
}

class MVVMStarter {
	
	constructor() {
		this.context_ = null
		this.uiUtils_ = new MVVM_UIUtils()
	}
	
	UIUtils() { return this.uiUtils_ }
	
	configurator() { return null } // :MVVMConfigurator
	
	buildContext(asyncEvId) { 
		this.context_ = new MVVMContext(asyncEvId)
		return this.context_
	}
	
	context() {
		if (this.context_ === null) this.buildContext()
		return this.context_
	}
	
	
	_instantiateScreen(ctx) {
		const {screen, params} = ctx.lastScreen()
		console.log(`log3: creating screen: ${screen} with params ${JSON.stringify(params)}`)
		const sref = MVVM_STARTER.configurator().ScreenFactory().createScreen(screen, params)
		sref.init()
		console.log(`create screen ${screen} with params ${JSON.stringify(params)}`)
		return sref
	}
	_sendUIEvents(screen, ev) {
		if (screen) {
			return screen.sendUIEvent(ev)
		}
		return "same"
	}
	_updateContextByTarget(ctx, targetScreen) {
		ctx.pushScreen(targetScreen)
		return ctx
	}
	
	lastScreenUpdated(params) {
		console.log(`EVRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR`)
		MVVM_STARTER.context().updateLastScreenParams(params)
		return "same_screen"
	}
	
	static _parseParams(raw) {
		let pa = {}
		const exprs = raw.split("&")
		for (let e of exprs) {
			const tokens = e.split("=")
			pa[tokens[0]] = tokens[1]
		}
		return pa
	}
	
	static _parseScreenUrl(url) {
		const paramsRaw_ = url && url.includes("?") ? url.substring(url.indexOf("?") + 1) : ""
		const params = MVVMStarter._parseParams(paramsRaw_)
		const screen = url && url.includes("?") ? url.substring(0, url.indexOf("?")) : url
		console.log(`evr111: screen: ${screen}; params: ${JSON.stringify(params)}`)
		return {screen, params}
	}
	
	// PUBLIC methods
	
	//lastScreenIs(screenCls) {
	//	const ctx = new MVVMContext()
	//	return ctx.lastScreen()?.screen === screenCls
	//}
	
	// this is the single function that needs to be called and return its results on the (mvvm-routing) JS script
	doComputation(params="default") {
		
		const mode = params && typeof params !== 'string' ? params.mode : (typeof params === "string" ? params : "default")
		const asyncEvId = params && typeof params !== 'string' ? params.asyncEvId : null
		const popLastScreen = params && typeof params !== 'string' ? params.popLastScreen : null
		const forceTransitionTo = params && typeof params !== 'string' ? params.forceTransitionTo : null
		
		console.log(`computation mode: ${mode}; asyncEvId: ${asyncEvId} popLastScreen: ${popLastScreen}; force transition to: ${forceTransitionTo}`)
		
		const ctx = this.buildContext(asyncEvId)
		console.log(`ctx screens: ${JSON.stringify(ctx.screensStack_)}; \n${JSON.stringify(data.screensStack)}`)
		if (!ctx.valid()) {
			return {ignore: "dummy"}
		}
		
		if (forceTransitionTo) {
			const {screen, params} = MVVMStarter._parseScreenUrl(forceTransitionTo)
			ctx.pushScreen(screen, params)
			const ns = this._instantiateScreen(ctx)
			const nvm = ns.getVM();
			console.log(`log1: 112 configured screen for next render, vm name ${nvm?.constructor?.name}`)
			if (nvm) nvm.onTransitionTo()
			if (nvm) nvm.initView()
			console.log(`log1: 111 initView done`)
			let target = {to: MVVM_STARTER.configurator().ScreenFactory().screenIdFromClsName(screen)}
			return {...target, ...ctx.screenMeta(screen)}
		}
		else if (popLastScreen) {
			ctx.popLastScreen()
			const {screen, params} = ctx.lastScreen()
			console.log(`log4: poplastscreen`)
			let target = {to: MVVM_STARTER.configurator().ScreenFactory().screenIdFromClsName(screen)}
			target = {...target, ...ctx.screenMeta(screen)}
			if (target.to) {
				ctx.pushScreen(screen, params)
				const ns = this._instantiateScreen(ctx)
				const nvm = ns.getVM();
				console.log(`log1: 111 configured screen for next render, vm name ${nvm?.constructor?.name}`)
				if (nvm) nvm.onTransitionTo()
				if (nvm) nvm.initView()
				console.log(`log1: 111 initView done`)
			}
			return target
		}
		else {
			const s = this._instantiateScreen(ctx) // s este folosit numai pentru sendUIEvents, ATAT, configurarea se face mai jos...
			//const vm = s.getVM();// if (vm) vm.initView()
				
			console.log(`log1: screen instantiated`)
			
			let nextScreenCls = this._sendUIEvents(s, ctx.controller().consumeLastEvent()) // should also send it to the navigation-controller
			
			//if (mode.toLowerCase() === "no-transition") {
			//	ctx.saveBindedWidgetsState()
			//	return null
			//}
			console.log(`nextScreenCls: ${nextScreenCls}`)
			
			let params = {}
			if (!nextScreenCls) {
				return null
			}
			
			let noPush = false
			if (nextScreenCls.toLowerCase() === "same_screen") {
				const ls_ = ctx.lastScreen()
				params = ls_.params
				nextScreenCls = ls_.screen
				noPush = true
				
				console.log(`log1: same-screen: ${ls_.screen}`)
			}
			else {
				// here, the "same" ret-code should be interpretted as loop="something", to refresh the same screen again
				const ns__ = MVVMStarter._parseScreenUrl(nextScreenCls)
				nextScreenCls = ns__.screen
				params = ns__.params
				
				console.log(`log1: normal screen transition to ${nextScreenCls}, params: ${JSON.stringify(params)}`)
			}
			
			console.log(`screen: ${s?.constructor.name}`)
			console.log(`nextScreenCls1: ${nextScreenCls}`)
			
			let target = !nextScreenCls || nextScreenCls.trim().toLowerCase() === "same" ? {loop: "fast_exit"} : {to: MVVM_STARTER.configurator().ScreenFactory().screenIdFromClsName(nextScreenCls)}
			target = {...target, ...ctx.screenMeta(nextScreenCls)}
			// no need to push the new screen to the stack, it will be auto-added next time we instantiate the context, from the qux ScriptMixin ("qux controller")
			
			console.warn(`target: ${JSON.stringify(target)}`)
			
			if (target.to) {
				console.log(`log1: target.to: ${target.to}`)
				
				if (!noPush) {
					console.log(`log1: pushing screen on stack`)
					ctx.pushScreen(nextScreenCls, params)
				}
				const ns = this._instantiateScreen(ctx)
				const nvm = ns.getVM();
				console.log(`log1: configured screen for next render, vm name ${nvm?.constructor?.name}`)
				if (!noPush && nvm) nvm.onTransitionTo()
				if (nvm) nvm.initView()
				console.log(`log1: initView done`)
			}
		
			console.warn(`returning target: ${JSON.stringify(target)}`)
			return target
		}
	}
}

//REMOVE FROM HERE
// get rid of strict-mode errors 
const dummy0 = new Model()
const dummy1 = new ModelFactory()
const dummy2 = new ModelEvent()
const dummy3 = new UIEvent()
const dummy4 = new VM()
const dummy5 = new VMFactory()
const dummy6 = new MVVMInputMessage()
const dummy7 = new MVVMOutputMessage()
const dummy8 = new MVVMInputModule()
const dummy9 = new MVVMOutputModule()
const dummy10 = new PScreen();
const dummy11 = new MVVM_UIUtils();
const dummy12 = new TransitionController();
const dummy13 = new ScreenFactory();
const dummy14 = new MVVMConfigurator();
const dummy15 = new MVVMContext();
const dummy16 = new MVVMStarter();
dummy0 ? null : null
dummy1 ? null : null
dummy2 ? null : null
dummy3 ? null : null
dummy4 ? null : null
dummy5 ? null : null
dummy6 ? null : null
dummy7 ? null : null
dummy8 ? null : null
dummy9 ? null : null
dummy10 ? null : null
dummy11 ? null : null
dummy12 ? null : null
dummy13 ? null : null
dummy14 ? null : null
dummy15 ? null : null
dummy16 ? null : null
}

export const code = codeFunction.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1]

//code ? null : null