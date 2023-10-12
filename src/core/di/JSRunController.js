
import ScriptEngine from '../engines/ScriptEngine'

import DIProvider from 'core/di/DIProvider'

export class JSRunController { // @TODO: de ce am mai folosit clasa asta ? probabil de dinainte de a implementa DIProvider.waitWhileMvvmRunning(); cred ca nu mai e nevoie de ea si poate complica lucrurile, de asta am adaugat acea clonare cu parse&stringify mai jos la viewmodel
    constructor() {
        this.runs_ = []
        this.runnerStarted_ = false
    }

    async __runnerStart() {
        console.error(`STARTS SCHED: ${this.runs_.length} & ${this.runnerStarted_ ? 'EXIT' : 'CONTINUE'} &  ${JSON.stringify(this.runs_.map(e => e.origScript))}`)
        if (this.runs_.length <= 0 || this.runnerStarted_) {
            return false;
        }
        this.runnerStarted_ = true
        
        const cfg = this.runs_[0]
        this.runs_.splice(0, 1)

        if (DIProvider.isMvvmRunning()) {
            console.error(`EERRRORRRRRRRRRRRR: Cosmin: mvvm already running when trying to execute ${cfg.jsCode}`)
        }

        const engine = new ScriptEngine()
        const result = await engine.run(cfg.jsCode, cfg.model, cfg.viewmodel, cfg.renderFactory)
        /*if (result.status !== "error") {
            cfg.resolve('dummy')
        }
        else {
            cfg.reject('dummy')
        }*/
        cfg.resolve(result)

        this.runnerStarted_ = false

        this.__runnerStart()
        return true
    }

    async scheduleRun(jsCode, model, viewmodel, renderFactory, origScript) {
        const idx = this.runs_.length
        this.runs_.push({
            jsCode,
            model, 
            viewmodel: JSON.parse(JSON.stringify(viewmodel)),
            renderFactory,
            origScript
        })
        const p = new Promise((resolve, reject) => {
            this.runs_[idx].resolve = resolve
            this.runs_[idx].reject = reject
        })
        this.__runnerStart()
        return p;
    }
}