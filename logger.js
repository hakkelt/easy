var log = [];
var current_line = 0;
var current = null;
var PC = require("./printCode");
var map = [];

module.exports = {
  log: log,
  add: add,
  set: set
};

function lookup(where, what) {
  for(i = 0; i < where.length; i++)
    if (where[i].string.length > what.length && where[i].string.indexOf(what) != -1)
      return lookup(where[i].tree, what);
  return where;
}

function new_node(string, type) {
  return {
    string: string,
    type: type,
    value: null,
    tree: []
  };
}

function add(ast) {
  if (ast.position.begin.line != ast.position.end.line ||
      ["newline", "new_var", "new_array", "number", "string", "bool"].indexOf(ast.type) != -1)
        return null;
  if (ast.position.begin.line != current_line)
    log.push([]);
  var string = PC.toString(ast);
  var last = log[log.length - 1];
  var place = lookup(last, string);
  place.push(new_node(string, ast.type));
  map.push(place[place.length - 1]);
  current_line = ast.position.begin.line;
  return map.length - 1;
}

function typeToString(value) {
  return (value.dimension > 0 ? value.dimension + "D array of " : "") + value.type;
}

function set(current, value, ast) {
  if (current == null || value == null) return value;
  if (value.type == "function")
    map[current].value = "function";
  else
    map[current].value = {
      type: typeToString(value),
      value: value.value
    }
  return value;
}
