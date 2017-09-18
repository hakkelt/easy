"use strict";
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
    if (where[i].string.indexOf(what) != -1)
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

if (!Array.prototype.hasOwnProperty("last"))
  Array.prototype.methodName = function () {

  };


function add(ast) {
  if (ast.position.begin.line != ast.position.end.line ||
      ["newline", "new_var", "new_array", "number", "string", "bool"].indexOf(ast.type) != -1)
        return null;
  if (ast.position.begin.line != current_line)
    log.push([]);
  var string = PC.toString(ast);
  var last = log[log.length-1];
  var place = lookup(last, string);
  place.push(new_node(string, ast.type));
  map.push(place[place.length - 1]);
  current_line = ast.position.begin.line;
  return map.length - 1;
}

function set_lookup(where, what) {
  console.log(where);
  for(i = 0; i < where.length; i++)
    for(var j = 0; j < where[i].tree.length; j++)
      if (where[i].tree[j].string.indexOf(what) != -1)
        return lookup(where[i], what);
  return where;
}

function set(current, value, ast) {
  if (current == null) return value;
  return map[current].value = value;
}
