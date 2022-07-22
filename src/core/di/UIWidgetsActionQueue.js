
import Animation from 'core/Animation'
import DIProvider from 'core/di/DIProvider'

export class UIWidgetsActionQueue {

    constructor(renderFactory = null) {
        this.queue = {}
        this.noActionsNotifsPending = {}
        this.currentPendingActions = {}
        this.renderFactory = renderFactory;
    }

    setRenderFactory(ref) {
        this.renderFactory = ref;
    }

    async pushAction(widgetId, action, payload, clbk = (action, payload) => {console.log(`${action?"":""}${payload?"":""}`)}) {
        console.warn(`pushAction(${widgetId}, ${action}, ${payload})...`)

        if (this.renderFactory) {
            const widg = this.renderFactory.getUIWidget({id: widgetId})
            if (widg) {
                console.warn(`...consuming the action right now`)
                if (await this.__consumeAction(widg, action, payload, widgetId)) {
                    clbk(action, payload);
                }
                return true;
            }
        }
        this.queue[widgetId] = this.queue[widgetId] ? this.queue[widgetId] : [];
        this.queue[widgetId].push({
            action,
            payload,
            clbk
        });
        console.warn(`...postponing the action`)
        return false; // false means scheduled for later execution...
    }

    actionsPendingCount(action) {
        let count = 0
        const allActions = [].concat.apply([], Object.values(this.queue))
        for (let act of allActions) {
            if (act.toLowerCase() === action.toLowerCase()) {
                count ++
            }
        }
        return count;
    }

    registerNoMoreActionsListener(action, clbk = () => {}) {
        if (!this.actionsPendingCount(action) && Object.values(this.currentPendingActions).filter(e => Object.values(e).length > 0).length <= 0) {
            clbk()
            return
        }
        this.noActionsNotifsPending[action] = this.noActionsNotifsPending[action] ? this.noActionsNotifsPending[action] : []
        this.noActionsNotifsPending[action].push(clbk)
    }

    async __consumeAction(widget, action, payload, widgetId = -1) {

        const createAnimation = (animFactory, event) => {
            var anim = animFactory.createAnimation();
            anim.duration = event.duration;
            anim.delay = event.delay;
            anim.event = event;
            if (event.easing) {
                anim.setEasing(event.easing);
            }


            var fromStyle = event.from.style;
            var fromPos = event.from.pos;
            var toStyle = event.to.style;
            var toPos = event.to.pos;


            var me = animFactory;
            anim.onRender(p => {
                if (widget) {
                    try {
                        if (toStyle) {
                            //console.error(`\n*********************fromStyle: ${JSON.stringify(fromStyle)}; toStyle: ${JSON.stringify(toStyle)}\n******************************`)
                            var mixedStyle = me.getAnimationMixedStyle(fromStyle, toStyle, p);
                            widget.setAnimatedStyle(mixedStyle);
                        }

                        if (toPos && fromPos) {
                            var mixedPos = me.getAnimationMixedPos(fromPos, toPos, 1 - p);
                            mixedPos.x += event.posOffset.x
                            mixedPos.y += event.posOffset.y
                            widget.setAnimatedPos(mixedPos, mixedStyle);

                            const {tx,ty} = {
                                tx: mixedPos.x,
                                ty: mixedPos.y
                            }
                            // console.error(`updating dom for widget id '${widgetId}'...`)
                            DIProvider.tempModelContext().update(widgetId, {tx,ty})
                            DIProvider.tempModelContext().update(widgetId, {postStyle: mixedStyle})
                        }

                    } catch (e) {
                        console.error("WidgetAnimation.render() >  ", e);
                        console.error("WidgetAnimation.render() >  ", e.stack);
                    }
                }
            })

            return anim;
        }

        return new Promise((resolve, reject) => {

            console.log(reject ? "" : "")

            this.currentPendingActions[action] = this.currentPendingActions[action] ? this.currentPendingActions[action] : {}
            this.currentPendingActions[action][widgetId] = 'just-a-maker'

            if (action.toLowerCase() === "translate") {
                widget.postTransform(payload);
                delete this.currentPendingActions[action][widgetId]
                resolve(true)
            }
            else if (action.toLowerCase() === "animate") {
                const animEvent = {
                    duration: payload.durationMs,
                    delay: payload.delayMs,
                    from: {
                        style: payload.styleFrom,
                        pos: payload.posFrom
                    },
                    to: {
                        style: payload.styleTo,
                        pos: payload.posTo
                    },
                    posOffset: payload.posOffset
                }
    
                var animFactory = new Animation();
                //var anim = animFactory.createWidgetAnimation(widget, animEvent);
                var anim = createAnimation(animFactory, animEvent);
    
                anim.run()
                console.error(`anim.run-----`)
                //anim.onEnd(lang.hitch(this, "onAnimationEnded", e.id));
                anim.onEnd(() => {
                    delete this.currentPendingActions[action][widgetId]
                    resolve(true)
                })
            }
            else {
                console.warn(`widget action '${action}' (with payload "${JSON.stringify(payload)}") for widget id ${widgetId} is unknown and it was ignored...`);
                delete this.currentPendingActions[action][widgetId]
                resolve(false)
            }
        });
    }

    async consumeActions(widgetId, widget, doneClbk = () => {}) {
        
        const scheduled = this.queue[widgetId];
        if (!scheduled) { doneClbk(); return }

        while (scheduled.length > 0) {
            const sched = scheduled.shift(); // pop-first
            const action = sched.action;
            const payload = sched.payload;
            const clbk = sched.clbk;
            if (await this.__consumeAction(widget, action, payload, widgetId)) {
                clbk(action, payload);
            }

            if (this.noActionsNotifsPending[action]) {
                if (!this.actionsPendingCount(action)) {
                    for (let noaClbk in this.noActionsNotifsPending[action]) {
                        noaClbk()
                    }
                    this.noActionsNotifsPending[action] = []
                }
            }
        }

        doneClbk();

    }
}