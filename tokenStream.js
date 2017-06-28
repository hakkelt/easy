module.exports = {
    TokenStream: TokenStream
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
