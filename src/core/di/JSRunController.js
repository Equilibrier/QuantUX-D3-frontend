
import ScriptEngine from '../engines/ScriptEngine'

export class JSRunController {
    constructor() {
        this.runs_ = []
        this.runnerStarted_ = false
    }

    async __runnerStart() {
        if (this.runs_.length <= 0 || this.runnerStarted_) {
            return false;
        }
        this.runnerStarted_ = true
        
        const cfg = this.runs_[0]

        const engine = new ScriptEngine()
        const result = await engine.run(cfg.jsCode, cfg.model, cfg.viewmodel, cfg.renderFactory)
        this.runs_.splice(0, 1)
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

    scheduleRun(jsCode, model, viewmodel, renderFactory) {
        const idx = this.runs_.length
        this.runs_.push({
            jsCode,
            model, 
            viewmodel,
            renderFactory
        })
        const p = new Promise((resolve, reject) => {
            this.runs_[idx].resolve = resolve
            this.runs_[idx].reject = reject
        })
        this.__runnerStart()
        return p;
    }
}