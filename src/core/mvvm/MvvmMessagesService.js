import DIProvider from 'core/di/DIProvider'
import {fetchPOSTWithAuthorization} from 'core/mvvm/mvvm_fetching_utils'

export class MvvmMessagesService {
    
    constructor() {
    }

    async sendExternalMessage(endpoint, data) {
        const repoName_ = DIProvider.model().mvvm_repo_name
        const authToken_ = DIProvider.simulationAuthorizeToken()
        // @TODO idempotent call, so generating an unique id to resend the message if it fails... should store a queue with un ACK ed messages...
        const url_ = `/mvvm/apigateway/${repoName_}/${endpoint}`
        try {
            /*const results_ = */await fetchPOSTWithAuthorization(url_, data, authToken_)
        }
        catch(e) {
            console.error(e) // TODO resend the message after some time, with N max tries and a real console.critical/error message if the message didn't succeeded afterwords
            // TODO if the apigateway ping/alive mechanism is already implemented, there can be a centralizing class/singleton that manages this functioning or non-functioning state of the api-gateway server and this kind of situations (likewise when a mvvm query was not sent correcly) can be implemented as anotehr source of non-functioning state registering, additionally to the ping() (with setInterval) call -> that class can notify some visual component that can trigger the spash layer with the error, on the current screen
        }
    }
}