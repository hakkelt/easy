function InputStream(input) {
    var pos = 0, line = 1, col = 0;
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : croak,
        line  : getLine,
        col   : getColumn
    };
    function next() {
        var ch = input.charAt(pos++);
        if (ch == "\n") line++, col = 0; else col++;
        return ch;
    }
    function peek(offset=0) {
        return input.charAt(pos+offset);
    }
    function eof() {
        return peek() == "";
    }
    function croak(msg) {
        throw new Error(msg + " (" + line + ":" + col + ")");
    }
    function getLine() {
      return line;
    }
    function getColumn() {
      return col;
    }
}

function TokenStream(input) {
    var current = null;
    var double_keywords_begin = " else end ";
    var variable_types = " array number string bool ";
    var variable_types_plural = " arrays numbers strings bools ";
    var structural_keywords = " if then function while variables of ";
    var op_keywords = " and or not ";
    var bool_literals = " true false ";
    var keywords = double_keywords_begin + variable_types + variable_types_plural
        + structural_keywords + op_keywords + bool_literals;
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : input.croak,
        line  : input.line,
        col   : input.col
    };
    function is_keyword(x) {
        return keywords.indexOf(" " + x.toLowerCase() + " ") >= 0;
    }
    function is_digit(ch) {
        return /[0-9]/i.test(ch);
    }
    function is_id_start(ch) {
        return /[a-z_]/i.test(ch);
    }
    function is_id(ch) {
        return is_id_start(ch) || is_digit(ch);
    }
    function is_op_char(ch) {
        return "+-*/%&=<>!←".indexOf(ch) >= 0;
    }
    function is_punc(ch) {
        return ":,()[]\n".indexOf(ch) >= 0;
    }
    function is_whitespace(ch) {
        return " \t".indexOf(ch) >= 0;
    }
    function read_while(predicate) {
        var str = "";
        while (!input.eof() && predicate(input.peek()))
            str += input.next();
        return str;
    }
    function read_number() {
        var line = input.line();
        var col  = input.col();
        var has_dot = false;
        var number = read_while(function(ch){
            if (ch == ".") {
                if (has_dot) return false;
                has_dot = true;
                return true;
            }
            return is_digit(ch);
        });
        return {
            type      : "number",
            value     : parseFloat(number),
            dimension : 0,
            line      : line,
            col       : col
        };
    }
    function read_ident() {
        var line = input.line();
        var col  = input.col();
        var id = read_while(is_id);
        var ret = {
            type      : is_kw_op(id) ? "op" : (is_keyword(id) ? "kw" : "var"),
            value     : double_keyword(id),
            line      : line,
            col       : col
        };
        if (!is_keyword(id))
            ret.dimension = 0;
        return ret;
    }
    function read_escaped(end) {
        var escaped = false, str = "";
        input.next();
        while (!input.eof()) {
            var ch = input.next();
            if (escaped) {
                str += ch;
                escaped = false;
            } else if (ch == "\\") {
                escaped = true;
            } else if (ch == end) {
                break;
            } else {
                str += ch;
            }
        }
        return str;
    }
    function read_string() {
        var line = input.line();
        var col  = input.col();
        return {
            type      : "string",
            value     : read_escaped('"'),
            dimension : 0,
            line      : line,
            col       : col
        };
    }
    function skip_comment() {
        read_while(function(ch){ return ch != "\n" });
        input.next();
    }
    function is_kw_op(token) {
        return op_keywords.indexOf(" " + token + " ") >= 0;
    }
    function double_keyword(kw) {
        if (double_keywords_begin.indexOf(" " + kw.toLowerCase() + " ") == -1)
            return kw;
        var next;
        do {
          next = input.peek();
        } while (is_whitespace(next) && input.next());
        if (kw.toLowerCase() == "else") {
            if (next == "\n")
                return kw;
            next = read_next();
            if (next.value.toLowerCase() == "if")
                return kw + " " + next.value;
            else
                input.croak("Keyword 'if' or linebreak is expected after keyword 'else', but got " + next.value);
        }
        next = read_next();
        if (kw.toLowerCase() == "end")
            if (["if", "while", "function"].indexOf(next.value.toLowerCase()) >= 0)
                return kw + " " + next.value.toLowerCase();
            else
                input.croak("Keyword 'end' must be followed by either one of the following: if, while, function");
    }
    function read_next() {
        read_while(is_whitespace);
        if (input.eof()) return null;
        var ch = input.peek();
        if (ch == "/" && input.peek(1) == "/") {
            skip_comment();
            return read_next();
        }
        if (ch == '"') return read_string();
        if (is_digit(ch)) return read_number();
        if (is_id_start(ch)) return read_ident();
        var line = input.line();
        var col  = input.col();
        if (is_punc(ch)) return {
            type  : "punc",
            value : input.next(),
            line  : line,
            col   : col
        };
        if (is_op_char(ch)) {
          var op = read_while(is_op_char);
          if (op == "=")
              input.croak("Ambigous operator: \"=\" (use \"←\" for assignment and \"==\" for equality check)")
          return {
            type  : "op",
            value : op,
            line  : line,
            col   : col
          };
        }
        input.croak("Can't handle character: " + ch);
    }
    function peek() {
        return current || (current = read_next());
    }
    function next() {
        var tok = current;
        current = null;
        return tok || read_next();
    }
    function eof() {
        return peek() == null;
    }
}

function parse(input) {
    var PRECEDENCE = {
        "←": 1,
        "or": 2,
        "and": 3,
        "&" : 4,
        "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };
    var VAR_TYPES = " number string bool array ";
    var FALSE = {
        type      : "bool",
        value     : false,
        dimension : 0,
        line      : input.line(),
        col       : input.col()
    };
    return parse_toplevel();
    function is_punc(ch) {
        var tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }
    function is_kw(kw) {
        var tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value.toLowerCase() == kw) && tok;
    }
    function is_op(op) {
        var tok = input.peek();
        return tok && tok.type == "op" && (!op || tok.value.toLowerCase() == op) && tok;
    }
    function skip_punc(ch, optional=false) {
        if (is_punc(ch)) {
            input.next();
            return true;
        }
        else if (!optional){
            if (ch == "\n") ch = "newline";
            input.croak("Expecting punctuation: \"" + ch + "\"");
        }
        else
            return false;
    }
    function skip_kw(kw, optional=false) {
        if (is_kw(kw)) {
            input.next();
            return true;
        }
        else if (!optional)
            input.croak("Expecting keyword: \"" + kw + "\"");
        else
            return false;
    }
    function skip_op(op) {
        if (is_op(op)) input.next();
        else input.croak("Expecting operator: \"" + op + "\"");
    }
    function unexpected() {
        input.croak("Unexpected token: " + format(input.peek()));
    }
    function delimited(start, stop, separator, parser) {
        var a = [], first = true;
        if (start) skip_punc(start);
        while (!input.eof()) {
            if (is_punc(stop)) break;
            if (first) first = false; else skip_punc(separator);
            if (is_punc(stop)) break;
            a.push(parser());
        }
        skip_punc(stop);
        return a;
    }
    function parse_call(func) {
        return {
            type : "call",
            func : func,
            line : input.line(),
            col  : input.col(),
            args : delimited("(", ")", ",", parse_expression)
        };
    }
    function parse_new_var() {
      skip_punc(":");
      var ret = {
        type : "new_var",
        vars : [],
        line : input.line(),
        col  : input.col()
      };
      while (true) {
        skip_punc("\n", true);
        ret.vars.push(parse_varline());
        if (!skip_punc(",", true)) return ret;
      }
    }
    function plural_to_singular(type) {
        if (type.value.endsWith("s")) type.value = type.value.slice(0, -1);
        return type;
    }
    function parse_varline() {
      var names = delimited(null, ":", ",", parse_varname);
      var type = plural_to_singular(input.next());
      if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
          input.croak("Expecting variable type name");
      var dimension = 0;
      while (type.value.toLowerCase() == "array") {
          skip_kw("of");
          type = plural_to_singular(input.next());
          if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
            input.croak("Expecting variable type name ");
          dimension++;
      }
      return {
          names      : names,
          dimension  : dimension,
          type       : type.value.toLowerCase(),
          line       : input.line(),
          col        : input.col()
      };
    }
    function parse_varname() {
        var name = input.next();
        if (name.type != "var") input.croak("Expecting variable name");
        return name.value;
    }
    function delimited_kw(start, stop, parser) {
        var a = [];
        if (start) skip_kw(start);
        while (!input.eof()) {
            if (skip_punc("\n", true)) continue;
            for (var i = 0; i < stop.length; i++)
              if (is_kw(stop[i])) return a;
            a.push(parser());
        }
        return a;
    }
    function read_block(start, stop, parser) {
        var line = input.line();
        var prog = delimited_kw(start, stop, parser);
        if (prog.length == 0)
            input.croak("Execting at least one expression inside the " + stop + " block");
        return { type: "prog", prog: prog, line: line, col: null };
    }
    function parse_if() {
        var ret = {
            type: "if",
            cond: [],
            then: [],
            line: input.line(),
            col : null
        };
        do {
            ret.cond.push(parse_expression());
            skip_kw("then");
            skip_punc("\n");
            ret.then.push(read_block(null, ["else if", "else", "end if"], parse_expression));
        } while (skip_kw("else if", true));
        if (skip_kw("else") && skip_punc("\n"))
            ret.else = read_block(null, ["end if"], parse_expression);
        skip_kw("end if")
        skip_punc("\n");
        return ret;
    }
    function parse_while() {
        var ret = {
            type: "while",
            line: input.line(),
            col : null,
            cond: parse_expression(),
            body: read_block(null, ["end while"], parse_expression)
        };
        skip_kw("end while");
        return ret;
    }
    function parse_function() {
        var name = input.next();
        if (name.type != "var") input.croak("Expecting function name");
        var ret = {
            type : "function",
            name : name.value,
            line : input.line(),
            col  : input.col(),
            vars : delimited("(", ")", ",", parse_varname),
            body : read_block(null, ["end function"], parse_expression)
        };
        skip_kw("end function");
        return ret;
    }
    function parse_bool() {
        return {
            type      : "bool",
            value     : input.next().value == "true",
            dimension : 0,
            line      : input.line(),
            col       : input.col()
        };
    }
    function maybe_binary(left, my_prec) {
        var tok = is_op();
        if (tok) {
            var his_prec = PRECEDENCE[tok.value];
            if (his_prec > my_prec) {
                input.next();
                return maybe_binary({
                    type     : tok.value == "←" ? "assign" : "binary",
                    operator : tok.value,
                    line     : input.line(),
                    col      : input.col(),
                    left     : left,
                    right    : maybe_binary(parse_atom(), his_prec)
                }, my_prec);
            }
        }
        return left;
    }
    function maybe_call(expr) {
        expr = expr();
        return is_punc("(") ? parse_call(expr) : expr;
    }
    function parse_array_def() {
        var line  = input.line();
        var col   = input.col();
        var value = delimited(null, "]", ",", parse_expression);
        for (var i = 0; i < value.length; i++)
            if (value[i].dimension != value[0].dimension)
                croak("Inconsistent array definition: current element is " +
                  (value[i].dimension == 1 ? "array" :
                    (value[i].dimension > 0 ? value[i].dimension + "D array" : "scalar value"))
                   + ", but previous elements was " +
                     (value[0].dimension == 1 ? "arrays" :
                       (value[0].dimension > 0 ? value[0].dimension + "D arrays" : "scalar values")),
                      value[0]);
        return {
            type      : "new_array",
            line      : line,
            col       : col,
            value     : value,
            dimension : value[0].dimension + 1
        };
    }
    function maybe_array(token) {
        if (skip_punc("[", true)) {
            var ret = {
                type  : "indexing",
                array : token,
                line  : input.line(),
                col   : input.col(),
                index : parse_expression()
            };
            skip_punc("]");
            return maybe_array(ret);
        }
        return token;
    }
    function parse_atom() {
        return maybe_call(function(){
            if (skip_punc("(", true)) {
                var exp = parse_expression();
                skip_punc(")");
                return exp;
            }
            if (skip_punc("[", true)) return parse_array_def();
            if (skip_kw("variables", true)) return parse_new_var();
            if (skip_kw("if", true)) return parse_if();
            if (skip_kw("while", true)) return parse_while();
            if (is_kw("true") || is_kw("false")) return parse_bool();
            if (skip_kw("function", true)) return parse_function();
            var tok = input.next();
            if (tok.type == "var" || tok.type == "number" || tok.type == "string")
                return maybe_array(tok);
            unexpected();
        });
    }
    function parse_toplevel() {
        var prog = [];
        while (!input.eof()) {
            prog.push(parse_expression());
            while(!input.eof() && skip_punc("\n", true));
        }
        return { type: "prog", prog: prog, line: 1, col: null };
    }
    function parse_expression() {
        return maybe_call(function(){
            return maybe_binary(parse_atom(), 0);
        });
    }
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
}
Environment.prototype = {
    extend: function() {
        return new Environment(this);
    },
    lookup: function(name) {
        var scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name.toLowerCase()))
                return scope;
            scope = scope.parent;
        }
    },
    get: function(name) {
        if (name.value.toLowerCase() in this.vars){
            if (!this.vars[name.value.toLowerCase()])
                croak("Variable not initialized: " + name.value, name);
            return this.vars[name.value.toLowerCase()];
        }
        croak("Undefined variable " + name.value, name);
    },
    set: function(name, value) {
        var scope = this.lookup(name.toLowerCase());
        if (!scope && this.parent)
            croak("Undefined variable " + name, exp);
        var variable = (scope || this).vars[name.toLowerCase()];
        if (variable.dimension !== value.dimension) {
            if (value.type == "string") value.value = "\"" + value.value + "\"";
            croak("Dimension mismatch: Variable '" + name + "' is " +
              (variable.dimension == 0 ? variable.type :
                (variable.dimension > 1 ? variable.dimension + "D " : "") + "array")
              + " and '" + value.value + "' is " +
                (value.dimension == 0 ? value.type :
                  (value.dimension > 1 ? value.dimension + "D " : "") + "array "), variable);
        }
        if (variable.type !== value.type) {
            if (value.type == "string") value.value = "\"" + value.value + "\"";
            croak("Type mismatch: Variable '" + name + "' is type of '" + variable.type
              + "' and '" + format(value.value) + "' is type of '" + value.type + "'", value);
        }
        return (scope || this).vars[name.toLowerCase()] = value;
    },
    def: function(name, value) {
        if (Object.prototype.hasOwnProperty.call(this.vars, name.toLowerCase())) {
            if (value.type !== "function") type = "variable";
            croak("Re-definition of " + type + " " + name, value);
        }
        var ret = this.vars[name.toLowerCase()] = {
          type      : value.type,
          value     : value.value,
          dimension : value.dimension,
          line      : value.line,
          col       : value.col
        };
        if (value.dimension)
            ret.dimension = value.dimension;
        return ret;
    }
};

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
                croak("Type mismatch: '" + format(new_value.value) + "' is type of " +
                  new_value.type + ", but previous values was type of " + type, expr);
            else
                type = new_value.type;
            value.push(new_value.value);
        });
        var ret = wrap(type, value, exp);
        return ret;

      case "assign":
        if (exp.left.type != "var")
            croak("Cannot assign to " + format(exp.left), exp);
        return env.set(exp.left.value, evaluate(exp.right, env));

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
        croak("I don't know how to evaluate " + exp.type, exp);
    }
}

function apply_op(op, a, b) {
    function num(x) {
        if (x.type !== "number")
            croak("Expected number, but got " + x.type + " (" + format(x.value) + ")", x);
        return x.value;
    }
    function div(x) {
        if (num(x) == 0)
            croak("Divide by zero", x);
        return x.value;
    }
    function bool(x) {
        if (x.type !== "bool")
            croak("Expected bool, but got " + x.type + " (" + format(x.value) + ")", x);
        return x.value;
    }
    function string(x) {
        if (x.type !== "string"){
            croak("Expected bool, but got " + x.type + " (" + format(x.value) + ")", x);
        }
        return x.value;
    }
    function wrap_op_result(type, value, expr) {
        return {
            type      : type,
            value     : value,
            dimension : 0,
            line      : expr.line,
            col       : null
        };
    }
    if (a.dimension > 0)
        croak("Operator '" + op.operator + "' can not be applied on arrays and '" + format(a.value) + "' is an array", a)
    if (b.dimension > 0)
        croak("Operator '" + op.operator + "' can not be applied on arrays and '" + format(b.value) + "' is an array", b)
    switch (op.operator) {
      case "+"  : return wrap_op_result("number", num(a) + num(b), op);
      case "-"  : return wrap_op_result("number", num(a) - num(b), op);
      case "*"  : return wrap_op_result("number", num(a) * num(b), op);
      case "/"  : return wrap_op_result("number", num(a) / num(b), op);
      case "%"  : return wrap_op_result("number", num(a) % num(b), op);
      case "&"  : return wrap_op_result("string", string(a) + string(b), op);
      case "not": return wrap_op_result("bool", !bool(a), op);
      case "and": return wrap_op_result("bool", bool(a) !== false && bool(b), op);
      case "or" : return wrap_op_result("bool", bool(a) !== false ? bool(a) : bool(b), op);
      case "<"  : return wrap_op_result("bool", num(a) < num(b), op);
      case ">"  : return wrap_op_result("bool", num(a) > num(b), op);
      case "<=" : return wrap_op_result("bool", num(a) <= num(b), op);
      case ">=" : return wrap_op_result("bool", num(a) >= num(b), op);
      case "==" : return wrap_op_result("bool", a.value === b.value, op);
      case "!=" : return wrap_op_result("bool", a.value !== b.value, op);
      case "=<" : croak("Wrong operator: =< (use it in reverse order: <=)", op);
      case "=>" : croak("Wrong operator: => (use it in reverse order: >=)", op);
      case "=!" : croak("Wrong operator: =! (use it in reverse order: !=)", op);
    }
    croak("Can't apply operator " + op, op);
}

function wrap(type, value, expr=null) {
  var ret = {
      type      : type,
      value     : value,
      line      : expr ? expr.line : null,
      col       : null
  };
  if (expr)
      ret.dimension = (expr.dimension ? expr.dimension : 0);
  return ret;
}

function make_function(env, exp) {
    function lambda() {
        var names = exp.vars;
        var scope = env.extend();
        if (arguments.length != names.length)
            croak("Calling function \"" + exp.name + "\" with improper number of arguments", exp);
        for (var i = 0; i < names.length; ++i){
            scope.def(names[i], wrap(arguments[i].type, arguments[i].value, exp));
        }
        return evaluate(exp.body, scope);
    }
    env.def(exp.name, wrap("function", lambda, exp));
    return lambda;
}

function indexing(exp, env) {
    var index = evaluate(exp.index, env);
    if (index.type != "number")
        croak("Indexing is possible only with numbers, and '" +
          format(exp.index.value) + "' is type of " + exp.index.type, exp);
    if (index.dimension != 0)
        croak("Indexing is possible only with scalar, and '" +
          format(exp.index.value) + "' is " +
          (exp.index.dimension == 1 ? "array" : exp.index.dimension + "D array"), exp);
    var array = evaluate(exp.array, env);
    if (array.dimension == 0)
        croak("Only arrays can be indexed, and '" + exp.array.value + "' is not an array", exp.array)
    return {
        type      : array.type,
        dimension : array.dimension - 1,
        value     : array.value[index.value],
        line      : array.line,
        col       : array.col
    }
}

function croak(msg, exp) {
    throw new Error(msg + " (" + exp.line + ":" + null + ")");
}

function print_ast(ast) {
	const util = require('util')
	console.log(util.inspect(ast, {showHidden: false, depth: null}))
}

/* -----[ entry point for NodeJS ]----- */

var globalEnv = new Environment();

function format(value, is_error_message=true) {
    if (value.constructor === Array ||
      (is_error_message && typeof value === "string") ||
      typeof value === 'object')
        return JSON.stringify(value);
    return value.toString();
}

function add_function(name, func) {
  globalEnv.def(name, wrap("function", func));
}

if (typeof process != "undefined") (function(){
    var util = require("util");
    add_function("printline", function(){
        for (i = 0; i < arguments.length; i++){
            process.stdout.write(format(arguments[i].value, false));
            if (i < arguments.length - 1)
                process.stdout.write(" ");
        }
        process.stdout.write("\n");
    });
    add_function("print", function(){
        for (i = 0; i < arguments.length; i++){
            process.stdout.write(format(arguments[i].value, false));
            if (i < arguments.length - 1)
                process.stdout.write(" ");
        }
    });
    var code = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", function(){
        var chunk = process.stdin.read();
        if (chunk) code += chunk;
    });
    process.stdin.on("end", function(){
        var ast = parse(TokenStream(InputStream(code)));
        print_ast(ast);
        evaluate(ast, globalEnv);
        print_ast(globalEnv);
    });
})();
