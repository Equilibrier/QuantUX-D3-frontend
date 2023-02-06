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
                // console.error(`##### getting scaling factor from diprovider: ${DIProvider.scalingComputer().scaleFactor()}`)
                worker.postMessage({
                    code: js, 
                    //model: lang.clone(model),
                    model: DIProvider.tempModelContext().currentModel(),
                    viewModel: lang.clone(viewModel),
                    scaleFactor: DIProvider.scalingComputer().scaleFactor()
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
                        console.trace();
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

    onMessage (msg, resolve, reject, start) {
        // console.error(`worker msg: ${JSON.stringify(msg.data)}`)
        if (msg.data.key && msg.data.key === "stop-animation") {
            const {animId} = msg.data.props;
            DIProvider.uiWidgetsActionQueue().stopAnimation(animId)
            return;
        }
        if (msg.data.key && msg.data.key === "ext-notif") {
            const {message} = msg.data.props;
            DIProvider.mvvmOutputsService().sendExternalNotification(message) // is async function, but I don't have to wait for it (I think... :) )
            return;
        }
        if (msg.data.key && msg.data.key === "ext-query") {
            // console.log(`message: ${JSON.stringify(msg)}`)
            const {message, from_id} = msg.data.props;
            DIProvider.mvvmOutputsQueryService().sendExternalQuery(from_id, message) // is async function, but I don't have to wait for it (I think... :) )
            return;
        }

        const end = new Date().getTime()
        Logger.log(-1, 'ScriptEngine.onMessage() > took',end - start)
        this.isDone = true
        resolve(msg.data)
    }
}