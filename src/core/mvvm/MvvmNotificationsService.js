import DIProvider from "core/di/DIProvider"

export class MvvmNotificationsService {
    
    constructor() {
        
        this.queue_ = []

        this.__private = {

            eventSource: null,
            isProcessing: false,

            initSync: () => {

                const startEventSource = () => {

                  if (this.__private.eventSource) {
                    this.__private.eventSource.close();
                  }
                
                  let repoName = DIProvider.model().mvvm_repo_name
                  console.log(JSON.stringify(DIProvider.model()));
                  this.__private.eventSource = new EventSource(`mvvm/apigateway/${repoName}/notification`);
                
                  this.__private.eventSource.onmessage = (event) => {

                    //console.log('New message', event.data);
                    this.queue_.push(event.data)
                    this.__private.triggerQueueProcessing()
                  };
                
                  this.__private.eventSource.onerror = (error) => {
                    console.error('EventSource failed:', error);
                    this.__private.eventSource.close();

                    setTimeout(() => {
                        startEventSource();
                    }, 1000); // in general, a setTimeout breaks the calling stack, by forcing using the main loop (registering this call to the end of the main loop) - even a timeout of zero is good enough
                  };
                }
                
                // initial start of the remove (notifications) listener
                startEventSource();
            },

            triggerQueueProcessing: async () => {
                if (this.__private.isProcessing) return;
                if (this.queue_.length <= 0) return;

                this.__private.isProcessing = true;

                // if we have stored external messages, we try to inject them into mvvm, 
                // only if it is not already done automatically, by the current running flow
                try {
                    if (!DIProvider.isMvvmRunning()) {
                        await DIProvider.executeMvvm("return MVVM_CONTROLLER.Compute()");
                    }
                } catch (error) {
                    console.error(error);
                }

                this.__private.isProcessing = false;
                if (this.queue_.length > 0) {
                    setTimeout(() => this.__private.processQueue(), 0); // breaking the call stack
                }
            }
        }
    }

    startListening() {
        if (this.__private.eventSource && this.__private.eventSource.readyState !== EventSource.CLOSED) {
            console.warn("MVVMNotificationsService: listener already started/starting... Call to startListening, ignored !")
            return; // nop
        }
        this.__private.initSync()
    }

    stopListening() {
        if (!this.__private.eventSource || this.__private.eventSource.readyState === EventSource.CLOSED) {
            console.warn("MVVMNotificationsService: listener already stopped... Call to stopListening, ignored !")
            return; // nop
        }
        if (this.__private.eventSource) {
            this.__private.eventSource.close();
        }
    }

    discardQueue() {
        const q = JSON.parse(JSON.stringify(this.queue_))
        this.queue_ = []
        return q
    }
}