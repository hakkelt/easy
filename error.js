module.exports = {
    croak  : croak,
    format : format
}

function croak(msg, exp) {
    throw new Error(msg + " (" + exp.line + ":" + exp.col + ")");
}

function format(value) {
    if (value.constructor === Array ||
      (typeof value === "string") ||
      typeof value === 'object')
        return JSON.stringify(value);
    return value.toString();
}
