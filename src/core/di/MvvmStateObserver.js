
export class MvvmStateObserver {

    constructor() {
        this.mvvmRunning_ = false

        this.__private = {
            runningPromise_: null,
            resolveF: null
        }
    }

    setRunning() {
        if (this.mvvmRunning_) { console.warn(`MvvmStateObserver: mvvm already (registered as) running !`); return }
        this.__private.runningPromise_ = new Promise((resolve) => { this.__private.resolveF = resolve })
        this.mvvmRunning_ = true 
    }
    setStopped() {
        if (!this.mvvmRunning_) { console.warn(`MvvmStateObserver: mvvm already (registered as) stopped !`); return }
        if (this.__private.resolveF) this.__private.resolveF('stopped') // dummy parameter, just for inteligibility purposes
        this.mvvmRunning_ = false
    }

    isRunning() { return this.mvvmRunning_ }

    async waitWhileRunning() {
        if (!this.mvvmRunning_) {
            return new Promise((resolve) => resolve('it was already stopped'))
        }
        return this.__private.runningPromise_
    }
}