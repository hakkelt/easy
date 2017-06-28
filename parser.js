var error = require("./error");
module.exports = {
    parse: parse
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
            input.error.croak("Expecting punctuation: \"" + ch + "\"");
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
            input.error.croak("Expecting keyword: \"" + kw + "\"");
        else
            return false;
    }
    function skip_op(op) {
        if (is_op(op)) input.next();
        else input.error.croak("Expecting operator: \"" + op + "\"");
    }
    function unexpected() {
        input.error.croak("Unexpected token: " + format(input.peek()));
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
      var col = input.col();
      var names = delimited(null, ":", ",", parse_varname);
      var type = plural_to_singular(input.next());
      if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
          input.error.croak("Expecting variable type name");
      var dimension = 0;
      while (type.value.toLowerCase() == "array") {
          skip_kw("of");
          type = plural_to_singular(input.next());
          if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
            input.error.croak("Expecting variable type name ");
          dimension++;
      }
      return {
          names      : names,
          dimension  : dimension,
          type       : type.value.toLowerCase(),
          line       : input.line(),
          col        : col
      };
    }
    function parse_varname() {
        var name = input.next();
        if (name.type != "var") input.error.croak("Expecting variable name");
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
            input.error.croak("Execting at least one expression inside the " + stop + " block");
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
        var line = input.line()
        var cond = parse_expression();
        skip_punc("\n");
        var ret = {
            type: "while",
            line: line,
            col : null,
            cond: cond,
            body: read_block(null, ["end while"], parse_expression)
        };
        skip_kw("end while");
        return ret;
    }
    function parse_argument() {
        var col = input.col();
        var name = parse_varname();
        skip_punc(":");
        var type = input.next();
        if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
            input.error.croak("Expecting variable type name");
        var dimension = 0;
        while (type.value.toLowerCase() == "array") {
            skip_kw("of");
            type = plural_to_singular(input.next());
            if (type.type != "kw" || VAR_TYPES.indexOf(" " + type.value.toLowerCase() + " ") == -1)
              input.error.croak("Expecting variable type name ");
            dimension++;
        }
        return {
            name       : name,
            dimension  : dimension,
            type       : type.value.toLowerCase(),
            line       : input.line(),
            col        : col
        };
    }
    function parse_function() {
        var name = input.next();
        if (name.type != "var") input.error.croak("Expecting function name");
        var ret = {
            type : "function",
            name : name.value,
            line : input.line(),
            col  : input.col(),
            vars : delimited("(", ")", ",", parse_argument),
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
                error.croak("Inconsistent array definition: current element is " +
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
                value : token,
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
