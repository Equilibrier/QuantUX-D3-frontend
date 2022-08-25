import on from 'dojo/on'
import win from 'dojo/win'
//import lang from 'dojo/_base/lang'

export class KeyboardInputHandler {

    constructor() {
        on(win.body(), "keydown", (e) => this.__onKeyPressOrUp("press")(e));
        on(win.body(), "keyup", (e) => this.__onKeyPressOrUp("up")(e));

        this._kpListeners = {};
        this._kuListeners = {};
    }

    resetListeners(preset="all") {
        delete this._kpListeners[preset];
        delete this._kuListeners[preset];
    }

    listenForKeyPress(keys, clbk, preset="all") { // the keys in ascii, separated by comma, e.g. "shift,x"; clbk takes one single arg, the js keyboard event
        this.__listenFor(keys, clbk, "press", preset);
    }
    listenForKeyUp(keys, clbk, preset="all") { // the keys in ascii, separated by comma, e.g. "shift,x"; clbk takes one single arg, the js keyboard event

        this.__listenFor(keys, clbk, "up", preset);
    }


    ///////////////////////////////////////////////////////////////

    __listenFor(keys, clbk, keyPressOrUp = "press", preset) {
        const lfield = keyPressOrUp.toLowerCase() === "press" ? "_kpListeners" : "_kuListeners";

        const km = keys.toLowerCase();
        this[lfield][preset] = this[lfield][preset] === undefined ? {} : this[lfield][preset];
        this[lfield][preset][km] = this[lfield][preset][km] === undefined ? [] : this[lfield][preset][km]; // TODO, to parse the 'keys', and order the tokens in ext|normal keys + alphabehical-ascending order, to see if it is already in there...
        this[lfield][preset][km].push(clbk);
    }
    
    __onKeyPressOrUp(keyPressOrUp) {

        return (e) => {
            //console.error(`key detected****: shift: ${e.shiftKey} - key: ${e.keyCode ? e.keyCode : e.which} - data: ${String.fromCharCode(e.keyCode ? e.keyCode : e.which)}`);

            const lfield = keyPressOrUp.toLowerCase() === "press" ? "_kpListeners" : "_kuListeners";
            var k = e.keyCode ? e.keyCode : e.which;
            // var target = e.target;
            // var isMeta = e.altKey || e.ctrlKey || e.metaKey;
            // var isCntrl = e.ctrlKey || e.metaKey;
            // var isShift = e.shiftKey

            for (let lc of Object.values(this[lfield])) {
                for (let l in lc) {
                    const tokens = l.toLowerCase().replaceAll(' ', '').split(',');

                    if (tokens.find(e => e === "ctrl") && !e.ctrlKey) {
                        continue
                    }
                    if (tokens.find(e => e === "alt") && !e.altKey) {
                        continue
                    }
                    if (tokens.find(e => e === "meta") && !e.metaKey) {
                        continue
                    }
                    if (tokens.find(e => e === "shift") && !e.shiftKey) {
                        continue
                    }
                    
                    const pkey = tokens.find(e => e !== "ctrl" && e !== "alt" && e !== "meta" && e !== "shift")
                    if (pkey && String.fromCharCode(k).toLowerCase() !== pkey) {
                        continue
                    }
                    
                    for (let clbk of lc[l]) {
                        clbk(e);
                    }
                }
            }
        }
    }

}

//export default new KeyboardInputHandler();