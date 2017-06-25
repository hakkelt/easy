function InputStream(input) {
    var pos = 0, line = 1, col = 0;
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : croak,
        line  : line
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
    function croak(msg, ast=null) {
        throw new Error(msg + " (" + line + ":" + col + ")");
    }
}

function TokenStream(input) {
    var current = null;
    var keywords =
    " if then else end_if function end_function true false while end_while var num string bool ";
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : input.croak
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
        return "+-*/%=&|<>!".indexOf(ch) >= 0;
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
            type  : is_keyword(id) ? "kw" : "var",
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
        if (is_op_char(ch)) return {
            type  : "op",
            value : read_while(is_op_char)
        };
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
        "=": 1,
        "||": 2,
        "&&": 3,
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
    function maybe_binary(left, my_prec) {
        var tok = is_op();
        if (tok) {
            var his_prec = PRECEDENCE[tok.value];
            if (his_prec > my_prec) {
                input.next();
                return maybe_binary({
                    type     : tok.value == "=" ? "assign" : "binary",
                    operator : tok.value,
                    left     : left,
                    right    : maybe_binary(parse_atom(), his_prec)
                }, my_prec);
            }
        }
        return left;
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
            type: "call",
            func: func,
            args: delimited("(", ")", ",", parse_expression),
        };
    }
    function parse_new_var() {
      skip_punc(":");
      var ret = {
        type: "new_var",
        vars: []
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
        names: names,
        type: type.value
      };
    }
    function parse_varname() {
        var name = input.next();
        if (name.type != "var") input.croak("Expecting variable name");
        return name.value;
    }
    function delimited_kw(start, stop, parser,optional_stop=null) {
        var a = [], first = true;
        if (start) skip_kw(start);
        while (!input.eof()) {
            if (skip_kw(stop, true) || (optional_stop && is_kw(optional_stop)))
              return a;
            if (first) first = false; else skip_punc("\n");
            if (skip_kw(stop, true) || (optional_stop && is_kw(optional_stop)))
              return a;
            if (is_punc("\n")) continue;
            a.push(parser());
        }
        return a;
    }
    function read_block(start, stop, parser, optional_stop=null) {
      var prog = delimited_kw(start, stop, parser, optional_stop);
      if (prog.length == 0)
        input.croak("Execting at least one expression inside the " + stop + " block");
      return (prog.length == 1) ? prog[0] : { type: "prog", prog: prog };
    }
    function parse_if() {
        var ret = {
            type: "if",
            cond: parse_expression(),
            then: read_block("then", "end_if", parse_expression, "else")
        };
        if (is_kw("else"))
            ret.else = read_block("else", "end_if", parse_expression);
        return ret;
    }
    function parse_while() {
        return {
            type: "while",
            cond: parse_expression(),
            body: read_block(null, "end_while", parse_expression),
        };
    }
    function parse_function() {
        var name = input.next();
        if (name.type != "var") input.croak("Expecting function name");
        return {
            type: "function",
            name: name.value,
            vars: delimited("(", ")", ",", parse_varname),
            body: read_block(null, "end_function", parse_expression)
        };
    }
    function parse_bool() {
        return {
            type  : "bool",
            value : input.next().value == "true"
        };
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
            if (!input.eof()) skip_punc("\n");
        }
        return { type: "prog", prog: prog };
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
        if (name in this.vars)
            if (!this.vars[name])
                throw new Error("Variable not initialized: " + name);
            return this.vars[name];
        throw new Error("Undefined variable " + name);
    },
    set: function(name, value) {
        var scope = this.lookup(name);
        if (!scope && this.parent)
            throw new Error("Undefined variable " + name);
        var variable = (scope || this).vars[name];
        if (variable.type != value.type)
            throw new Error("Type mismatch: " + name + " is type of " + variable.type
              + " and " + value.value + " is type of " + value.type);
        return (scope || this).vars[name] = value;
    },
    def: function(name, type, value) {
        if (this.vars[name]){
            if (type != "function") type = "variable";
            throw new Error("Redefinition of " + type + " " + name);
          }
        return this.vars[name] = {
          type: type,
          value: value
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
        return env.get(exp.value);

      case "new_var":
        var val = false;
        exp.vars.forEach(function(one_type) {
          one_type.names.forEach(function(var_name) {
            val = env.def(var_name, one_type.type, null)
          });
        });
        return val;

      case "assign":
        if (exp.left.type != "var")
            throw new Error("Cannot assign to " + JSON.stringify(exp.left));
        return env.set(exp.left.value, evaluate(exp.right, env));

      case "binary":
        return apply_op(exp.operator,
                        evaluate(exp.left, env),
                        evaluate(exp.right, env));

      case "function":
        return make_function(env, exp);

      case "if":
        var cond = evaluate(exp.cond, env).value;
        if (cond !== false) return evaluate(exp.then, env);
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
        throw new Error("I don't know how to evaluate " + exp.type);
    }
}

function apply_op(op, a, b) {
    function num(x) {
        if (x.type !== "num")
            throw new Error("Expected number but got " + x);
        return x.value;
    }
    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x.value;
    }
    switch (op) {
      case "+": return {type: "num", value: num(a) + num(b)};
      case "-": return {type: "num", value: num(a) - num(b)};
      case "*": return {type: "num", value: num(a) * num(b)};
      case "/": return {type: "num", value: num(a) / div(b)};
      case "%": return {type: "num", value: num(a) % div(b)};
      case "&&": return {type: "bool", value: a !== false && b};
      case "||": return {type: "bool", value: a !== false ? a : b};
      case "<": return {type: "bool", value: num(a) < num(b)};
      case ">": return {type: "bool", value: num(a) > num(b)};
      case "<=": return {type: "bool", value: num(a) <= num(b)};
      case ">=": return {type: "bool", value: num(a) >= num(b)};
      case "==": return {type: "bool", value: a === b};
      case "!=": return {type: "bool", value: a !== b};
    }
    throw new Error("Can't apply operator " + op);
}

function make_function(env, exp) {
    function lambda() {
        var names = exp.vars;
        var scope = env.extend();
        if (arguments.length != names.length)
          throw new Error("Calling function \"" + exp.name + "\" with improper number of arguments");
        for (var i = 0; i < names.length; ++i){
            scope.def(names[i], arguments[i].type, arguments[i].value);
          }
        return evaluate(exp.body, scope);
    }
    env.def(exp.name, "function", lambda);
    return lambda;
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
    globalEnv.def("println", "function", function(val){
        process.stdout.write(val.value.toString() + '\n');
    });
    globalEnv.def("print", "function", function(val){
        process.stdout.write(val.value.toString());
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
    });
})();
