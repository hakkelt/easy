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
    var keywords = " if then else_if else end_if function end_function \
     true false while end_while var num string bool and or ";
    var op_keywords = " and or not ";
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : input.croak,
        line  : input.line,
        col   : input.col
    };
    function is_keyword(x) {
        return keywords.indexOf(" " + x + " ") >= 0;
    }
    function is_digit(ch) {
        return /[0-9]/i.test(ch);
    }
    function is_id_start(ch) {
        return /[a-z_]/i.test(ch);
    }
    function is_id(ch) {
        return is_id_start(ch) || "0123456789".indexOf(ch) >= 0;
    }
    function is_op_char(ch) {
        return "+-*/%=<>!←".indexOf(ch) >= 0;
    }
    function is_punc(ch) {
        return ":,(){}[]\n".indexOf(ch) >= 0;
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
        var has_dot = false;
        var number = read_while(function(ch){
            if (ch == ".") {
                if (has_dot) return false;
                has_dot = true;
                return true;
            }
            return is_digit(ch);
        });
        return { type: "num", value: parseFloat(number) };
    }
    function read_ident() {
        var id = read_while(is_id);
        return {
            type  : kw_op(id) ? "op" : (is_keyword(id) ? "kw" : "var"),
            value : id
        };
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
        return { type: "string", value: read_escaped('"') };
    }
    function skip_comment() {
        read_while(function(ch){ return ch != "\n" });
        input.next();
    }
    function kw_op(token) {
        return op_keywords.indexOf(" " + token + " ") >= 0;
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
        if (is_punc(ch)) return {
            type  : "punc",
            value : input.next()
        };
        if (is_op_char(ch)) {
          var op = read_while(is_op_char);
          if (op == "=")
              input.croak("Ambigous operator: \"=\" (use \"←\" for assignment and \"==\" for equality check)")
          return {
            type  : "op",
            value : op
          };
        }
        input.croak("Can't handle character: " + ch);
    }
    function peek() {
        return current || (current = appendPosition(read_next()));
    }
    function next() {
        var tok = current;
        current = null;
        return tok || appendPosition(read_next());
    }
    function eof() {
        return peek() == null;
    }
    function appendPosition(token) {
      if (!token) return null;
      token.line   = input.line();
      token.column = input.col();
      return token;
    }
}

function parse(input) {
    var PRECEDENCE = {
        "←": 1,
        "or": 2,
        "and": 3,
        "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };
    var VAR_TYPES = " num string bool ";
    var FALSE = { type: "bool", value: false };
    return parse_toplevel();
    function is_punc(ch) {
        var tok = input.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }
    function is_kw(kw) {
        var tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
    }
    function is_op(op) {
        var tok = input.peek();
        return tok && tok.type == "op" && (!op || tok.value == op) && tok;
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
        input.croak("Unexpected token: " + JSON.stringify(input.peek()));
    }
    function delimited(start, stop, separator, parser) {
        var a = [], first = true;
        if (start) skip_punc(start);
        while (!input.eof()) {
            if (is_punc(stop)) break;
            if (first) first = false; else skip_punc(separator);
            if (is_punc(stop)) break;
            //if (separator == "\n" && is_punc("\n")) continue;
            a.push(parser());
        }
        skip_punc(stop);
        return a;
    }
    function parse_call(func) {
        return {
            type : "call",
            func : func,
            args : delimited("(", ")", ",", parse_expression),
            line : input.line(),
            col  : input.col()
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
    function parse_varline() {
      var names = delimited(null, ":", ",", parse_varname);
      var type = input.next();
      if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value + " ") == -1)
        input.croak("Expecting variable type name");
      return {
        names : names,
        type  : type.value,
        line  : input.line(),
        col   : input.col()
      };
    }
    function parse_varname() {
        var name = input.next();
        if (name.type != "var") input.croak("Expecting variable name");
        return name.value;
    }
    function delimited_kw(start, stop, parser) {
      console.log(start, stop)
        var a = [];
        if (start) skip_kw(start);
        while (!input.eof()) {
            if (skip_punc("\n", true)) continue;
            for (var i = 0; i < stop.length; i++) {
              console.log(stop[i], ":", is_kw(stop[i]), " - ", input.peek());
              if (is_kw(stop[i])) {
                console.log("kilép");
                  return a;
              }
            }
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
            console.log("parse_if - else_if")
            ret.cond.push(parse_expression());
            ret.then.push(read_block("then", ["else_if", "else", "end_if"], parse_expression))
        } while (skip_kw("else_if", true));
        console.log("parse_if - after else_if")
        if (is_kw("else")){
            console.log("hékás!");
            ret.else = read_block("else", ["end_if"], parse_expression);
        }
        skip_kw("end_if");
        return ret;
    }
    function parse_while() {
        var ret = {
            type: "while",
            line: input.line(),
            col : null,
            cond: parse_expression(),
            body: read_block(null, ["end_while"], parse_expression)
        };
        skip_kw("end_while");
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
            body : read_block(null, ["end_function"], parse_expression)
        };
        skip_kw("end_function");
        return ret;
    }
    function parse_bool() {
        return {
            type  : "bool",
            value : input.next().value == "true",
            line  : input.line(),
            col   : input.col()
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
                    left     : left,
                    line     : input.line(),
                    col      : input.col(),
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
    function parse_atom() {
        return maybe_call(function(){
            if (skip_punc("(", true)) {
                var exp = parse_expression();
                skip_punc(")");
                return exp;
            }
            if (skip_kw("var", true)) return parse_new_var();
            if (skip_kw("if", true)) return parse_if();
            if (skip_kw("while", true)) return parse_while();
            if (is_kw("true") || is_kw("false")) return parse_bool();
            if (skip_kw("function", true)) return parse_function();
            var tok = input.next();
            if (tok.type == "var" || tok.type == "num" || tok.type == "string")
                return tok;
            unexpected();
        });
    }
    function parse_toplevel() {
        var prog = [];
        while (!input.eof()) {
            prog.push(parse_expression());
            console.log(input.peek());
            if (!input.eof()) skip_punc("\n");
        }
        return { type: "prog", prog: prog, line: 1, col: null };
    }
    function parse_expression() {
        return maybe_call(function(){
            while(skip_punc("\n", true));
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
            if (Object.prototype.hasOwnProperty.call(scope.vars, name))
                return scope;
            scope = scope.parent;
        }
    },
    get: function(name) {
        if (name.value in this.vars){
            if (!this.vars[name.value])
                croak("Variable not initialized: " + name.value, name);
            return this.vars[name.value];
        }
        croak("Undefined variable " + name.value, name);
    },
    set: function(name, value) {
        var scope = this.lookup(name);
        if (!scope && this.parent)
            croak("Undefined variable " + name, exp);
        var variable = (scope || this).vars[name];
        if (variable.type !== value.type)
            croak("Type mismatch: " + name + " is type of " + variable.type
              + " and " + value.value + " is type of " + value.type, value);
        return (scope || this).vars[name] = value;
    },
    def: function(name, value) {
        if (!!this.vars.length && name in this.vars){
            if (value.type !== "function") type = "variable";
            croak("Redefinition of " + type + " " + name, value);
        }
        return this.vars[name] = {
          type: value.type,
          value: value.value
        };
    }
};

function evaluate(exp, env) {
    switch (exp.type) {
      case "num":
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

      case "assign":
        if (exp.left.type != "var")
            croak("Cannot assign to " + JSON.stringify(exp.left), exp);
        return env.set(exp.left.value, evaluate(exp.right, env));

      case "binary":
        var left  = evaluate(exp.left,  env);
        var right = evaluate(exp.right, env);
        return apply_op(exp.operator,
                        wrap(left.type,  left.value,  exp),
                        wrap(right.type, right.value, exp));

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
        if (x.type !== "num"){
            if (x.type === "string") x.value = "\"" + x.value + "\"";
            croak("Expected number, but got " + x.value, x);
        }
        return x.value;
    }
    function div(x) {
        if (num(x) == 0)
            croak("Divide by zero", x);
        return x.value;
    }
    function bool(x) {
        if (x.type !== "bool"){
            if (x.type === "string") x.value = "\"" + x.value + "\"";
            croak("Expected bool, but got " + x.value, x);
        }
        return x.value;
    }
    switch (op) {
      case "+": return {type: "num", value: num(a) + num(b)};
      case "-": return {type: "num", value: num(a) - num(b)};
      case "*": return {type: "num", value: num(a) * num(b)};
      case "/": return {type: "num", value: num(a) / div(b)};
      case "%": return {type: "num", value: num(a) % div(b)};
      case "and": return {type: "bool", value: bool(a) !== false && bool(b)};
      case "or": return {type: "bool", value: bool(a) !== false ? bool(a) : bool(b)};
      case "<": return {type: "bool", value: num(a) < num(b)};
      case ">": return {type: "bool", value: num(a) > num(b)};
      case "<=": return {type: "bool", value: num(a) <= num(b)};
      case ">=": return {type: "bool", value: num(a) >= num(b)};
      case "==": return {type: "bool", value: a.value === b.value};
      case "!=": return {type: "bool", value: a.value !== b.value};
    }
    croak("Can't apply operator " + op, a);
}

function wrap(type, value, pos=null) {
  return {
      type  : type,
      value : value,
      line  : pos ? pos.line : null
  }
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

function croak(msg, exp) {
    throw new Error(msg + " (" + exp.line + ":" + null + ")");
}

function print_ast(ast) {
	const util = require('util')
	console.log(util.inspect(ast, {showHidden: false, depth: null}))
}

/* -----[ entry point for NodeJS ]----- */

var globalEnv = new Environment();

globalEnv.def("time", "function", function(func){
    try {
        console.time("time");
        return func();
    } finally {
        console.timeEnd("time");
    }
});

if (typeof process != "undefined") (function(){
    var util = require("util");
    globalEnv.def("println", wrap("function", function(val){
        process.stdout.write(val.value.toString() + '\n');
    }));
    globalEnv.def("print", wrap("function", function(val){
        process.stdout.write(val.value.toString());
    }));
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
    });
})();
