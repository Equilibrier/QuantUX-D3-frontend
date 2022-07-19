export class UIWidgetsActionQueue {

    constructor(renderFactory = null) {
        this.queue = {}
        this.renderFactory = renderFactory;
    }

    setRenderFactory(ref) {
        this.renderFactory = ref;
    }

    pushAction(widgetId, action, payload) {
        console.warn(`pushAction(${widgetId}, ${action}, ${payload})...`)

        if (this.renderFactory) {
            const widg = this.renderFactory.getUIWidget({id: widgetId})
            if (widg) {
                console.warn(`...consuming the action right now`)
                this.__consumeAction(widg, action, payload, widgetId)
                return true;
            }
        }
        this.queue[widgetId] = this.queue[widgetId] ? this.queue[widgetId] : [];
        this.queue[widgetId].push({
            action,
            payload
        });
        console.warn(`...postponing the action`)
        return false; // false means scheduled for later execution...
    }

    __consumeAction(widget, action, payload, widgetId = -1) {
        if (action.toLowerCase() === "transform") {
            widget.postTransform(payload);
        }
        else {
            console.warn(`widget action '${action}' (with payload "${JSON.stringify(payload)}") for widget id ${widgetId} is unknown and it was ignored...`);
        }
    }

    consumeActions(widgetId, widget) {
        console.warn(`consumeActions(${widgetId}, ${widget})`)

        const scheduled = this.queue[widgetId];
        if (!scheduled) return;

        while (scheduled.length > 0) {
            const sched = scheduled.shift(); // pop-first
            const action = sched.action;
            const payload = sched.payload;
            this.__consumeAction(widget, action, payload, widgetId);
        }
    }
}