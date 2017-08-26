var error = require("./error").evaluate;
module.exports = {
    evaluate: evaluate
}

function evaluate(expr, env, log) {
  switch (expr.type.toLowerCase()) {
    case "number":
    case "string":
    case "bool":
      return expr;

    case "indexing":
      return indexing(expr, env);

    case "var":
      return env.get(expr);

    case "new_var":
      return new_var(expr, env);

    case "new_array":
      return new_array(expr, env);

    case "assign":
      if (expr.left.type == "var")
        return env.set(expr.left, evaluate(expr.right, env), expr);
      if (expr.left.type == "indexing")
        return array_assign(expr, env);
      error.assignment_error(expr.left);

    case "unary":
      return apply_op(expr, env);

    case "binary":
      return apply_op(expr, env);

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
      var func = evaluate(expr.func, env).value;
      var temp = [expr].concat(expr.args.map(function(arg){
        return evaluate(arg, env);
      }))
      //console.log(temp);
      return func.apply(null, temp);

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

function make_function(env, expr) {
  function lambda() {
    var args = expr.vars;
    var scope = env.extend();
    error.argument_number_check(args, arguments, args[0]);
    for (var i = 1; i < arguments.length; ++i){
      error.argument_check(arguments[0], arguments[0].args[i-1], args[i-1], arguments[i]);
      scope.def(args[i-1].name, wrap(args[i-1].type, arguments[i].value, args[i-1]));
    }
    return evaluate(expr.body, scope);
  }
  env.def(expr.name, wrap("function", lambda, expr));
  return lambda;
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
