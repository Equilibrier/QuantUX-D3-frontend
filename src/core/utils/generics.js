export function cssGetPxValue(cssSpec) {
    var pos = cssSpec.indexOf("px");
    if (pos >= 0) {
        cssSpec = cssSpec.substring(0, pos);
    }
    return cssSpec * 1;
}