
import Animation from 'core/Animation'
import DIProvider from 'core/di/DIProvider'

export class UIWidgetsActionQueue {

    constructor(renderFactory = null) {
        this.queue = {}
        this.noActionsNotifsPending = {}
        this.currentPendingActions = {}
        this.renderFactory = renderFactory;
        this.animStoppers = {};
    }

    reset() {
        this.queue = {}
        this.noActionsNotifsPending = {}
        this.currentPendingActions = {}
    }

    setRenderFactory(ref) {
        this.renderFactory = ref;
    }

    stopAnimation(animId, terminateClbk = () => {}) {
        console.log(`cosmin:stopanim: evrik1: ${animId}; ${JSON.stringify(this.animStoppers)}`)
        if (this.animStoppers[animId] === undefined) {
            console.warn(`UIWidgetsActionQueue: stopAnimation: Animation with id ${animId} does not exist !`)
            return;
        }
        console.log(`cosmin:stopanim: evrik2`)
        this.animStoppers[animId] = { // for now it will only stop cyclic-animation on next cycle, not a started one-cycle animation during animation-progress (TODO this can be done if I modify the Animation.js and put a terminating fanion along side the p===1 check)
            stopIt: true, // true means: "please, stop it as soon as possible"
            clbk: terminateClbk
        };
        console.log(`cosmin:stopanim: evrik3`)
    }

    async pushAction(widgetId, action, payload, clbk = (action, payload) => {console.log(`${action?"":""}${payload?"":""}`)}) {
        console.warn(`pushAction(${widgetId}, ${action}, ${payload})...`)

        if (this.renderFactory) {
            const widg = this.renderFactory.getUIWidget({id: widgetId})
            if (widg) {
                console.warn(`...consuming the action right now`)
                //if (await this.__consumeAction(widg, action, payload, widgetId)) {
                this.__consumeAction(widg, action, payload, widgetId).then(succeeded => {
                    console.error(`cosmin:suntem:stopanim: action COMPLETE for widget ${widgetId}, payload: ${JSON.stringify(payload)}`)
                    if (succeeded) {
                        clbk(action, payload);
                    }
                    this.__notifyNoAction(action)
                });
                //}
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
            if (act.action.toLowerCase() === action.toLowerCase()) {
                count ++
            }
        }
        return count;
    }

    __noMoreActions(action) {
        console.error(`cosmin:suntem:stopanim:${JSON.stringify(this.currentPendingActions)}`)
        console.error(`cosmin:suntem:stopanim: no-actions?: ${!this.actionsPendingCount(action) && (!this.currentPendingActions[action] || (this.currentPendingActions[action] && Object.values(this.currentPendingActions[action]).filter(e => e > 0).length <= 0))}`)
        return !this.actionsPendingCount(action) && (!this.currentPendingActions[action] || (this.currentPendingActions[action] && Object.values(this.currentPendingActions[action]).filter(e => e > 0).length <= 0));
    }

    registerNoMoreActionsListener(action, clbk = () => {}) {
        // if already no more actions, we call the clbk right now...
        if (!this.__noMoreActions(action)) {
            clbk()
            return
        }
        // otherwise we register the listener for later use...
        this.noActionsNotifsPending[action] = this.noActionsNotifsPending[action] ? this.noActionsNotifsPending[action] : []
        this.noActionsNotifsPending[action].push(clbk)
    }

    async __consumeAction(widget, action, payload, widgetId = -1) {

        const createAnimation = (animFactory, event) => {

            const getAnimationMixedRot = (fromRot, toRot, p) => {
                var f = (1 - p);
                var mixed = fromRot + (toRot - fromRot) * f;
                return mixed;
            }
            const getAnimationMixedScale = (fromScale, toScale, p) => {
                var f = (1 - p);
                var sx = fromScale.sx + (toScale.sx - fromScale.sx) * f;
                var sy = fromScale.sy + (toScale.sy - fromScale.sy) * f;
                return {sx,sy};
            }

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
            var fromRot = event.from.rot
            var toRot = event.to.rot
            var fromScale = event.from.scale
            var toScale = event.to.scale

            var me = animFactory;
            anim.onRender(p => {
                if (widget) {
                    try {
                        if (fromStyle && toStyle) {
                            //console.error(`\n*********************fromStyle: ${JSON.stringify(fromStyle)}; toStyle: ${JSON.stringify(toStyle)}\n******************************`)
                            var mixedStyle = me.getAnimationMixedStyle(fromStyle, toStyle, p);
                            widget.setAnimatedStyle(mixedStyle);
                        }

                        
                        if (toPos !== undefined && fromPos !== undefined) {
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
                        
                        if (toRot !== undefined && fromRot !== undefined) {
                            var mixedRot = getAnimationMixedRot(fromRot, toRot, 1 - p)
                            widget.setAnimatedRot(mixedRot)

                            DIProvider.tempModelContext().update(widgetId, {rotAngDegrees: mixedRot})
                        }
                        
                        if (toScale !== undefined && fromScale !== undefined) {
                            var mixedScale = getAnimationMixedScale(fromScale, toScale, 1 - p)
                            widget.setAnimatedScale(mixedScale.sx, mixedScale.sy)

                            DIProvider.tempModelContext().update(widgetId, {sx: mixedScale.sx, sy: mixedScale.sy})
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
            this.currentPendingActions[action][widgetId] = this.currentPendingActions[action][widgetId] !== undefined ? this.currentPendingActions[action][widgetId] + 1 : 1;

            if (action.toLowerCase() === "translate" || action.toLowerCase() === "rotate" || action.toLowerCase() === "scale") {
                widget.postTransform(payload);
                this.currentPendingActions[action][widgetId] --;
                resolve(true)
            }
            else if (action.toLowerCase() === "animate") {

                if (payload.animId !== undefined && this.animStoppers[payload.animId] !== undefined) {
                    console.warn(`You assigned the same animation id ${payload.animId} to this current animation ${JSON.stringify(payload)}; All animations with this same id will be stopped on the same call, maybe you did this intentionally...!`)
                }
                else if (payload.animId !== undefined) {
                    this.animStoppers[payload.animId] = {
                        stopIt: false
                    }
                }
                if (payload.cyclic) {
                    console.warn(`cosmin:suntem:stopanim: decrementing cyclic anim (no no-action hang) for widget id ${widgetId}, payload: ${JSON.stringify(payload)}`)
                    this.currentPendingActions[action][widgetId] --; // eliminating the counter because this animation will never end by itself, it will be ended explicit, and if so, you can do your logic at that time in JS-script
                }
                else {
                    console.warn(`cosmin:suntem:stopanim: non-cyclic anim for widget id ${widgetId}: ${JSON.stringify(payload)}`)
                }

                let iparams = true;

                const doAnimate = (invertParams = false) => {
                    const animEvent = {
                        duration: payload.durationMs,
                        delay: payload.delayMs,
                        from: {
                            style: payload.styleFrom,
                            pos: payload.posFrom,
                            rot: payload.rotDegFrom,
                            scale: payload.scaleFrom
                        },
                        to: {
                            style: payload.styleTo,
                            pos: payload.posTo,
                            rot: payload.rotDegTo,
                            scale: payload.scaleTo
                        },
                        posOffset: payload.posOffset
                    }
                    if (invertParams) {
                        const to = animEvent.to;
                        animEvent.to = animEvent.from;
                        animEvent.from = to;
                    }
        
                    var animFactory = new Animation();
                    //var anim = animFactory.createWidgetAnimation(widget, animEvent);
                    var anim = createAnimation(animFactory, animEvent);
        
                    anim.run()
                    console.error(`anim.run-----`)
                    //anim.onEnd(lang.hitch(this, "onAnimationEnded", e.id));
                    anim.onEnd(() => {
                        if (!payload.cyclic) {
                            console.error(`cosmin:suntem:stopanim: action COMPLETE(2) for widget ${widgetId}`)
                        }

                        if (!payload.cyclic) {
                            this.currentPendingActions[action][widgetId] --;
                            resolve(true)
                        }
                        else {
                            if (!(payload.animId !== undefined && this.animStoppers[payload.animId] && this.animStoppers[payload.animId].stopIt)) {
                                doAnimate(iparams)
                                iparams = !iparams;
                            }
                            else {
                                console.log(`cosmin:stopanim: stopped animation for ${payload.animId}`)
                                if (payload.animId !== undefined && this.animStoppers[payload.animId]) {
                                    this.animStoppers[payload.animId].clbk(payload.animId)
                                    delete this.animStoppers[payload.animId];
                                    console.log(`cosmin:stopanim: deleted stopper for ${payload.animId}`)
                                }
                                this.currentPendingActions[action][widgetId] --;
                                resolve(true)
                            }
                        }
                    })
                }
                doAnimate()
            }
            else {
                console.warn(`widget action '${action}' (with payload "${JSON.stringify(payload)}") for widget id ${widgetId} is unknown and it was ignored...`);
                this.currentPendingActions[action][widgetId] --
                resolve(false)
            }
        });
    }

    __notifyNoAction(action) {
        if (this.noActionsNotifsPending[action]) {
            //if (!this.actionsPendingCount(action)) {
            if (this.__noMoreActions(action)) {
                console.warn(`NOTIFYING no-action...`)
                for (let noaClbk of this.noActionsNotifsPending[action]) {
                    noaClbk()
                }
                this.noActionsNotifsPending[action] = []
            }
        }
        else {
            console.warn(`cosmin: suntem: no no-more-action listeners registered for action ${action}; whoel struct here: ${JSON.stringify(this.noActionsNotifsPending)}`)
        }
    }

    async consumeActions(widgetId, widget, doneClbk = () => {}, beforeClbk = () => {}) {
        
        beforeClbk()

        const scheduled = this.queue[widgetId];
        if (!scheduled) { doneClbk(); return }

        let iPs = []
        while (scheduled.length > 0) {
            const sched = scheduled.shift(); // pop-first
            const action = sched.action;
            const payload = sched.payload;
            const clbk = sched.clbk;
            // if (await this.__consumeAction(widget, action, payload, widgetId)) {
            //     clbk(action, payload);
            // }
            // this.__notifyNoAction(action)
            const p = this.__consumeAction(widget, action, payload, widgetId)
            iPs.push(p)
            p.then((succeeded) => {
                console.error(`cosmin:suntem:stopanim: action COMPLETE for widget ${widgetId}, payload: ${JSON.stringify(payload)}`)
                !succeeded ? console.error(`error trying to execute previous action`) : {}
                if (succeeded) {
                    clbk(action, payload);
                }
                this.__notifyNoAction(action)
            })
        }

        Promise.all(iPs).then(dummy => {
            console.log(dummy ? "" : "")
            doneClbk(); // it may never run if cyclic animations are activated in this actions-pack; these animations should be stopable with a certain id and a stop method in this class; when stopped, this function will be called automatically
        })
    }
}