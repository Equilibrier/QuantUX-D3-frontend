<template>
  <div>
  </div>
</template>
<script>
import ScriptEngine from '../../core/engines/ScriptEngine'
import * as ScriptToModel from '../../core/engines/ScriptToModel'

import DIProvider from '../../core/di/DIProvider'

export default {
  name: 'ScriptMixin',
  methods: {

    __resetSourceMetadata() {
        this.dataBindingValues.__sourceScreen = undefined;
        this.dataBindingValues.__sourceElement = undefined;
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
        this.dataBindingValues.__sourceData = databind;
        this.dataBindingValues.__sourceOldValue = oldVal;
        this.dataBindingValues.__sourceNewValue = newVal;

        const widgets = DIProvider.elementsLookup().dataBindingScriptWidgets();
        for (let i=0; i< widgets.length; i++) {
            const widget = widgets[i]
            if (widget.props.script) {
                await this.runScript(widget.props.script, widget)
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
        this.dataBindingValues.__sourceScreen = DIProvider.elementsLookup().screenOf(orginalLine.from)?.name;
        this.dataBindingValues.__sourceElement = DIProvider.elementsLookup().getObjectFromId(orginalLine.from)?.name;

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
        const noCacheOptions = () => {
            var myHeaders = new Headers();
            myHeaders.append('pragma', 'no-cache');
            myHeaders.append('cache-control', 'no-cache');
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
        let outp = "";
        for (let url of Object.keys(canvas.settings.globalScriptUrlsEnabled)) {
            const enabled = canvas.settings.globalScriptUrlsEnabled[url];
            if (enabled) {
                let jsgCode = await (await fetch(url, noCacheOptions())).text();
                outp += jsgCode + "\n";
            }
        }
        return outp;
    },

    async runScript (script, widget, orginalLine) {
        this.logger.log(-2,"runScript","enter", widget?.name);

        return new Promise(async(resolve) => {
            const engine = new ScriptEngine()
            let glbJS = await this._prefetchGlobalJS();

            //console.log("Running script: \n", script);
            let result = await engine.run(glbJS + script, this.model, this.dataBindingValues).then()
    
            if (result.status === 'ok') {     
                requestAnimationFrame( () => {
                    this.renderAppChanges(result)
                    this.renderScriptDataBinding(result)  
                    this.renderScriptTo(result, widget, orginalLine)
                    this.logger.log(-1,"runScript","exit");

                    let targetScreen = Object.values(this.model.screens).find(s => s.name === result.to)
                    if (targetScreen && result.delayedBackMs !== undefined) {
                        setTimeout(() => {
                            this.onTransitionBack(targetScreen.id, null, null);
                        }, result.delayedBackMs);
                    }
                    else if (targetScreen === undefined && result.to !== undefined) {
                        console.error(`<>script's target screen was not found for screen-name ${result.to}`);
                    }
                    //console.error(`TO: ${result.to}`);

                    resolve(result)
                })
            } else {
                resolve(result)
            }
        }) 
    },
    renderAppChanges (result) {
        this.logger.log(2,"renderAppChanges","enter >", result.appDeltas);
        if (result.appDeltas) {
            result.appDeltas.forEach(change => {
                ScriptToModel.applyChange(this.model, change, this.renderFactory)
            });
        }
    },
    


    renderScriptDataBinding (result) {
        this.logger.log(2,"renderScriptDataBinding","enter >", result.viewModel);
        if (result.viewModel) {
           this.replaceDataBinding(result.viewModel)
        }
    },
    renderScriptTo (result, widget, orginalLine) {
        this.logger.log(2,"renderScriptResult","enter >" ,  orginalLine);
        if (result.to) {
            let targetScreen = Object.values(this.model.screens).find(s => s.name === result.to)
            if (targetScreen) {
                const tempLine = this.createTempLine(targetScreen.id, orginalLine)
                console.error(`cscreen: '${this.currentScreen}'`)
                console.error(this)
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