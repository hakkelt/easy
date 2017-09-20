var mode = "console";
module.exports = {
  format: function (value) {
    if (value.constructor === Array || typeof value === 'object')
        return JSON.stringify(value);
    return value;
  },
  die: function (msg, pos) {
    if (mode == "console")
      throw new Error(msg.title + ": " + msg.msg + " (" + pos.begin.line + ":" + pos.begin.col + ")");
    if (mode == "object")
      throw new Error({
        title    : msg.title,
        msg      : msg.msg,
        position : pos
      });
    throw new Error("Unknown mode: " + mode);
  },
  substitute: function (msg, substitutes) {
    for (var key in substitutes)
      msg.msg = msg.msg.replace(key, substitutes[key]);
    return msg;
  },
  getDimension: function (expr) {
    return (expr.dimension > 0 ? expr.dimension + "D array" : "scalar value")
  },
  print_with_value: function (expr, value) {
    var longer = wipe(expr) != wipe(value);
    return qouted_expr = (longer ? "'" + expr + "'" : expr) + (!longer ? "" : " (= " + value + ")");
  },
  reverseString: function (str) {
    return str.split( '' ).reverse( ).join( '' );
  }
};

function wipe(str) {
  return String(str).replace(" ", "");
}
