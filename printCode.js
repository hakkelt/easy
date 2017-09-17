var INDENT = "    ";
var KW = require("./keywords");
module.exports = {
  indent: INDENT,
  toString: toString
}
function new_var_toString(ast, indent) {
  var str = indent + KW.VARIABLES + ":";
  var array = [];
  ast.vars.forEach(function(line) {
    array.push(line.names.join(", ") + " : " + line.type);
  });
  if (array.length != 1) str += "\n" + INDENT + indent;
  else str += " ";
  return str + array.join(',\n' + INDENT + indent);
}
function prod_if(ast, indent) {
  var str = indent + KW.IF + " " + toString(ast.cond[0]) + " " + KW.THEN + "\n";
  str += toString(ast.then[0], indent + INDENT) + "\n";
  for (i = 1; i < ast.cond.length; i++) {
    str += indent + KW.ELSEIF + " " + toString(ast.cond[i], indent + INDENT) + " " + KW.THEN + "\n";
    str += toString(ast.then[i], indent + INDENT) + "\n";
  }
  if (ast.else)
    str += indent + KW.ELSE + "\n" + toString(ast.else, indent + INDENT) + "\n";
  return str + indent + KW.ENDIF;
}
function new_function(ast, indent) {
  var str = indent + KW.FUNCTION + " (";
  var array = [];
  ast.vars.forEach(function(item) {
    array.push(item.name + ":" + item.type);
  });
  str += array.join(", ") + ")\n";
  str += toString(ast.body, indent + INDENT);
  return str + "\n" + indent + KW.END + " " + KW.FUNCTION;
}
function toString(ast, indent="") {
  switch (ast.type) {
    case "number":
    case "var":
      return ast.value;

    case "bool":
      return ast.value ? KW.TRUE : KW.FALSE;

    case "string":
      return "\"" + ast.value + "\"";

    case "indexing":
      return toString(ast.value) + "[" + toString(ast.index) + "]";

    case "new_var":
      return new_var_toString(ast, indent);

    case "new_array":
      var array = [];
      ast.value.forEach(function(item) {
        array.push(toString(item));
      });
      return "[" + array.join(",") + "]";

    case "assign":
      return  indent + toString(ast.left) + " ← " + toString(ast.right);

    case "unary":
      return ast.operator + (ast.operator == '-' ? "" : " ") + toString(ast.value);

    case "binary":
      return toString(ast.left) + " " + ast.operator + " " + toString(ast.right);

    case "function":
      return new_function(ast, indent);

    case "if":
      return prod_if(ast, indent);

    case "while":
      var str = indent + KW.WHILE + " " + ast.cond + "\n";
      str += toString(ast.body, indent + INDENT);
      return str + "\n" + indent + KW.END + " " + KW.WHILE;

    case "prog":
      var array = [];
      ast.prog.forEach(function(expr){
        array.push(toString(expr, indent));
      });
      return array.join("\n");

    case "call":
      var str = indent + ast.func.value + "(";
      var array = [];
      ast.args.forEach(function(item) {
        array.push(toString(item));
      });
      return str + array.join(", ") + ")";

    case "newline":
      return indent;

    default:
      die(substitute(error_messages.do_not_know_how_to_stringify, {
        "EXPR" : ast.type
      }), ast.position);
  }
}
function print_ast(ast) {
	const util = require('util')
	console.log(util.inspect(ast, {showHidden: false, depth: null}))
}
