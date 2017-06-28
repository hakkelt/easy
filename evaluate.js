var error = require("./error");
module.exports = {
    evaluate: evaluate
}
function evaluate(exp, env) {
    switch (exp.type.toLowerCase()) {
      case "number":
      case "string":
      case "bool":
        return exp;

      case "var":
        return env.get(exp);

      case "new_var":
        var val = false;
        exp.vars.forEach(function(one_type) {
          one_type.names.forEach(function(var_name) {
            val = env.def(var_name, wrap(one_type.type, null, one_type))
          });
        });
        return val;

      case "new_array":
        var value = [];
        var type = null;
        exp.value.forEach(function(expr){
            var new_value = evaluate(expr, env);
            if (type && type != new_value.type)
                error.croak("Type mismatch: '" + error.format(new_value.value) + "' is type of " +
                  new_value.type + ", but previous values was type of " + type, expr);
            else
                type = new_value.type;
            value.push(new_value.value);
        });
        var ret = wrap(type, value, exp);
        return ret;

      case "assign":
        if (exp.left.type == "var")
            return env.set(exp.left, evaluate(exp.right, env), exp);
        if (exp.left.type == "indexing")
            return array_assign(exp, env);
        error.croak("Cannot assign to " + error.format(exp.left), exp);

      case "binary":
        var left  = evaluate(exp.left,  env);
        var right = evaluate(exp.right, env);
        return apply_op(exp,
                        wrap(left.type,  left.value,  left),
                        wrap(right.type, right.value, right));

      case "indexing":
        return indexing(exp, env);

      case "function":
        return make_function(env, exp);

      case "if":
        for (var i = 0; i < exp.cond.length; i++)
          if (evaluate(exp.cond[i], env).value != false)
            return evaluate(exp.then[i], env);
        return exp.else ? evaluate(exp.else, env) : false;

      case "while":
        while (evaluate(exp.cond, env).value)
        	evaluate(exp.body, env);
        return false;

      case "prog":
        var val = false;
        exp.prog.forEach(function(exp){
          val = evaluate(exp, env);
        });
        return val;

      case "call":
        var func = evaluate(exp.func, env).value;
        return func.apply(null, exp.args.map(function(arg){
            return evaluate(arg, env);
        }));

      default:
        error.croak("I don't know how to evaluate " + exp.type, exp);
    }
}

function apply_op(op, a, b) {
    function num(x) {
        if (x.type !== "number")
            error.croak("Expected number, but got " + x.type + " (" + error.format(x.value) + ")", x);
        return x.value;
    }
    function div(x) {
        if (num(x) == 0)
            error.croak("Divide by zero", x);
        return x.value;
    }
    function bool(x) {
        if (x.type !== "bool")
            error.croak("Expected bool, but got " + x.type + " (" + error.format(x.value) + ")", x);
        return x.value;
    }
    function string(x) {
        if (x.type !== "string"){
            error.croak("Expected bool, but got " + x.type + " (" + error.format(x.value) + ")", x);
        }
        return x.value;
    }
    function wrap_op_result(type, value, expr) {
        return {
            type      : type,
            value     : value,
            dimension : 0,
            line      : expr.line,
            col       : expr.col
        };
    }
    if (a.dimension > 0)
        error.croak("Operator '" + op.operator + "' can not be applied on arrays and '" + error.format(a.value) + "' is an array", a)
    if (b.dimension > 0)
        error.croak("Operator '" + op.operator + "' can not be applied on arrays and '" + error.format(b.value) + "' is an array", b)
    switch (op.operator) {
      case "+"  : return wrap_op_result("number", num(a) + num(b), op);
      case "-"  : return wrap_op_result("number", num(a) - num(b), op);
      case "*"  : return wrap_op_result("number", num(a) * num(b), op);
      case "/"  : return wrap_op_result("number", num(a) / num(b), op);
      case "%"  : return wrap_op_result("number", num(a) % num(b), op);
      case "&"  : return wrap_op_result("string", string(a) + string(b), op);
      case "and": return wrap_op_result("bool", bool(a) !== false && bool(b), op);
      case "or" : return wrap_op_result("bool", bool(a) !== false ? bool(a) : bool(b), op);
      case "<"  : return wrap_op_result("bool", num(a) < num(b), op);
      case ">"  : return wrap_op_result("bool", num(a) > num(b), op);
      case "<=" : return wrap_op_result("bool", num(a) <= num(b), op);
      case ">=" : return wrap_op_result("bool", num(a) >= num(b), op);
      case "==" : return wrap_op_result("bool", a.value === b.value, op);
      case "!=" : return wrap_op_result("bool", a.value !== b.value, op);
      case "=<" : error.croak("Wrong operator: =< (use it in reverse order: <=)", op);
      case "=>" : error.croak("Wrong operator: => (use it in reverse order: >=)", op);
      case "=!" : error.croak("Wrong operator: =! (use it in reverse order: !=)", op);
    }
    error.croak("Can't apply operator " + op, op);
}

function wrap(type, value, expr) {
  return {
      type      : type,
      value     : value,
      dimension : expr.dimension,
      line      : expr.line,
      col       : expr.col
  };
}

function make_function(env, exp) {
    function lambda() {
        var args = exp.vars;
        var scope = env.extend();
        if (arguments.length != args.length)
            error.croak("Calling function \"" + exp.name + "\" with improper number of arguments", exp);
        for (var i = 0; i < args.length; ++i){
            if (args[i].type !== arguments[i].type)
                error.croak("Type mismatch: Argument '" + args[i].name + "' of the function is type of "
                  + args[i].type + ", but a(n) " + arguments[i].type +
                  " (" + error.format(arguments[i].value) + ") is assigned to it", exp);
            if (args[i].dimension !== arguments[i].dimension)
                error.croak("Type mismatch: Argument '" + args[i].name + "' of the function is "
                  + (args[i].dimension > 0 ? args[i].dimension + "D array" : "scalar value") + ", but "
                  + (args[i].dimension > 0 ? args[i].dimension + "D array" : "scalar value") +
                  " is assigned to it", exp);
            scope.def(args[i].name, wrap(args[i].type, arguments[i].value, args[i]));
        }
        return evaluate(exp.body, scope);
    }
    env.def(exp.name, wrap("function", lambda, exp));
    return lambda;
}

function indexing(exp, env) {
    var index = evaluate(exp.index, env);
    if (index.type != "number")
        error.croak("Indexing is possible only with numbers, and '" +
          error.format(exp.index.value) + "' is type of " + exp.index.type, exp);
    if (index.dimension != 0)
        error.croak("Indexing is possible only with scalar, and '" +
          error.format(exp.index.value) + "' is " +
          (exp.index.dimension == 1 ? "array" : exp.index.dimension + "D array"), exp);
    var array = evaluate(exp.value, env);
    if (array.dimension == 0)
        error.croak("Only arrays can be indexed, and '" + exp.value.value + "' is not an array", exp.value);
    if (index.value < 0)
        error.croak("Index cannot be negative, but " + index.value + " is given");
    if (index.value >= array.value.length)
        error.croak("Index is out of range: Index is " + index.value +
            ", but the indexed array has only " + array.value.length + " elements", exp);
    return {
        type      : array.type,
        dimension : array.dimension - 1,
        value     : array.value[index.value],
        line      : array.line,
        col       : array.col
    }
}

function get_indices(exp, env, indices) {
    if (exp.type == "indexing")
        indices = get_indices(exp.value,env,indices);
    if (exp.index) indices.push(exp.index.value);
    return indices;
}

function get_array_name(exp) {
    while (exp.type != "var") exp = exp.value;
    return exp;
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
    return [before.concat(middle).concat(after)];
}

function array_assign(exp, env) {
    var left = evaluate(exp.left, env);
    var right = evaluate(exp.right, env);
    if (left.type !== right.type)
        error.croak("Type mismatch: Left side of the assignment is type of " + left.type
          + " and " + error.format(right.value) + " is type of " + right.type, exp);
    if (left.dimension !== right.dimension)
        error.croak("Dimension mismatch: Left side of the assignment is " +
          (left.dimension > 0 ? left.dimension + "D array" : "scalar value")
          + " and " + error.format(right.value) + " is " +
            (right.dimension > 0 ? right.dimension + "D array" : "scalar value"), exp);
    var indices    = get_indices(exp.left, env, []);
    var array_name = get_array_name(exp.left);
    var array      = env.get(array_name);
    var new_value  = set_element(array.value, indices, right.value);
    array.value = new_value;
    env.set(array_name,array, exp);
    return array;
}
