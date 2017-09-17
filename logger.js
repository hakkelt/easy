var log = [];
var current_line = 0;
var current = null;
var PC = require("./printCode");

module.exports = {
  log: log,
  add: add,
  set: set
};

function add(ast) {
  if (ast.position.begin.line != ast.position.end.line ||
      ["newline"].indexOf(ast.type) != -1)
        return null;
  //if (ast.pos.begin.line == current_line) return null;
  current_line = ast.position.begin.line;
  log.push({
    string: PC.toString(ast),
    value: null,
    ast: ast
  });
  return log.length - 1;
}

function set(current, value) {
  if (current == null) return value;
  return log[current].value = value;
}
