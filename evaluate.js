var error = require("./error").evaluate;
var eval = module.exports = {
    evaluate: evaluate,
    logger: require("./logger")
};

function evaluate(expr, env) {
  var current_log_index = eval.logger.add(expr);
  switch (expr.type) {
    case "number":
    case "string":
    case "bool":
      return eval.logger.set(current_log_index, expr, expr);

    case "indexing":
      return eval.logger.set(current_log_index, indexing(expr, env), expr);

    case "var":
      return eval.logger.set(current_log_index, env.get(expr), expr);

    case "new_var":
      return new_var(expr, env);

    case "new_array":
      return eval.logger.set(current_log_index, new_array(expr, env), expr);

    case "assign":
      if (expr.left.type == "var")
        return eval.logger.set(current_log_index, env.set(expr.left, evaluate(expr.right, env), expr), expr);
      if (expr.left.type == "indexing")
        return eval.logger.set(current_log_index, array_assign(expr, env), expr);
      error.assignment_error(expr.left);

    case "unary":
    case "binary":
      return eval.logger.set(current_log_index, apply_op(expr, env), expr);

    case "function":
      return make_function(env, expr);

    case "if":
      for (i = 0; i < expr.cond.length; i++)
        if (evaluate(expr.cond[i], env).value != false)
          return evaluate(expr.then[i], env);
      if (expr.else) return evaluate(expr.else, env);
      return null;

    case "while":
      while (evaluate(expr.cond, env).value)
      	evaluate(expr.body, env);
      return null;

    case "prog":
      expr.prog.forEach(function(expr){ evaluate(expr, env) });
      return null;

    case "call":
      var func = evaluate(expr.func, env);
      if (func.dimension == undefined) {
        func = func.value;
        var temp = [expr].concat(expr.args.map(function(arg){
          return evaluate(arg, env);
        }));
        return eval.logger.set(current_log_index, func.apply(null, temp), expr);
      } else {
        var call_args = expr.args.map(function(arg){
          var ret = evaluate(arg, env);
          ret.name = arg.name;
          return ret;
        });
        return eval.logger.set(current_log_index, eval_function(func, call_args, env), expr);
      }

    case "newline":
      return null;

    default:
      error.do_not_know_how_to_evaluate(expr);
  }
}

function new_var(expr, env) {
  expr.vars.forEach(function(vars_of_one_type) {
    vars_of_one_type.names.forEach(function(var_name) {
      env.def(var_name, wrap(vars_of_one_type.type, null, vars_of_one_type));
    });
  });
  return null;
}

function new_array(expr, env) {
  var value = [];
  var prev_value = null;
  expr.value.forEach(function(expr){
    var new_value = evaluate(expr, env);
    error.new_array_typeCheck(prev_value, new_value, new_value);
    value.push(new_value.value);
    prev_value = new_value;
  });
  return wrap(prev_value.type, value, expr);
}

function apply_op(expr, env) {
  function get(x, type) {
    var value = evaluate(x, env);
    error.operator_dimension_check(expr, value);
    if (type) error.type_check(expr.operator, type, x, value);
    return value;
  }
  function num(x) {
    return get(x, "number").value;
  }
  function div(x) {
    var value = num(x);
    error.check_zero_division(expr, value);
    return value.value;
  }
  function bool(x) {
    return get(x, "bool").value;
  }
  function str(x) {
    return get(x, "string").value;
  }
  function equal(a, b) {
    var left = evaluate(a, env);
    var right = evaluate(b, env);
    error.operator_same_type(expr, left, right);
    return a.value === b.value;
  }
  function wrap_op_result(type, value, expr) {
    return {
      type      : type,
      value     : value,
      dimension : 0,
      position  : expr.position
    };
  }
  if (expr.type == "binary") {
    var a = expr.left;
    var b = expr.right;
    switch (expr.operator) {
      case "+"  :
        var a_value = get(a, null);
        var b_value = get(b, null);
        error.plus_operator_type_check(a, a_value, b, b_value, expr);
        return wrap_op_result(a_value.type, a_value.value + b_value.value, expr);
      case "-"  : return wrap_op_result("number", num(a) - num(b), expr);
      case "*"  : return wrap_op_result("number", num(a) * num(b), expr);
      case "/"  : return wrap_op_result("number", num(a) / div(b), expr);
      case "%"  : return wrap_op_result("number", num(a) % num(b), expr);
      case "and": return wrap_op_result("bool", bool(a) && bool(b), expr);
      case "or" : return wrap_op_result("bool", bool(a) || bool(b), expr);
      case "not": error.unary_only(expr);
      case "<"  : return wrap_op_result("bool", num(a) < num(b), expr);
      case ">"  : return wrap_op_result("bool", num(a) > num(b), expr);
      case "<=" : return wrap_op_result("bool", num(a) <= num(b), expr);
      case ">=" : return wrap_op_result("bool", num(a) >= num(b), expr);
      case "==" : return wrap_op_result("bool", equal(a, b), expr);
      case "!=" : return wrap_op_result("bool", !equal(a, b), expr);
      case "=<" : case "=>" : case "=!" :
        error.operator_reverse_order(expr);
    }
    error.operator_cannot_apply(expr);
  } else {
    var a = expr.value;
    switch (expr.operator) {
      case "-"  : return wrap_op_result("number", -num(a), expr);
      case "not": return wrap_op_result("bool", !bool(a), expr);
      case "+"  : case "*"  : case "/"  : case "%"  : case "and": case "or" :
      case "<"  : case ">"  : case "<=" : case ">=" : case "==" : case "!=" :
      case "=<" : case "=>" : case "=!" :
        error.binary_only(expr);
    }
    error.operator_cannot_apply(expr);
  }
}

function wrap(type, value, expr) {
  return {
    type      : type,
    value     : value,
    dimension : expr.dimension,
    position  : expr.position
  };
}

function eval_function(func, call_args, env) {
  var def_args = func.value.vars;
  var scope = env.extend();
  error.argument_number_check(def_args, call_args, func);
  for (var i = 0; i < call_args.length; ++i){
    error.argument_check(func, call_args[i].name, def_args[i], call_args[i]);
    scope.def(def_args[i].name, call_args[i]);
  }
  return evaluate(func.value.body, scope);
}

function make_function(env, expr) {
  var func = {
    type: "function",
    value: { vars: expr.vars, body: expr.body },
    dimension: 0,
    position: expr.position
  };
  env.def(expr.name, func);
  return null;
}

function indexing(expr, env) {
  var array = evaluate(expr.value, env);
  var index = evaluate(expr.index, env);
  error.check_indexing(expr, array, index);
  return {
    type      : array.type,
    dimension : array.dimension - 1,
    value     : array.value[index.value],
    position  : expr.position
  }
}

function get_indices(expr, env, indices) {
  if (expr.type == "indexing")
    indices = get_indices(expr.value,env,indices);
  if (expr.index) indices.push(expr.index.value);
  return indices;
}

function get_array_name(expr) {
  while (expr.type != "var") expr = expr.value;
  return expr;
}

function set_element(array, indices, value) {
  if (indices.length == 1){
    array[indices[0]] = value;
    return [array];
  }
  var before = array.slice(0, indices[0]);
  var after  = array.slice(indices[0] + 1);
  var index  = indices.shift();
  var middle = set_element(array[index],indices,value);
  return [ [].concat(before,middle,after) ];
}

function array_assign(expr, env) {
    var left = evaluate(expr.left, env);
    var right = evaluate(expr.right, env);
    error.array_assign_check(left, right, expr);
    var indices    = get_indices(expr.left, env, []);
    var array_name = get_array_name(expr.left);
    var array      = env.get(array_name);
    var new_value  = set_element(array.value, indices, right.value);
    array.value = new_value;
    env.set(array_name,array, expr);
    return array;
}
