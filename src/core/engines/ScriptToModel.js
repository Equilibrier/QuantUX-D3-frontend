import DIProvider from '../di/DIProvider';
import Logger from '../Logger'

export function applyChange(model, change, renderFactory, databindings) {
    Logger.log(4, 'ScriptToModel.applyChange()', change, renderFactory)

    let element = getElementByChange(model, change)
    if (element) {
        if (change.key.toLowerCase() === "translate") {
            const {tx, ty} = change.props;
            DIProvider.uiWidgetsActionQueue().pushAction(element.id, "translate", `translate(${tx}px,${ty}px) `, (action, payload) => {
                console.log(action ? "" : "") // dummy params, but err if I do not do this (strict-mode compilation)
                console.log(payload ? "" : "")

                // const model = DIProvider.tempModelContext().currentModel();
                //const el = model.widgets[element.id] || model.groups[element.id]

                DIProvider.tempModelContext().update(element.id, {tx,ty})
            })
        }
        else if (change.key.toLowerCase() === "animate") {
            const {styleFrom, styleTo, posFrom, posTo, durationMs} = change.props;
            const posOffset = change.props.posOffset ? change.props.posOffset : {x: 0, y: 0}
            const delayMs = 0;
            
            databindings.anims_in_progress = databindings.anims_in_progress ? databindings.anims_in_progress : {};
            databindings.anims_in_progress[element.id] = true;

            DIProvider.asyncScheduler().triggerAnimationStarted(element.id)

            DIProvider.uiWidgetsActionQueue().pushAction(element.id, "animate", {styleFrom, styleTo, posFrom, posTo, durationMs, delayMs, posOffset}, (action, payload) => {
                console.log(action ? "" : "") // dummy params, but err if I do not do this (strict-mode compilation)
                console.log(payload ? "" : "")

                console.error(`Ended animation for widget ${element.id}`)

                databindings.anims_in_progress[element.id] = false;

                DIProvider.asyncScheduler().triggerAnimationEnded(element.id)
            })
        }
        else {
            let old = change.key === 'style' ? element.style : element.props
            let overwrites = change.key === 'style' ? change.style : change.props
            for (let key in overwrites) {
                old[key] = overwrites[key]
            }
            renderFactory.updateWidget(element)
        }

    } else {
        Logger.error('ScriptToModel.applyChanges() > Cannot find element', change)
    }
}


function getElementByChange(model, change) {
    if (change.type === 'Widget') {
        return model.widgets[change.id]
    }
    if (change.type === 'Screen') {
        return model.screens[change.id]
    }
}