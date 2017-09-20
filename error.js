var KW = require("./keywords");
var PC = require("./printCode");
var error_messages = require("./error_messages");
var e = require("./error_functions");
module.exports = {
  TokenStream: {
    after_else: function(next) {
      e.die(e.substitute(error_messages.after_else, {
        "NEXT" : next.value
      }), next.position);
    },
    after_end: function(next) {
      e.die(e.substitute(error_messages.after_end, {
        "NEXT" : next.value
      }), next.position);
    },
    check_traditional_equal_sign: function(op, pos) {
      if (op == "=") e.die(error_messages.check_traditional_equal_sign, pos);
    },
    single_quote: function(pos) {
      e.die(error_messages.single_quote, pos);
    },
    cannot_handle_character: function(ch, pos) {
      e.die(e.substitute(error_messages.cannot_handle_character, {
        "CHAR" : ch
      }), pos);
    },
    not_known_escape_character: function(ch, pos) {
      e.die(e.substitute(error_messages.not_known_escape_character, {
        "CHAR" : ch
      }), pos);
    },
    forbidden_new_line: function(pos) {
      e.die(error_messages.forbidden_new_line, pos);
    }
  },
  parser: {
    get_confused: function(pos) {
      e.die(error_messages.get_confused, pos);
    },
    expecting_punctiation: function(ch, pos) {
      if (ch == "\n") ch = "line break";
      e.die(e.substitute(error_messages.expecting_punctiation, {
        "CHAR" : ch
      }), pos);
    },
    expecting_keyword: function(kw, pos) {
      e.die(e.substitute(error_messages.expecting_keyword, {
        "KEYWORD" : kw
      }), pos);
    },
    expecting_operator: function(op, pos) {
      e.die(e.substitute(error_messages.expecting_operator, {
        "OP" : op
      }), pos);
    },
    expecting_var_name: function(id) {
      e.die(e.substitute(error_messages.expecting_var_name, {
        "ID"  : id.value
      }), id.position);
    },
    not_known_word:  function(token) {
      e.die(e.substitute(error_messages.not_known_word, {
        "TOKEN" : token.value
      }), token.position);
    },
    variable_definition_missing_comma: function(pos) {
      e.die(error_messages.variable_definition_missing_comma, { begin: pos, end: pos});
    },
    unexpected_token: function(token) {
      e.die(e.substitute(error_messages.unexpected_token, {
        "TOKEN" : (token.value == '\n' ? "line break" : token.value)
      }), token.position);
    },
    check_var_type_name: function(token) {
      if (token.type != "kw" || KW.variable_types.indexOf(token.value.toLowerCase()) == -1)
        e.die(e.substitute(error_messages.check_var_type_name, {
        "TOKEN" : token.value
      }), token.position);
    },
    check_var_name: function(token, pos) {
      e.die(e.substitute(error_messages.check_var_name, {
        "TOKEN" : token
      }), token.position);
    },
    check_prog_length: function(prog, block_name) {
      if (prog.length == 0)
        e.die(e.substitute(error_messages.check_prog_length, {
        "TOKEN" : block_name.type
      }), token.position);
    },
    check_function_name: function(name) {
      if (name.type == "kw")
        e.die(e.substitute(error_messages.check_function_name_kw, {
        "KW" : name.value
      }), name.position);
      if (name.type != "var")
        e.die(e.substitute(error_messages.check_function_name, {
        "KW" : name.value
      }), name.position);
    },
    new_array_check_dimension: function(values) {
      for (i = 0; i < values.length; i++)
          if (values[i].dimension != values[0].dimension)
            if(values[i].dimension > 0 && values[0].dimension > 0)
              e.die(e.substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : PC.toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "contains",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "contained"
              }), values[i]);
            else if(values[i].dimension == 0 && values[0].dimension > 0)
              e.die(e.substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : PC.toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "is",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "contained"
              }), values[i]);
            else if(values[i].dimension > 0 && values[0].dimension == 0)
              e.die(e.substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : PC.toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "contains",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "was"
              }), values[i]);
            else
              e.die(e.substitute(error_messages.new_array_check_dimension, {
                "EXPR"          : PC.toString(values[i]),
                "CURRENT_TYPE"  : values[i].dimension,
                "IS/CONTAINS_1" : "is",
                "PREVIOUS_TYPE" : values[0].dimension,
                "IS/CONTAINS_2" : "was"
              }), values[i]);
    },
  },
  environment: {
    check_if_defined: function(name, scope) {
      if (!scope)
        e.die(e.substitute(error_messages.check_if_defined, {
          "VARIABLE" : name.value
        }), name.position);
    },
    check_if_initialized: function(name, env) {
      if (!env.vars[name.value.toLowerCase()])
        e.die(e.substitute(error_messages.check_if_initialized, {
          "VARIABLE" : name.value
        }), name.position);
    },
    check_dimension: function(name, variable, value) {
      if (variable.dimension !== value.dimension) {
        e.die(e.substitute(error_messages.check_dimension, {
          "VAR_NAME"   : name,
          "VAR_TYPE"   : e.getDimension(variable),
          "EXPR"       : e.print_with_value(PC.toString(value), e.format(value.value), true),
          "EXPR_TYPE"  : e.getDimension(value),
        }), value.position);
      }
    },
    check_array_type: function(name, variable, value) {
      if (variable.dimension !== value.dimension)
        e.die(e.substitute(error_messages.assignment_check_type, {
          "VAR_NAME"    : name,
          "VAR_TYPE"    : e.getDimension(variable),
          "EXPR"        : PC.toString(value),
          "EXPR_TYPE"   : e.getDimension(value)
        }), value.position);
      if (variable.type !== value.type)
        e.die(e.substitute(error_messages.assignment_check_type, {
          "VAR_NAME"    : PC.toString(name),
          "IS/CONTAINS" : variable.dimension > 0 ? "contains" : "is",
          "VAR_TYPE"    : variable.type + (variable.dimension > 0 ? "s" : ""),
          "EXPR_TYPE"   : value.type + (value.dimension > 0 ? "s" : ""),
          "IS/ARE"      : value.dimension > 0 ? "are" : "is",
          "EXPR"        : PC.toString(value)
        }), value.position);
    },
    check_redefinition: function(name, env, pos) {
      if (Object.prototype.hasOwnProperty.call(env.vars, name.toLowerCase()))
        e.die(e.substitute(error_messages.check_redefinition, {
          "VARIABLE" : name
        }), pos);
    },
  },
  evaluate: {
    assignment_error: function(expr) {
      e.die(e.substitute(error_messages.assignment_error, {
        "EXPR"  : e.print_with_value(PC.toString(expr), e.format(PC.toString(expr)), true),
        "TYPE"  : expr.type
      }), expr.position);
    },
    new_array_typeCheck: function(Old, New, pos) {
      if (!Old || New.type == Old.type) return;
      e.die(e.substitute(error_messages.new_array_typeCheck, {
          "NEW_VALUE" : e.format(New.value),
          "NEW_TYPE"  : New.type,
          "OLD_TYPE"  : Old.type
      }), pos);
    },
    do_not_know_how_to_evaluate: function(expr) {
      e.die(e.substitute(error_messages.do_not_know_how_to_evaluate, {
        "EXPR" : PC.toString(expr)
      }), expr.position);
    },
    type_check: function(operator, type, expr, value) {
      if (value.type !== type)
        e.die(e.substitute(error_messages.type_check, {
          "OP"        : operator,
          "TYPE"      : type,
          "EXPR"      : e.print_with_value(PC.toString(expr), e.format(value.value), true),
          "EXPR_TYPE" : expr.type
        }), expr.position);
    },
    check_zero_division: function(expr, value) {
      if (value.type !== KW.NUMBER)
        e.die(e.substitute(error_messages.type_check, {
          "OP"         : expr.operator,
          "TYPE"       : KW.NUMBER,
          "EXPR"       : PC.toString(expr),
          "EXPR_VALUE" : e.format(value.value),
          "EXPR_TYPE"  : value.type
        }), expr.position);
      if (value.value == 0)
        e.die(e.substitute(error_messages.check_zero_division, {
          "EXPR" : PC.toString(expr),
          "_"    : value.type == KW.NUMBER ? "" : " = " + value.value
        }), expr.position);
    },
    plus_operator_type_check: function(a, a_value, b, b_value, expr) {
      if (!((a_value.type == KW.NUMBER && b_value.type == KW.NUMBER) ||
            (a_value.type == KW.STRING && b_value.type == KW.STRING)))
        e.die(e.substitute(error_messages.plus_operator_type_check, {
          "A_EXPR" : PC.toString(a),
          "A_TYPE" : a_value.type,
          "B_EXPR" : PC.toString(b),
          "B_TYPE" : b_value.type
        }), expr.position);
    },
    operator_dimension_check: function(expr, value) {
      if (value.dimension > 0)
        e.die(e.substitute(error_messages.check_dimension, {
          "OP"   : expr.operator,
          "EXPR" : PC.toString(expr),
          "TYPE" : e.getDimension(expr)
        }), expr.position);
    },
    operator_same_type: function(op, a, b) {
      if (a.type != b.type)
        e.die(e.substitute(error_messages.operator_same_type, {
          "EXPR1" : PC.toString(a),
          "TYPE1" : a.type,
          "EXPR2" : PC.toString(b),
          "TYPE2" : b.type
        }), op.position);
    },
    operator_reverse_order: function(op) {
      e.die(e.substitute(error_messages.operator_reverse_order, {
        "OP"     : op.operator,
        "REV_OP" : e.reverseString(op.operator)
      }), op.position);
    },
    unary_only: function(op) {
      e.die(e.substitute(error_messages.operator_unary_only, {
        "OP"      : op.operator,
        "EXPR"    : PC.toString(op)
      }), op.position);
    },
    binary_only: function(op) {
      e.die(e.substitute(error_messages.operator_binary_only, {
        "OP"      : op.operator,
        "EXPR"    : PC.toString(op)
      }), op.position);
    },
    operator_cannot_apply: function(op) {
      e.die(e.substitute(error_messages.operator_cannot_apply, {
        "OP"     : op.operator
      }), op.position);
    },
    argument_number_check: function(def_args, call_args, expr) {
      if (call_args.length != def_args.length)
        e.die(e.substitute(error_messages.argument_number_check, {
          "EXP_ARGS"   : def_args.length,
          "GIVEN_ARGS" : call_args.length
        }), expr.position);
    },
    argument_check: function(call, call_argument_name, def_arg, call_arg) {
      if (def_arg.dimension !== call_arg.dimension)
        e.die(e.substitute(error_messages.argument_check_type, {
          "ARG_NAME"    : def_arg.name,
          "ARG_TYPE"    : e.getDimension(def_arg),
          "EXPR_TYPE"   : e.getDimension(call_arg),
          "EXPR"        : PC.toString(call_arg)
        }), call.position);
      if (def_arg.type !== call_arg.type) {
        var expr = PC.toString(call_argument_name);
        var expr_value = PC.toString(call_arg);
        e.die(e.substitute(error_messages.argument_check_type, {
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
        e.die(e.substitute(error_messages.check_if_initialized, {
          "VARIABLE" : PC.toString(expr.value)
        }), expr.position);
      if (!index)
        e.die(e.substitute(error_messages.check_if_initialized, {
          "VARIABLE" : PC.toString(expr.index)
        }), expr.position);
      if (array.dimension == 0)
        e.die(e.substitute(error_messages.argument_check_array, {
          "EXPR" : PC.toString(array)
        }), array.position);
      if (index.type != KW.NUMBER)
        e.die(e.substitute(error_messages.argument_check_type, {
          "EXPR" : PC.toString(index),
          "TYPE" : index.type
        }), expr.position);
      if (index.dimension != 0)
        e.die(e.substitute(error_messages.argument_check_dimension, {
          "EXPR" : PC.toString(index),
          "TYPE" : e.getDimension(index)
        }), expr.position);
      if (index.value != Math.floor(index.value)){
        var index_expr =
        e.die(e.substitute(error_messages.index_is_not_whole_number, {
          "EXPR"  : PC.toString(expr),
          "INDEX" : e.print_with_value(PC.toString(expr.index), index.value)
        }), expr.position);
      }
      if (index.value < 0)
        e.die(e.substitute(error_messages.check_indexing_negative, {
          "INDEX" : e.print_with_value(PC.toString(expr.index), e.format(index.value), true),
          "EXPR"  : PC.toString(expr)
        }), expr.position);
      if (index.value == array.value.length)
        e.die(e.substitute(error_messages.check_indexing_equal, {
          "EXPR"  : e.print_with_value(PC.toString(expr.index), index.value),
          "#"     : array.value.length
        }), expr.position);
      if (index.value > array.value.length)
        e.die(e.substitute(error_messages.check_indexing_larger, {
          "EXPR"  : e.print_with_value(PC.toString(expr.index), index.value),
          "#"     : array.value.length
        }), expr.position);
    },
    array_assign_check: function(left, right, expr) {
      if (left.type !== right.type)
        e.die(e.substitute(error_messages.array_assign_check_type, {
          "LEFT_EXPR"  : PC.toString(left),
          "LEFT_TYPE"  : left.type,
          "RIGHT_EXPR" : PC.toString(right),
          "RIGHT_TYPE" : right.type
        }), expr.position);
      if (left.dimension !== right.dimension)
        e.die(e.substitute(error_messages.array_assign_check_type, {
          "LEFT_EXPR"  : PC.toString(left),
          "LEFT_TYPE"  : e.getDimension(left),
          "RIGHT_EXPR" : PC.toString(right),
          "RIGHT_TYPE" : e.getDimension(right)
        }), expr.position);
    }
  }
}
