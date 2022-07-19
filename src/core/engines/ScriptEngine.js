import Logger from '../Logger'
import lang from '../../dojo/_base/lang'

import DIProvider from 'core/di/DIProvider'

let worker = new Worker(new URL('./ScriptWorker.js', import.meta.url))


export default class ScriptEngine {
    

    run (js, model, viewModel, renderFactory) {
        Logger.log(1, 'ScriptEngine.run()')
        this.isDone = false
        return new Promise((resolve, reject) => {

            try {
                Logger.log(0, "Code to be executed: ");
                Logger.log(0, js);

                // TDOD: we could compress the model and just remove everything like styles etc...
                const start = new Date().getTime()
                worker.onmessage = (m) => this.onMessage(m, resolve, reject, start, js, renderFactory)
                worker.postMessage({
                    code: js, 
                    //model: lang.clone(model),
                    model: DIProvider.tempModelContext().currentModel(),
                    viewModel: lang.clone(viewModel)
                })
                // worker.onmessage(e => {
                //     console.error(`mesaj de la worker: ${JSON.stringify(e)}`)
                // })


                setTimeout(() => {
                    Logger.log(5, 'ScriptEngine.run() > isDone:', this.isDone)
                    if (!this.isDone) {
                        resolve({
                            status: 'error',
                            error: 'Running too long'
                        })
                        Logger.error('ScriptEngine.run() > need to terminate script')
                        Logger.error('ScriptEngine.run() > js: \n' + js)
                        worker.terminate()
                        worker = new Worker(new URL('./ScriptWorker.js', import.meta.url))
                    }
                   
                }, 1000)
            
            } catch (error) {
                Logger.error('ScriptEngine.run() > Error', error)
                resolve({
                    status: 'error',
                    error: error.message
                })
            }
            Logger.log(1, 'ScriptEngine.run() > exit')
        })
    }

    onMessage (message, resolve, reject, start) {
        if (message?.data?.type === "translate") {
            const widget = message.data.widget
            DIProvider.uiWidgetsActionQueue().pushAction(widget.id, message.data.type, message.data.action_payload, (action, payload) => {
                console.log(action ? "" : "") // dummy params, but err if I do not do this (strict-mode compilation)
                console.log(payload ? "" : "")

                const model = DIProvider.tempModelContext().currentModel();
                const element = model.widgets[widget.id] || model.groups[widget.id]

                DIProvider.tempModelContext().update(widget.id, {
                    x: element.x + payload.x,
                    y: element.y + payload.y
                })
            })
            return;
        }
        console.error(`worker msg: ${JSON.stringify(message.data)}`)

        const end = new Date().getTime()
        Logger.log(-1, 'ScriptEngine.onMessage() > took',end - start)
        this.isDone = true
        resolve(message.data)
    }
}