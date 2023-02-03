<template>
  <div>
  </div>
</template>
<script>
//import ScriptEngine from '../../core/engines/ScriptEngine'
import * as ScriptToModel from '../../core/engines/ScriptToModel'

import DIProvider from '../../core/di/DIProvider'

export default {
  name: 'ScriptMixin',
  methods: {

    __resetSourceMetadata() {
        this.dataBindingValues.__sourceScreen = undefined;
        this.dataBindingValues.__sourceElement = undefined;
        this.dataBindingValues.__sourceLooping = false;
        this.dataBindingValues.__sourceData = undefined;
        this.dataBindingValues.__sourceOldValue = undefined;
        this.dataBindingValues.__sourceNewValue = undefined;
    },

    async initLoadScripts () {
        this.logger.log(-2,"initLoadScripts","enter >" );
        if (this.doNotExecuteScripts) {
            return
        }
        this.__resetSourceMetadata();

        const widgets = DIProvider.elementsLookup().loadScriptWidgets()
        for (let i=0; i< widgets.length; i++) {
            const widget = widgets[i]

            if (widget.props.script) {
                await DIProvider.waitWhileMvvmRunning()
                const isMvvmProj_ = await DIProvider.isMvvmProject()
                if (isMvvmProj_) {
                    DIProvider.emitMvvmStartedExecuting()
                }
                await this.runScript(widget.props.script, widget)
                if (isMvvmProj_) {
                    DIProvider.emitMvvmStoppedExecuting()
                }
            }
        }
        this.logger.log(2,"initLoadScripts","exit" );
    },

    async executeDataScripts (databind, oldVal, newVal) {
        this.logger.log(-2,"executeDataScripts","enter >" );
        if (this.doNotExecuteScripts) {
            return
        }
        this.__resetSourceMetadata();

        this.dataBindingValues.__sourceData = databind;
        this.dataBindingValues.__sourceOldValue = oldVal;
        this.dataBindingValues.__sourceNewValue = newVal;

        const widgets = DIProvider.elementsLookup().dataBindingScriptWidgets();
        for (let i=0; i< widgets.length; i++) {
            const widget = widgets[i]
            if (widget.props.script) {
                console.log(`databind run script for ${databind}=${JSON.stringify(newVal)}`)
                
                /*const rresult = await this.justRunScript(widget.props.script)
                this.applyApiDeltas(rresult)
                this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)*/

                await DIProvider.waitWhileMvvmRunning()
                const isMvvmProj_ = await DIProvider.isMvvmProject()
                if (isMvvmProj_) {
                    DIProvider.emitMvvmStartedExecuting()
                }
                await this.runScript(widget.props.script, null, null)
                if (isMvvmProj_) {
                    DIProvider.emitMvvmStoppedExecuting()
                }
            }
        }
        this.logger.log(-2,"executeDataScripts","exit");
    },

    async executeScript (widgetID, orginalLine) {
        this.logger.log(-2,"executeScript","enter >" + widgetID);

        if (this.doNotExecuteScripts) {
            return
        }

        this.__resetSourceMetadata();
        
        this.dataBindingValues.__sourceScreen = DIProvider.transitionsNotifier().lastClickSourceScreen()
        console.log(`lastScreen: ${JSON.stringify(DIProvider.transitionsNotifier().lastClickSourceScreen())}`)
        // this.dataBindingValues.__sourceElement = DIProvider.transitionsNotifier().lastClickWidget()

        const wid = DIProvider.transitionsNotifier().lastClickWidget().id
        const seObj = DIProvider.elementsLookup().getObjectFromId(wid)
        const parent = DIProvider.elementsLookup().groupOf(wid)
        console.error(`se: ${JSON.stringify(seObj)}; parent: ${JSON.stringify(parent)}`)

        this.dataBindingValues.__sourceElement = {name: parent ? parent.name : seObj.name, id: parent ? parent.id : seObj.id}

        let widget = this.model.widgets[widgetID]

        if (widget && widget.props.script) {
            await DIProvider.waitWhileMvvmRunning()
            const isMvvmProj_ = await DIProvider.isMvvmProject()
            if (isMvvmProj_) {
                DIProvider.emitMvvmStartedExecuting()
            }
            const result = await this.runScript(`${widget.props.script}`, widget, orginalLine)
            if (isMvvmProj_) {
                DIProvider.emitMvvmStoppedExecuting()
            }
            console.log(`rezultat executeScript TO: '${JSON.stringify(result?.to)}'`)

            // for user triggers scripts, we must ensure that we call
            // also all the data scripts
            //await this.executeDataScripts()
            return result
        } else {
            this.logger.error("executeScript","exit > could not find " + widgetID);
        }
    },

    retrieveTargetScreen(scriptResult) {
        return Object.values(this.model.screens).find(s => scriptResult?.to !== undefined && s.name.toLowerCase() === scriptResult?.to?.toLowerCase())
    },

    async justRunScript(script) {
        const glbJS = await DIProvider.mvvmRuntimeCodeRetriever().cachedCode();
        const result = await DIProvider.jsRunController().scheduleRun(glbJS + script, this.model, this.dataBindingValues, this.renderFactory)
        return result
    },

    async handleScriptResult(result, resolve = () => {}) {

        const stopLoop = async (result, sched) => {
            console.error(`ANIMATIONS complete: proceeding with OUT-LOOP screen transition to ${result.to}`)

            // DIProvider.asyncScheduler().unschedule(sched1)
            DIProvider.asyncScheduler().unschedule(sched)
            // running default transition logic...
            // console.warn(`cosmin:tryRenderScriptedScreenTransition: to ${result.to}, previousScreen: ${this.dataBindingValues.__sourceScreen}`)
            this.tryRenderScriptedScreenTransition(result, null, orginalLine)

            // running it just for screen-build (if necessary, if the JS needs it, it doesn't hurt to have another chance to update some bindings, programatically)
            const ts = this.retrieveTargetScreen(result)
            if (ts) { // only if a transition is present
                this.dataBindingValues.__sourceElement = null;
                this.dataBindingValues.__sourceScreen = ts;
                const rresult = await this.justRunScript(script)
                this.applyApiDeltas(rresult)
                this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)
                console.log(`ran-script vmodel--: ${JSON.stringify(result.viewModel.pagesnapshot?.cnt[1])}`)
            }
        }

        if (result.refreshNeed) {
            console.log('triggering refresh on current QUX screen...')
            this.applyApiDeltas(result)
            this.rerenderWidgetsFromDataBindingAndUpdateViewModel(result)
        }

        if (result.status === 'ok' && !result.nothingToProcess) {
            requestAnimationFrame( async () => {

                this.applyApiDeltas(result)
                this.rerenderWidgetsFromDataBindingAndUpdateViewModel(result)

                if (!result.loop) {

                    if (widget !== null || orginalLine !== null) {
                        this.tryRenderScriptedScreenTransition(result, widget, orginalLine)
                    
                    
                        /*// running it just for screen-build (if necessary, if the JS needs it, it doesn't hurt to have another chance to update some bindings, programatically)
                        const ts = this.retrieveTargetScreen(result)
                        if (ts) { // only if a transition is present
                            this.dataBindingValues.__sourceElement = null;
                            this.dataBindingValues.__sourceScreen = ts;
                            const rresult = await runScript() // it will run async, but I don't care, it's ok, this function doesn't need to be waited for end-call
                            this.applyApiDeltas(rresult)
                            this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)
                        }*/
                        
                        this.logger.log(-1,"runScript","exit");
                    }
                }
                
                let targetScreen = this.retrieveTargetScreen(result)

                //console.error(`targetScreen: ${JSON.stringify(targetScreen)}; \n\tresult: ${JSON.stringify(result)}`)

                if (!targetScreen && result.delayMs !== undefined) {

                    console.log(`Will wait ${result.delayMs/1000.0} seconds and then consume the next MVVM UI command`)

                    setTimeout(async() => {

                        resolve(await this.runScript("\
                            return MVVM_CONTROLLER.Compute();\
                        ", null, null)) // @TODO oare trebuie sa mai pun inca o data, acelasi widget si orginaline sau mai bine NULL,NULL ca sa omita tranzitiile specifice QUX?!...

                    }, result.delayMs)
                }

                // TODO: ramura asta NU cred ca se mai foloseste
                else if (targetScreen && result.delayedBackMs !== undefined) {
                    setTimeout(async () => {
                        if (!result.runCode) {
                            this.onTransitionBack(targetScreen.id, null, null);
                        }
                        else {
                            this.__resetSourceMetadata();
                            this.dataBindingValues.__sourceScreen = targetScreen;
                            
                            const rrresult = await this.justRunScript(result.runCode)
                            this.applyApiDeltas(rrresult)
                            this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rrresult)
                            this.tryRenderScriptedScreenTransition(rrresult, null, null)
                        }
                        resolve(result)
                    }, result.delayedBackMs);
                }

                else if (result.loop !== undefined) {

                    this.dataBindingValues.__sourceElement = null;
                    this.dataBindingValues.__sourceLooping = true;

                    const endConditionReached = (result, dbind) => { return result.viewModel[dbind] }//this.dataBindingValues[dbind]
                    const endLoopDataBinding = result.loop
                    if (this.dataBindingValues[endLoopDataBinding] === undefined) {
                        this.dataBindingValues[endLoopDataBinding] = false
                    }
                    // let sched1;
                    let sched2;

                    this.dataBindingValues.loopScreen = result.to !== undefined ? result.to : this.dataBindingValues.__sourceScreen.name;

                    const doLoopbackScriptRun = async () => {
                        const rresult = await this.justRunScript(script)

                        const ttargetScreen = this.retrieveTargetScreen(rresult)
                        //console.error(`dataBindingValues: ${JSON.stringify(this.dataBindingValues)}`)
                        //console.error(`viewmodel: ${JSON.stringify(rresult.viewModel)}`)

                        // console.log(`DATABINDING  : anca: ${this.dataBindingValues.pagesnapshot.cnt[2].label}; cosmin: ${this.dataBindingValues.pagesnapshot.cnt[3].label}; phase: ${this.dataBindingValues.phase}`)
                        // console.log(`DATABINDING-r: anca: ${rresult.viewModel.pagesnapshot.cnt[2].label}; cosmin: ${rresult.viewModel.pagesnapshot.cnt[3].label}; phase: ${rresult.viewModel.phase}`)

                        if (!((ttargetScreen && rresult.immediateTransition) || endConditionReached(rresult, endLoopDataBinding))) {
                            //console.warn(`cosmin: no-skip: ${ttargetScreen.name}-${rresult.immediateTransition}-${endConditionReached(rresult, endLoopDataBinding)}`)
                            this.applyApiDeltas(rresult)
                        }
                        else {
                            console.warn(`skipping api-deltas&databinding-update`)
                        }
                        this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)

                        if (ttargetScreen || endConditionReached(rresult, endLoopDataBinding)) {

                            // if there is no transition (loop) to the same screen and end-loop condition was not reached
                            if (!(result.to !== undefined && this.dataBindingValues.loopScreen !== undefined && result.to.toLowerCase() === this.dataBindingValues.loopScreen.toLowerCase() && !endConditionReached(rresult, endLoopDataBinding))) {
                                
                                if ((ttargetScreen && rresult.immediateTransition) || endConditionReached(rresult, endLoopDataBinding)) {
                                    // console.warn(`cosmin:suntem:next-screen-loop -> immediatetransition`)
                                    await stopLoop(rresult, sched2)
                                    resolve(rresult)
                                }
                                else {
                                    DIProvider.uiWidgetsActionQueue().registerNoMoreActionsListener('animate', async () => {
                                        // console.warn(`cosmin:suntem:next-screen-loop -> nomoreactions`)
                                        await stopLoop(rresult, sched2)
                                        resolve(rresult)
                                    });
                                }
                            }

                        }
                    }

                    // sched1 = DIProvider.asyncScheduler().scheduleForAnimationStarted(async () => {
                    //     console.error(`^^^^^^^^^^^^^^^^^ animation event (started)`)
                    //     await doLoopbackScriptRun()
                    // }, true)
                    sched2 = DIProvider.asyncScheduler().scheduleForAnimationEnded(async () => {
                        console.error(`^^^^^^^^^^^^^^^^^ animation event (ended)`)
                        //await doLoopbackScriptRun()
                        doLoopbackScriptRun()
                    }, true)
                }

                else {
                    if (targetScreen === undefined && result.to !== undefined) {
                        console.error(`<>script's target screen was not found for screen-name ${result.to}`);
                    }
                    setTimeout(async () => { // incercam sa consumam urmatoarea comanda UI din MVVM, pana cand nu mai e niciuna de executat (nothingToProcess e true)
                        resolve(await this.runScript("return MVVM_CONTROLLER.Compute()", null, null)) // @TODO oare trebuie sa mai pun inca o data, acelasi widget si orginaline sau mai bine NULL,NULL ca sa omita tranzitiile specifice QUX?!...
                    }, 100)
                }

                //resolve(result)
            })
        } else {
            if (result.nothingToProcess) {
                console.log(`run-script result (transition.to/loop) IGNORED`)
            }
            resolve(result)
        }
    },

    async runScript (script, widget, orginalLine) {

        console.warn(`RUN-SCRIPT`)

        this.logger.log(-2,"runScript","enter", widget?.name);

        return new Promise(async (resolve) => {

            const q_ = DIProvider.mvvmInputsService().discardQueue()
            for (let inp of q_) {
                const r_ = await this.justRunScript(`return MVVM_CONTROLLER.EXT_INPUTS().notify(${JSON.stringify(inp)})`)
                this.applyApiDeltas(r_)
                this.rerenderWidgetsFromDataBindingAndUpdateViewModel(r_)
            }

            const result = await this.justRunScript(script)
            handleScriptResult(result, resolve)
        }) 
    },


    applyApiDeltas (result) {
        this.logger.log(2,"applyApiDeltas","enter >", result.appDeltas);
        if (result.appDeltas) {
            result.appDeltas.forEach(change => {
                ScriptToModel.applyChange(this.model, change, this.renderFactory, this.dataBindingValues)
            });
        }
    },


    rerenderWidgetsFromDataBindingAndUpdateViewModel (result) {
        this.logger.log(2,"rerenderWidgetsFromDataBinding","enter >", result.viewModel);
        if (result.viewModel) {
           this.updateWidgetFromDataBinding(result.viewModel)
        }
    },
    tryRenderScriptedScreenTransition (result, widget, orginalLine) {
        this.logger.log(2,"renderScriptResult","enter >" ,  orginalLine);
        if (result.to) {
            let targetScreen = this.retrieveTargetScreen(result)
            if (targetScreen) {
                const tempLine = this.createTempLine(targetScreen.id, orginalLine)
                this.logLine(tempLine, this.currentScreen.id);
                this.renderTransition(tempLine,this.currentScreen.id);
            } else {
                this.logger.log(1,"runScript","No screen with name  >" + result.to);
                result.console.push({
                    type: 'error',
                    args: `Simulator: No screen with name '${result.to}'`
                })
            }
        } else if (widget) {
            const lines = this.getLinesForWidget(widget);
            if (lines && lines.length === 1) {
                const tempLine = this.createTempLine(lines[0].to, orginalLine)
                this.logLine(tempLine, this.currentScreen.id);
                this.renderTransition(tempLine,this.currentScreen.id, widget.id);
            }
        }
    },

    createTempLine (to, orginalLine) {
        const result =  {
            to: to
        }
        if (orginalLine) {
            result.animation = orginalLine.animation
            result.duration = orginalLine.duration
            result.easing = orginalLine.easing
            result.from = orginalLine.from
        }
        return result
    }

  }


}
</script>