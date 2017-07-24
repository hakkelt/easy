var mode = "console";
var input;
var error_messages = require("./error_messages");
var KW = require("./keywords");
var INDENT = "    ";
module.exports = {
  indent: INDENT,
  toString: toString,
  mode: mode,
  TokenStream: {
    after_else: function(next) {
      die(substitute(error_messages.after_else, {
        "NEXT" : next.value
      }), next.position);
    },
    after_end: function(next) {
      die(substitute(error_messages.after_end, {
        "NEXT" : next.value
      }), next.position);
    },
    check_traditional_equal_sign: function(op, pos) {
      if (op == "=") die(error_messages.check_traditional_equal_sign, pos);
    },
    cannot_handle_character: function(ch, pos) {
      die(substitute(error_messages.cannot_handle_character, {
        "CHAR" : ch
      }), pos);
    },
    not_known_escape_character: function(ch, pos) {
      die(substitute(error_messages.not_known_escape_character, {
        "CHAR" : ch
      }), pos);
    },
    forbidden_new_line: function(pos) {
      die(error_messages.forbidden_new_line, pos);
    }
  },
  parser: {
    expecting_punctiation: function(ch, pos) {
      if (ch == "\n") ch = "newline";
      die(substitute(error_messages.expecting_punctiation, {
        "CHAR" : ch
      }), pos);
    },
    expecting_keyword: function(kw, pos) {
      die(substitute(error_messages.expecting_keyword, {
        "KEYWORD" : kw
      }), pos);
    },
    expecting_operator: function(op, pos) {
      die(substitute(error_messages.expecting_operator, {
        "OP" : op
      }), pos);
    },
    unexpected_token: function(token) {
      die(substitute(error_messages.unexpected_token, {
        "TOKEN" : token.value
      }), token.position);
    },
    check_var_type_name: function(token) {
      if (token.type != "kw" || KW.variable_types.indexOf(token.value.toLowerCase()) == -1)
        die(substitute(error_messages.check_var_type_name, {
        "TOKEN" : token.value
      }), token.position);
    },
    check_var_name: function(token, pos) {
      die(substitute(error_messages.check_var_name, {
        "TOKEN" : token
      }), token.position);
    },
    check_prog_length: function(prog, block_name) {
      if (prog.length == 0)
        die(substitute(error_messages.check_prog_length, {
        "TOKEN" : block_name.type
      }), token.position);
    },
    check_function_name: function(name) {
      if (name.type == "kw")
        die(substitute(error_messages.check_function_name_kw, {
        "KW" : name.value
      }), name.position);
      if (name.type != "var")
        die(substitute(error_messages.check_function_name, {
        "KW" : name.value
      }), name.position);
    },
    new_array_check_dimension: function(values) {
      for (i = 0; i < values.length; i++)
          if (values[i].dimension != values[0].dimension)
            if(values[i].dimension > 0 && values[0].dimension > 0)
              die(substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "contains",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "contained"
              }), values[i]);
            else if(values[i].dimension == 0 && values[0].dimension > 0)
              die(substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "is",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "contained"
              }), values[i]);
            else if(values[i].dimension > 0 && values[0].dimension == 0)
              die(substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "contains",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "was"
              }), values[i]);
            else
              die(substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "is",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "was"
              }), values[i]);
    },
  },
  environment: {
    check_if_defined: function(name, scope) {
      if (!scope && this.parent)
        die(substitute(error_messages.check_if_defined, {
          "VARIABLE" : name.value
        }), name.position);
    },
    check_if_initialized: function(name, env) {
      if (!env.vars[name.value.toLowerCase()])
        die(substitute(error_messages.check_if_initialized, {
          "VARIABLE" : name.value
        }), name.position);
    },
    check_dimension: function(name, variable, value) {
      if (variable.dimension !== value.dimension) {
        die(substitute(error_messages.check_dimension, {
          "VAR_NAME"   : name,
          "VAR_TYPE"   : getDimension(variable),
          "EXPR"       : toString(value),
          "EXPR_TYPE"  : getDimension(value),
          "EXPR_VALUE" : format(value.value)
        }), value.position);
      }
    },
    check_array_type: function(name, variable, value) {
      if (variable.dimension !== value.dimension)
        die(substitute(error_messages.assignment_check_type, {
          "VAR_NAME"    : name,
          "VAR_TYPE"    : getDimension(variable),
          "EXPR_TYPE"   : getDimension(value),
          "EXPR"        : toString(value)
        }), value.position);
      if (variable.type !== value.type)
        die(substitute(error_messages.assignment_check_type, {
          "VAR_NAME"    : toString(name),
          "IS/CONTAINS" : variable.dimension > 0 ? "contains" : "is",
          "VAR_TYPE"    : variable.type + (variable.dimension > 0 ? "s" : ""),
          "EXPR_TYPE"   : value.type + (value.dimension > 0 ? "s" : ""),
          "IS/ARE"      : value.dimension > 0 ? "are" : "is",
          "EXPR"        : toString(value)
        }), value.position);
    },
    check_redefinition: function(name, env, pos) {
      if (Object.prototype.hasOwnProperty.call(env.vars, name.toLowerCase()))
        die(substitute(error_messages.check_redefinition, {
          "VARIABLE" : name
        }), pos);
    },
  },
  evaluate: {
    assignment_error: function(expr) {
      die(substitute(error_messages.assignment_error, {
        "EXPR"  : toString(expr),
        "VALUE" : format(expr.value),
        "TYPE"  : expr.type
      }))
    },
    new_array_typeCheck: function(Old, New, pos) {
      if (!Old || New.type == Old.type) return;
      die(substitute(error_messages.new_array_typeCheck, {
          "NEW_VALUE" : format(New.value),
          "NEW_TYPE"  : New.type,
          "OLD_TYPE"  : Old.type
      }), pos);
    },
    mystery: function(expr) {
      die(substitute(error_messages.do_not_know_how_to_evaluate, {
        "EXPR" : toString(expr)
      }), expr.position);
    },
    type_check: function(operator, type, expr, value) {
      if (value.type !== type)
        die(substitute(error_messages.type_check, {
          "OP"         : operator,
          "TYPE"       : type,
          "EXPR"       : toString(expr),
          "EXPR_VALUE" : format(value.value),
          "EXPR_TYPE"  : expr.type
        }), expr.position);
    },
    check_zero_division: function(expr, value) {
      if (value.type !== "number")
        die(substitute(error_messages.type_check, {
          "OP"         : expr.operator,
          "TYPE"       : "number",
          "EXPR"       : toString(expr),
          "EXPR_VALUE" : format(value.value),
          "EXPR_TYPE"  : value.type
        }), expr.position);
      if (value.value == 0)
        die(substitute(error_messages.check_zero_division, {
          "EXPR" : toString(expr),
          "_"    : value.type == "number" ? "" : " = " + value.value
        }), expr.position);
    },
    operator_dimension_check: function(expr, value) {
      if (value.dimension > 0)
        die(substitute(error_messages.check_dimension, {
          "OP"   : expr.operator,
          "EXPR" : toString(expr),
          "TYPE" : getDimension(expr)
        }), expr.position);
    },
    operator_same_type: function(op, a, b) {
      if (a.type != b.type)
        die(substitute(error_messages.operator_same_type, {
          "EXPR1" : toString(a),
          "TYPE1" : a.type,
          "EXPR2" : toString(b),
          "TYPE2" : b.type
        }), op.position);
    },
    operator_reverse_order: function(op) {
      die(substitute(error_messages.operator_reverse_order, {
        "OP"     : op.operator,
        "REV_OP" : reverseString(op.operator)
      }), op.position);
    },
    unary_only: function(op) {
      die(substitute(error_messages.operator_unary_only, {
        "OP"      : op.operator,
        "EXPR"    : toString(op)
      }), op.position);
    },
    binary_only: function(op) {
      die(substitute(error_messages.operator_binary_only, {
        "OP"      : op.operator,
        "EXPR"    : toString(op)
      }), op.position);
    },
    operator_cannot_apply: function(op) {
      die(substitute(error_messages.operator_cannot_apply, {
        "OP"     : op.operator
      }), op.position);
    },
    argument_number_check: function(def_args, call_args, expr) {
      if (call_args.length - 1 != def_args.length)
        die(substitute(error_messages.argument_number_check, {
          "EXP_ARGS"   : def_args.length,
          "GIVEN_ARGS" : call_args.length
        }), expr.position);
    },
    argument_check: function(call, call_argument_name, def_arg, call_arg) {
      if (def_arg.dimension !== call_arg.dimension)
        die(substitute(error_messages.argument_check_type, {
          "ARG_NAME"    : def_arg.name,
          "ARG_TYPE"    : getDimension(def_arg),
          "EXPR_TYPE"   : getDimension(call_arg),
          "EXPR"        : toString(call_arg)
        }), call.position);
      if (def_arg.type !== call_arg.type) {
        var expr = toString(call_argument_name);
        var expr_value = toString(call_arg);
        die(substitute(error_messages.argument_check_type, {
          "ARG_NAME"    : def_arg.name,
          "IS/CONTAINS" : def_arg.dimension > 0 ? "contains" : "is",
          "ARG_TYPE"    : def_arg.type + (def_arg.dimension > 0 ? "s" : ""),
          "EXPR_TYPE"   : call_arg.type + (call_arg.dimension > 0 ? "s" : ""),
          "IS/ARE"      : call_arg.dimension > 0 ? "are" : "is",
          "EXPR"        : expr + (expr == expr_value ? "" : " = " + expr_value)
        }), call.position);
      }
    },
    check_indexing: function(expr, array, index) {
      if (!array.value)
        die(substitute(error_messages.check_if_initialized, {
          "VARIABLE" : toString(expr.value)
        }), expr.position);
      if (!index)
        die(substitute(error_messages.check_if_initialized, {
          "VARIABLE" : toString(expr.index)
        }), expr.position);
      if (array.dimension == 0)
        die(substitute(error_messages.argument_check_array, {
          "EXPR" : toString(array)
        }), array.position);
      if (index.type != "number")
        die(substitute(error_messages.argument_check_type, {
          "EXPR" : toString(index),
          "TYPE" : index.type
        }), index.position);
      if (index.dimension != 0)
        die(substitute(error_messages.argument_check_dimension, {
          "EXPR" : toString(index),
          "TYPE" : getDimension(index)
        }), index.position);
      if (index.value != Math.floor(index.value))
        die(substitute(error_messages.index_is_not_whole_number, {
          "EXPR" : toString(expr),
          "INDEX" : toString(expr.index),
          "VALUE" : index.value
        }), index.position);
      if (index.value < 0)
        die(substitute(error_messages.check_indexing_negative, {
          "EXPR"  : toString(index),
          "VALUE" : format(index.value)
        }), index.position);
      if (index.value == array.value.length)
        die(substitute(error_messages.check_indexing_equal, {
          "EXPR"  : toString(index),
          "#"     : array.length
        }), index.position);
      if (index.value > array.value.length)
        die(substitute(error_messages.check_indexing_larger, {
          "EXPR"  : toString(index),
          "VALUE" : format(index.value),
          "#"     : array.length
        }), index.position);
    },
    array_assign_check: function(left, right, expr) {
      if (left.type !== right.type)
        die(substitute(error_messages.array_assign_check_type, {
          "LEFT_EXPR"  : toString(left),
          "LEFT_TYPE"  : left.type,
          "RIGHT_EXPR" : toString(right),
          "RIGHT_TYPE" : right.type
        }), expr.position);
      if (left.dimension !== right.dimension)
        die(substitute(error_messages.array_assign_check_type, {
          "LEFT_EXPR"  : toString(left),
          "LEFT_TYPE"  : getDimension(left),
          "RIGHT_EXPR" : toString(right),
          "RIGHT_TYPE" : getDimension(right)
        }), expr.position);
    }
  }
}

function format(value) {
  if (value.constructor === Array || typeof value === 'object')
      return JSON.stringify(value);
  return value.toString();
}

function die(msg, pos) {
  if (mode == "console")
    throw new Error(msg.title + ": " + msg.msg + " (" + pos.begin.line + ":" + pos.begin.col + ")");
  if (mode == "object")
    throw new Error({
      title    : msg.title,
      msg      : msg.msg,
      position : pos
    });
  throw new Error("Unknown mode: " + mode);
}
function substitute(msg, substitutes) {
  for (var key in substitutes)
    msg.msg = msg.msg.replace(key, substitutes[key]);
  return msg;
}
function getDimension(expr) {
  return (expr.dimension > 0 ? expr.dimension + "D array" : "scalar value")
}
function reverseString(str) {
  return str.split( '' ).reverse( ).join( '' );
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
    str += indent + KW.ELSE + " " + KW.IF + " " + toString(ast.cond[i], indent + INDENT) + " " + KW.THEN + "\n";
    str += toString(ast.then[i], indent + INDENT) + "\n";
  }
  if (ast.else)
    str += indent + KW.ELSE + "\n" + toString(ast.else, indent + INDENT) + "\n";
  return str + indent + KW.END + " " + KW.IF;
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
      return ast.operator + " " + toString(ast.value);

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
