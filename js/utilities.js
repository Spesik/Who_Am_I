Game.extend = function(src, dest) {
    // Create a copy of the source.
    let result = {};
    for (let key in src) {
        result[key] = src[key];
    }
    // Copy over all keys from dest
    for (let key in dest) {
        result[key] = dest[key];
    }
    return result;
};
