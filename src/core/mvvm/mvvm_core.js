const codeFunction = function(){
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
}

export const code = codeFunction.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1]

//code ? null : null