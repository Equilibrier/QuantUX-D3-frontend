import DIProvider from './DIProvider'

export class TransitionsNotifier {

    constructor() {
        this.evStack_ = []
        this.transitionsStack_ = []
    }

    __private = () => ({
        lastOnStack: () => this.evStack_.length > 0 ? this.evStack_[this.evStack_.length - 1] : undefined,
        equalsOnStack: (e1, e2) => e1?.source_screen_id === e2?.source_screen_id && e1?.destination_screen_id === e2?.destination_screen_id && e1?.source_widget_id === e2?.source_widget_id,
        compileTransitions: (sid, sname, did, dname, wid, wname) => {
            const idIsWidget_ = (id) => id?.toLowerCase()?.startsWith("w")
            const insertPlain_ = (ssid=sid, ssname=sname, dsid=did, dsname=dname, wgid=wid, wgname=wname) => {
                const newEl = {
                    from: {
                        id: ssid,
                        name: ssname,
                        type: idIsWidget_(ssid) ? "rest/js" : "screen"
                    },
                    from_widget: {
                        id: wgid,
                        name: wgname,
                    },
                    to: {
                        id: dsid,
                        name: dsname,
                        type: idIsWidget_(dsid) ? "rest/js" : "screen"
                    },
                    transition: idIsWidget_(ssid) ? "auto" : "by-click" // tranzitie automata de la widget rest/js-script sau implicit, click pe un widget obisnuit
                }
                if (newEl.from_widget.id === null || newEl.from_widget.id === undefined) {
                    if (newEl.from.type === "screen" && newEl.to.type === "screen") {
                        newEl.transition = "by-time" // tranzitie automata dupa un delay
                    }
                }
                this.transitionsStack_.push(newEl)
            }

            if (this.evStack_.length <= 0) {
                insertPlain_()
                return
            }

            const lastEv_ = this.evStack_[this.evStack_.length - 1]
            if (lastEv_.destination_screen_id === sid) { // -1- cazul normal, ecranul destinatie precedent e tot una cu ecranul curent sursa
                insertPlain_()
                return
            }

            // -2- caz special 1, evenimentul curent si evenimentul precedent au acelasi ecran + widget sursa, dar la primul destinatia e un widget, iar la cel curent destinatia e un ecran (inseamna ca intre ele e cel putin un element rest/js-script)
            if (lastEv_.source_screen_id === sid && lastEv_.source_widget_id === wid && idIsWidget_(lastEv_.destination_screen_id) && !idIsWidget_(did)) {
                insertPlain_(lastEv_.destination_screen_id, null, did, dname, null, null)
                return
            }

            // -3- caz special 2, intre evenimentul precedent si cel curent e o intrerupere, destinatia precedenta nu e totuna cu sursa curenta, deci intre ele trebuie inserat un widget rest/js-script simbolic
            insertPlain_(lastEv_.destination_screen_id, null, sid, sname, null, null)
            insertPlain_()

            // @TODO vazut daca cu timpul mai detectez si alte situatii speciale

            // stiva de tranzitii rezultata de aici nu concorda mereu cu realitatea (de ex tranzitia in SmartBasket de la HACK-screen-ro la HACK2-screen care se facea via un widget rest dar aici apare ca o tranzitie cu delay ("by-time")), dar nu din cauza logicii de aici ci pentru ca evenimentele de tranzitie (this.evStack_) nu sunt concludent primite de la QUX, insa chiar daca vor lipsi unele componente widget rest/js-script si raman, astfel, anonime, totusi ecranele vor aparea in ordinea corecta si poate ca e suficient pentru MVVM, pentru care am dezvoltat acest modul
        },
        _transitionOf: (idx) => { return idx < 0 || idx >= this.transitionsStack_.length ? null : this.transitionsStack_[idx] },
        _transitionCount: () => { return this.transitionsStack_.length },
        _isClick: (idx) => {
            const t = this.__private()._transitionOf(idx)
            return t.from_widget && t.from_widget.id && t.from_widget.name
        }
    })

    notifyTransition(fromScreenId, toScreenId, widgetId) {

        if (this.__private().equalsOnStack(this.__private().lastOnStack(), {source_screen_id: fromScreenId, destination_screen_id: toScreenId, source_widget_id: widgetId})) {
            return // same transition twice, most probably Simulator.vue->onTransition got kicked up before, and now a renderTransition (I'm leaving the onTransition to call this, because when a widget goes to a JS-script/Rest widget, the renderTransition will not be called again, so it's up to onTransition to catch this event; but in some cases, like in here, both onTransition and renderTransition are sending the same data in here, so this is why this check is needed...); a console.trace() at previous call and a console.trace() in here could confirm what it is written in this comment
        }

        const elk = DIProvider.elementsLookup();
        const dstS = !elk.isScreen(toScreenId) ? elk.screenOf(toScreenId)?.name : elk.getObjectFromId(toScreenId)?.name
        const se = elk.getObjectFromId(widgetId)?.name

        const srcS = !elk.isScreen(fromScreenId) ? elk.screenOf(fromScreenId)?.name : elk.getObjectFromId(fromScreenId)?.name

        // console.log(`old stack: ${JSON.stringify(this.evStack_)}`)
        
        const newEl = {
            source_screen_id: fromScreenId,
            destination_screen_id: toScreenId,
            source_widget_id: widgetId,
            
            source_screen_name: srcS,
            source_widget_name: se,
            destination_screen_name: dstS
        }
        // console.log(`pushing element on stack: ${JSON.stringify(newEl)}`)

        this.__private().compileTransitions(fromScreenId, srcS, toScreenId, dstS, widgetId, se)
        this.evStack_.push(newEl)
        
        // console.log(`new stack: ${JSON.stringify(this.evStack_)}`)
    }

    // lastWidget() { 

    //     return this.transitionsStack_.length > 0 ? this.transitionsStack_[this.transitionsStack_.length - 1].from_widget : null 
    // }



    lastIsClick() { return this.__private()._isClick(this.__private()._transitionCount() - 1) }
    lastClickSourceScreen() {
        for (let i = this.__private()._transitionCount() - 1; i > 0; i --) {
            if (this.__private()._isClick(i)) {
                return this.transitionsStack_[i].from
            }
        }
        return null
    }
    lastClickWidget() {
        for (let i = this.__private()._transitionCount() - 1; i > 0; i --) {
            if (this.__private()._isClick(i)) {
                return this.transitionsStack_[i].from_widget
            }
        }
        return null
    }
}