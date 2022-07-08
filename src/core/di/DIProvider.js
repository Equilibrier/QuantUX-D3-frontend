
class DIProvider {
    constructor() {
        this._canvas = null;
        this._model = null;
    }

    __set(fieldName) {
        return (value) => {
            if (this[fieldName] === null) {
                this[fieldName] = value;
            }
            else {
                console.warn(`DIProvider: ${fieldName} was already set...`);
            }
        }
    }

    __waitUntil = (condition, result, timeoutMs = -1) => {
        let periodMs = 100;

        return new Promise((resolve) => {
            let countMs = 0;
            let interval = setInterval(() => {
                if (countMs >= timeoutMs) {
                    console.error(`DIProvider: timeout of ${timeoutMs} ms reached trying to wait for condition ${condition}`);

                    clearInterval(interval)
                    resolve(null);
                }
                if (!condition()) {
                    countMs += periodMs;
                    return
                }
                clearInterval(interval)
                resolve(result)
            }, periodMs);
        })
    }

    setCanvas(canvas) {
        this.__set("_canvas")(canvas);
    }
    setModel(model) {
        this.__set("_model")(model);
    }

    canvas() { return this._canvas; }
    canvasAsync() { return this.__waitUntil(() => this._canvas !== null, this._canvas, 3000); }
    
    model() { return this._model; }
    modelAsync() { return this.__waitUntil(() => this._model !== null, this._model, 3000); }
}

export default new DIProvider();