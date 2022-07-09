import ScriptAPI from './ScriptAPI'
import ScriptConsole from './ScriptConsole'
import Logger from '../Logger'

self.addEventListener('message', e => {
    Logger.log(3, 'ScriptWorker.message() > enter ', e)


    const js = e.data.code
    e.console.log("Code to be executed: ");
    e.console.log(js);
    const model = e.data.model
    const viewModel = e.data.viewModel
    
    const qux = new ScriptAPI(model)
    const code = new Function('qux', 'data', 'console', js);
    const console = new ScriptConsole()
    let result = undefined
    try {
        result = code(qux,viewModel, console)
        self.postMessage({
            to: result,
            viewModel: viewModel,
            appDeltas: qux.getAppDeltas(),
            console: console.messages,
            status : 'ok'
        })
    } catch (error) {
        Logger.error(1, 'ScriptWorker.message() > Error', error)
        console.error(error)
        self.postMessage({
            status: 'error',
            console: console.messages,
            error: error.message,
            stack: error.stack
        })
    }
      
  

    Logger.log(1, 'ScriptWoker.message() > exit ')

})