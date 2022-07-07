
class DIPProvider {
    constructor() {
        this.canvas = null;
    }

    setCanvas(canvas) {
        if (this.canvas !== null) {
            this.canvas = canvas;
        }
        else {
            console.warn("Canvas already set...");
        }
    }

    canvas() { return this.canvas }
}

export default new DIPProvider();