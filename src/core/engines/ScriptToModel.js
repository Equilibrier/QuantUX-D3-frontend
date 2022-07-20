import DIProvider from '../di/DIProvider';
import Logger from '../Logger'

export function applyChange(model, change, renderFactory) {
    Logger.log(4, 'ScriptToModel.applyChange()', change, renderFactory)

    let element = getElementByChange(model, change)
    if (element) {
        if (change.key.toLowerCase() === "translate") {
            const {tx, ty} = change.props;
            DIProvider.uiWidgetsActionQueue().pushAction(element.id, "translate", `translate(${tx}px,${ty}px) `, (action, payload) => {
                console.log(action ? "" : "") // dummy params, but err if I do not do this (strict-mode compilation)
                console.log(payload ? "" : "")

                console.error(`Am transformat widgetul ${element.id} cu ${payload}, ar fi trebuit ${JSON.stringify(change)}`)

                const model = DIProvider.tempModelContext().currentModel();
                const el = model.widgets[element.id] || model.groups[element.id]
                console.error(`el: ${JSON.stringify(el)}; action: ${JSON.stringify(action)} -- payload: ${JSON.stringify({tx, ty})}`)

                DIProvider.tempModelContext().update(element.id, {tx,ty})
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