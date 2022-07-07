
class DIProvider {
    constructor() {
        this._canvas = null;
    }

    setCanvas(canvas) {
        if (this._canvas === null) {
            this._canvas = canvas;
        }
        else {
            console.warn("Canvas already set...");
        }
    }

    canvas() { return this._canvas; }
}

export default new DIProvider();