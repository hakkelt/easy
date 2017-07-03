var error = require("./error").evaluate;
module.exports = {
    evaluate: evaluate
}

function evaluate(expr, env) {
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

    case "binary":
      var left  = evaluate(expr.left,  env);
      var right = evaluate(expr.right, env);
      return apply_op(expr, left, right);

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
      return func.apply(null, expr.args.map(function(arg){
        return evaluate(arg, env);
      }));

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

function apply_op(op, a, b) {
  function num(x) {
    error.type_check(x, "number", op);
    return x.value;
  }
  function div(x) {
    error.check_zero_division(x);
    return x.value;
  }
  function bool(x) {
    error.type_check(x, "bool", op);
    return x.value;
  }
  function str(x) {
    error.type_check(x, "string", op);
    return x.value;
  }
  function equal() {
    error.operator_same_type(op, a, b);
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
  error.operator_dimension_check(op, a);
  error.operator_dimension_check(op, b);
  switch (op.operator) {
    case "+"  : return wrap_op_result("number", num(a) + num(b), op);
    case "-"  : return wrap_op_result("number", num(a) - num(b), op);
    case "*"  : return wrap_op_result("number", num(a) * num(b), op);
    case "/"  : return wrap_op_result("number", num(a) / num(b), op);
    case "%"  : return wrap_op_result("number", num(a) % num(b), op);
    case "&"  : return wrap_op_result("string", str(a) + str(b), op);
    case "and": return wrap_op_result("bool", bool(a) !== false && bool(b), op);
    case "or" : return wrap_op_result("bool", bool(a) !== false ? bool(a) : bool(b), op);
    case "<"  : return wrap_op_result("bool", num(a) < num(b), op);
    case ">"  : return wrap_op_result("bool", num(a) > num(b), op);
    case "<=" : return wrap_op_result("bool", num(a) <= num(b), op);
    case ">=" : return wrap_op_result("bool", num(a) >= num(b), op);
    case "==" : return wrap_op_result("bool", equal(), op);
    case "!=" : return wrap_op_result("bool", !equal(), op);
    case "=<" :
    case "=>" :
    case "=!" : error.operator_reverse_order(op);
  }
  error.operator_cannot_apply(op);
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
    error.argument_number_check(args, arguments, expr);
    for (var i = 0; i < args.length; ++i){
      error.argument_check(args[i], arguments[i]);
      scope.def(args[i].name, wrap(args[i].type, arguments[i].value, args[i]));
    }
    return evaluate(expr.body, scope);
  }
  env.def(expr.name, wrap("function", lambda, expr));
  return lambda;
}

function indexing(expr, env) {
  var array = evaluate(expr.value, env);
  var index = evaluate(expr.index, env);
  error.check_indexing(array, index);
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
