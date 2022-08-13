export class GlobalCache {
    
    constructor() {
        this.prefetchedJS_ = "";
        this.prefetchedJSSet_ = false;
    }

    setGlobalJSScript(code) {
        this.prefetchedJS_ = code;
        this.prefetchedJSSet_ = true;
    }
    resetGlobalJSScript() {
        this.prefetchedJS_ = "";
        this.prefetchedJSSet_ = false;
    }
    globalJSScript() { return this.prefetchedJS_; }
    globalJSPrefetched() { return this.prefetchedJSSet_; }
}
