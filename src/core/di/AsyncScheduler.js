export class AsyncScheduler {
    
    constructor() {
        this._clbks = {
            'anim_started': {}, // you can define any number of events, and the associated methods bellow; this class only syncs events with clbks, this is all (but it's very powerfull)
            'anim_ended': {}
        };
        this._clbkKeys = {}
    }

    _schedule(key, clbk) {
        const id = Math.random()
        this._clbks[key][id] = clbk
        this._clbkKeys[id] = key
        return id
    }
    async _call(key, payload) {
        for (let clbk of Object.values(this._clbks[key])) {
            await clbk(payload)
        }
        // do something else ?!... like trigger a callback-called notification somewhere
    }

    unschedule(scheduleId) {
        const key = this._clbkKeys[scheduleId]
        if (!key) {
            console.warn(`AsyncScheduler: unschedule: ${scheduleId} id does not exist, cannot unregister it. Did you passed a wrong id ?!`)
            return
        }
        console.error(`UNSCHEDULING schedule ${scheduleId}: ${JSON.stringify(this._clbkKeys)}`)
        delete this._clbkKeys[scheduleId]
        delete this._clbks[key][scheduleId]

    }

    scheduleForAnimationEnded(clbk) {
        console.error(`SCHEDULED anim ended... with clbk`)

        return this._schedule('anim_ended', clbk)
    }
    scheduleForAnimationStarted(clbk) {
        console.error(`SCHEDULED anim started... with clbk`)

        return this._schedule('anim_started', clbk)
    }
    triggerAnimationStarted(elementId) { // instead of elementId it could be anything, but it should be specified in here, for a consistent use among the callers of this methods...
        console.error(`animation-started triggered`)
        this._call('anim_started', elementId)
    }
    triggerAnimationEnded(elementId) {
        console.error(`animation-ENDED triggered`)
        this._call('anim_ended', elementId)
    }

    // ... other events can be supported in the very same way...
}