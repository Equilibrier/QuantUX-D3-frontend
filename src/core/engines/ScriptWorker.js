import ScriptAPI from './ScriptAPI'
import ScriptConsole from './ScriptConsole'
import Logger from '../Logger'

self.addEventListener('message', e => {
    Logger.log(3, 'ScriptWorker.message() > enter ', e)

    self.addEventListener('error', (errorEvent) => {
        const { lineno, colno, message } = errorEvent;
        console && console.log(`Error thrown at: ${lineno}:${colno}: ${message}, full stack bellow: \n\t${errorEvent.error.stack}`); // sometimes it gives me an error that 'console' is not yet initialized
        // Don't pollute the console with additional info:
        errorEvent.preventDefault();

        Logger.error(1, 'ScriptWorker.message() > Error', errorEvent)
        console && console.error(errorEvent)
        //const evEvent = JSON.parse(JSON.stringify(errorEvent))
        self.postMessage({
            status: 'error',
            //console: console.messages,
            error: errorEvent.message,
            stack: errorEvent.error.stack
        })
    });

    const js = e.data.code
    const model = e.data.model
    const viewModel = e.data.viewModel
    const scalingFactor = e.data.scaleFactor
    
    const qux = new ScriptAPI(model, scalingFactor)
    const code = new Function('qux', 'data', 'console', js);
    const console = new ScriptConsole()
    let result = undefined
    try {
        setTimeout(() => {
            result = code(qux, viewModel, console)

            self.postMessage({
                to: result !== undefined ? (typeof result === 'string' ? result : result.to) : undefined,
                delayedBackMs: result !== undefined ? result.backTimeout : undefined,
                runCode: result?.runCode ? result.runCode : undefined,
                loop: result !== undefined ? result.loop : undefined,
                immediateTransition: result !== undefined && result.immediateTransition !== undefined ? result.immediateTransition : false,
                viewModel: viewModel,
                appDeltas: qux.getAppDeltas(),
                console: console.messages,
                status : 'ok'
            })
        });
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