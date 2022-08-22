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
               await this.runScript(widget.props.script, widget)
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

        console.error(`sourceData: ${databind}; oldval: ${oldVal}; newVal: ${newVal}`)

        this.dataBindingValues.__sourceData = databind;
        this.dataBindingValues.__sourceOldValue = oldVal;
        this.dataBindingValues.__sourceNewValue = newVal;

        const widgets = DIProvider.elementsLookup().dataBindingScriptWidgets();
        for (let i=0; i< widgets.length; i++) {
            const widget = widgets[i]
            if (widget.props.script) {
                console.log(`databind run script for ${databind}=${newVal}`)
                
                /*const rresult = await this.justRunScript(widget.props.script)
                this.applyApiDeltas(rresult)
                this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)*/
                await this.runScript(widget.props.script, null, null)
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
        const elk = DIProvider.elementsLookup();
        this.dataBindingValues.__sourceScreen = !elk.isScreen(orginalLine.from) ? elk.screenOf(orginalLine.from)?.name : elk.getObjectFromId(orginalLine.from)?.name;
        this.dataBindingValues.__sourceElement = !elk.isScreen(orginalLine.from) ? elk.getObjectFromId(orginalLine.from)?.name : undefined;
        //console.error(`Set prevScreen to ${this.dataBindingValues.__sourceScreen} && previousElement to ${this.dataBindingValues.__sourceElement}`)

        let widget = this.model.widgets[widgetID]
        if (widget && widget.props.script) {
            const result = await this.runScript(widget.props.script, widget, orginalLine)
            // for user triggers scripts, we must ensure that we call
            // also all the data scripts
            //await this.executeDataScripts()
            return result
        } else {
            this.logger.error("executeScript","exit > could not find " + widgetID);
        }
    },

    async _prefetchGlobalJS() {

        console.log(`_prefetchGlobalJS,...`)

        if (!DIProvider.globalCache().globalJSPrefetched()) {
            console.log(`not retrieved, retrieving now...`)
            let outp = "";
            const noCacheOptions = () => {
                var myHeaders = new Headers();
                myHeaders.append('pragma', 'no-cache');
                myHeaders.append('cache-control', 'no-cache');
                myHeaders.append('Content-Type', 'text/javascript');
                var myInit = {
                    method: 'GET',
                    headers: myHeaders,
                };
                return myInit;
            }

            let canvas = DIProvider.canvas();
            if (canvas === null) {
                console.error("ScriptMixing: _prefetchGlobalJS: Canvas was not set yet in the DI-provider, but it is needed here.");
                return "";
            }
            for (let url of Object.keys(canvas.settings.globalScriptUrlsEnabled)) {
                const enabled = canvas.settings.globalScriptUrlsEnabled[url];
                if (enabled) {
                    //let jsgCode = await (await fetch(url, noCacheOptions())).text();
                    const resp = await fetch(url, noCacheOptions());
                    const jsgCode = await resp.text()
                    console.log(`response: ${JSON.stringify(resp)}`)
                    outp += jsgCode + "\n";
                }
            }
            console.log(`prefetched, setting in DI: ${outp}`)
            DIProvider.globalCache().setGlobalJSScript(outp)
        }
        return DIProvider.globalCache().globalJSScript();
    },

    retrieveTargetScreen(scriptResult) {
        return Object.values(this.model.screens).find(s => scriptResult?.to !== undefined && s.name.toLowerCase() === scriptResult?.to?.toLowerCase())
    },

    async justRunScript(script) {
        let glbJS = await this._prefetchGlobalJS();
        /*const engine = new ScriptEngine()
        //console.log("Running script: \n", script);
        
        console.log(`TRACE-justRunScript: `)
        console.trace()

        let result = await engine.run(glbJS + script, this.model, this.dataBindingValues, this.renderFactory)*/
        const result = await DIProvider.jsRunController().scheduleRun(glbJS + script, this.model, this.dataBindingValues, this.renderFactory)
        return result
    },

    async runScript (script, widget, orginalLine) {
        this.logger.log(-2,"runScript","enter", widget?.name);

        return new Promise(async (resolve) => {

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
                    this.dataBindingValues.__sourceScreen = ts.name;
                    const rresult = await this.justRunScript(script)
                    this.applyApiDeltas(rresult)
                    this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)
                    console.log(`ran-script vmodel--: ${JSON.stringify(result.viewModel.pagesnapshot?.cnt[1])}`)
                }
            }

            const result = await this.justRunScript(script)

            if (result.status === 'ok' && result.ignore === undefined) {
                requestAnimationFrame( async () => {

                    this.applyApiDeltas(result)
                    this.rerenderWidgetsFromDataBindingAndUpdateViewModel(result)

                    if (!result.loop) {
                        this.tryRenderScriptedScreenTransition(result, widget, orginalLine)
                        
                        /*// running it just for screen-build (if necessary, if the JS needs it, it doesn't hurt to have another chance to update some bindings, programatically)
                        const ts = this.retrieveTargetScreen(result)
                        if (ts) { // only if a transition is present
                            this.dataBindingValues.__sourceElement = null;
                            this.dataBindingValues.__sourceScreen = ts.name;
                            const rresult = await runScript() // it will run async, but I don't care, it's ok, this function doesn't need to be waited for end-call
                            this.applyApiDeltas(rresult)
                            this.rerenderWidgetsFromDataBindingAndUpdateViewModel(rresult)
                        }*/
                        
                        this.logger.log(-1,"runScript","exit");
                    }
                    
                    let targetScreen = this.retrieveTargetScreen(result)

                    //console.error(`targetScreen: ${JSON.stringify(targetScreen)}; \n\tresult: ${JSON.stringify(result)}`)


                    if (targetScreen && result.delayedBackMs !== undefined) {
                        setTimeout(() => {
                            this.onTransitionBack(targetScreen.id, null, null);
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

                        this.dataBindingValues.loopScreen = result.to !== undefined ? result.to : this.dataBindingValues.__sourceScreen;

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

                    else if (targetScreen === undefined && result.to !== undefined) {
                        console.error(`<>script's target screen was not found for screen-name ${result.to}`);
                        resolve(result)
                    }

                    resolve(result)
                })
            } else {
                if (result.ignore) {
                    console.log(`run-script result (transition.to/loop) IGNORED`)
                }
                resolve(result)
            }
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
                this.renderTransition(tempLine,this.currentScreen.id);
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