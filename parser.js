var error = require("./error").parser;
module.exports = {
  parse: parse
}

function parse(input) {
  var KW = require("./keywords");
  var PRECEDENCE = {
    "←": 1, "<-": 1,
    "or": 2,
    "and": 3,
    "&" : 4,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
  };
  var FALSE = {
    type      : "bool",
    value     : false,
    dimension : 0,
    position  : getPositionByLength(5)
  };
  return parse_toplevel();
  function getPositionByLength(length) {
    var ret = {begin: input.begin_pos(), end: input.begin_pos()};
    ret.end.col += length;
    ret.end.pos += length;
    return ret;
  }
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
    if (is_punc(ch))
      { input.next(); return true; }
    else if (!optional)
      error.expecting_punctiation(ch,getPositionByLength(ch.length))
    else
      return false;
  }
  function skip_kw(kw, optional=false) {
    if (is_kw(kw))
      { input.next(); return true; }
    else if (!optional)
      error.expecting_keyword(kw,getPositionByLength(kw.length))
    else
      return false;
  }
  function skip_op(op) {
    if (is_op(op)) input.next();
    else error.expecting_operator(op,getPositionByLength(op.length))
  }
  function is_unary() {
    return is_op("-") || is_op(KW.NOT) ? true : false;
  }
  function parse_unary(begin_pos) {
    return {
      type     : "unary",
      operator : input.next().value,
      value    : parse_atom(),
      position : input.get_pos(begin_pos)
    }
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
    var begin_pos = input.begin_pos();
      return {
          type     : "call",
          func     : func,
          args     : delimited("(", ")", ",", parse_expression),
          position : input.get_pos(begin_pos)
      };
  }
  function parse_new_vars() {
    skip_punc(":");
    var begin_pos = input.begin_pos();
    var ret = {
      type     : "new_var",
      vars     : [],
      position : input.get_pos(begin_pos)
    };
    do {
      skip_punc("\n", true);
      ret.vars.push(parse_varline());
    } while (skip_punc(",", true));
    return ret;
  }
  function parse_varname() {
    var name = input.next();
    if (name.type != "var") error.expecting_var_name(name);
    return name.value;
  }
  function parse_var_type_name() {
    var type = input.next();
    if (type.value.toLowerCase().endsWith("s"))
      type.value = type.value.slice(0, -1);
    error.check_var_type_name(type);
    return type;
  }
  function parse_varline() {
    var begin_pos = input.begin_pos();
    var names = delimited(null, ":", ",", parse_varname);
    var type = parse_var_type_name();
    var dimension = 0;
    while (type.value.toLowerCase() == KW.ARRAY) {
      if (KW.OF) skip_kw(KW.OF);
      type = parse_var_type_name();
      dimension++;
    }
    return {
      names     : names,
      dimension : dimension,
      type      : type.value.toLowerCase(),
      position  : input.get_pos(begin_pos)
    };
  }
  function delimited_kw(start, stop, parser) {
    var a = [];
    if (start) skip_kw(start);
    while (!input.eof()) {
      if (is_punc("\n", true))
        a.push(newline());
      for (i = 0; i < stop.length; i++)
        if (is_kw(stop[i])) return a;
      a.push(parser());
      for (i = 0; i < stop.length; i++)
        if (is_kw(stop[i])) return a;
      skip_punc("\n");
    }
    return a;
  }
  function read_block(block_name, start, stop, parser) {
    var begin_pos = input.begin_pos();
    var prog = delimited_kw(start, stop, parser);
    error.check_prog_length(prog, block_name);
    return { type: "prog", prog: prog, position: input.get_pos(begin_pos) };
  }
  function parse_if(begin_pos) {
    var ret = {
      type: "if",
      cond: [],
      then: []
    };
    do {
      ret.cond.push(parse_expression());
      skip_kw(KW.THEN);
      skip_punc("\n");
      var block_name = ret.then.length > 0 ? KW.ELSEIF : KW.IF;
      ret.then.push(read_block(block_name, null, [KW.ELSEIF, KW.ELSE, KW.ENDIF], parse_expression));
    } while (skip_kw(KW.ELSEIF, true));
    if (skip_kw(KW.ELSE, true) && skip_punc("\n"))
      ret.else = read_block("if", null, [KW.ENDIF], parse_expression);
    skip_kw(KW.ENDIF);
    ret.position = input.get_pos(begin_pos);
    return ret;
  }
  function parse_while(begin_pos) {
    var cond = parse_expression();
    skip_punc("\n");
    var ret = {
        type     : "while",
        cond     : cond,
        body     : read_block(KW.WHILE, null, [KW.ENDWHILE], parse_expression),
        position : input.get_pos(begin_pos)
    };
    skip_kw(KW.ENDWHILE);
    return ret;
  }
  function parse_arguments() {
    var begin_pos = input.begin_pos();
    var name = parse_varname();
    skip_punc(":");
    var type = parse_var_type_name();
    var dimension = 0;
    while (type.value.toLowerCase() == KW.ARRAY) {
      if (KW.OF) skip_kw(KW.OF);
      type = parse_var_type_name();
      dimension++;
    }
    return {
      name      : name,
      dimension : dimension,
      type      : type.value.toLowerCase(),
      position  : input.get_pos(begin_pos)
    };
  }
  function parse_function(begin_pos) {
    var name = input.next();
    error.check_function_name(name);
    var vars = delimited("(", ")", ",", parse_arguments)
    skip_punc("\n")
    var ret = {
      type : "function",
      name : name.value,
      vars : vars,
      body : read_block(KW.FUNCTION, null, [KW.ENDFUNCTION], parse_expression)
    };
    skip_kw(KW.ENDFUNCTION);
    ret.position = input.get_pos(begin_pos);
    return ret;
  }
  function parse_bool(begin_pos) {
    return {
      type      : "bool",
      value     : input.next().value == "true",
      dimension : 0,
      position  : input.get_pos(begin_pos)
    };
  }
  function maybe_binary(left, my_prec) {
    var begin_pos = input.begin_pos();
    var tok = is_op();
    if (tok) {
      var his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        return maybe_binary({
          type     : (tok.value == "←" || tok.value == "<-") ? "assign" : "binary",
          operator : tok.value,
          left     : left,
          right    : maybe_binary(parse_atom(), his_prec),
          position : input.get_pos(begin_pos)
        }, my_prec);
      }
    }
    return left;
  }
  function maybe_call(expr) {
    expr = expr();
    return is_punc("(") ? parse_call(expr) : expr;
  }
  function parse_array_def(begin_pos) {
    var values = delimited(null, "]", ",", parse_expression);
    error.new_array_check_dimension(values)
    return {
      type      : "new_array",
      value     : values,
      dimension : values.length > 0 ? values[0].dimension + 1 : 0,
      position  : input.get_pos(begin_pos)
    };
  }
  function maybe_array(token) {
    var begin_pos = input.begin_pos();
    if (skip_punc("[", true)) {
      var ret = {
        type  : "indexing",
        value : token,
        index : parse_expression()
      };
      skip_punc("]");
      ret.position = input.get_pos(begin_pos);
      return maybe_array(ret);
    }
    return token;
  }
  function newline() {
    var begin_pos = input.begin_pos();
    while(skip_punc("\n", true));
    return {
      type: "newline",
      position: input.get_pos(begin_pos)
    }
  }
  function parse_atom() {
    return maybe_call(function(){
      if (skip_punc("(", true)) {
        var exp = parse_expression();
        skip_punc(")");
        return exp;
      }
      var begin_pos = input.begin_pos();
      if (is_unary()) return parse_unary(begin_pos);
      if (skip_punc("[", true)) return parse_array_def(begin_pos);
      if (is_kw("true") || is_kw("false")) return parse_bool(begin_pos);
      if (skip_kw("variables", true)) return parse_new_vars(begin_pos);
      if (skip_kw("if", true)) return parse_if(begin_pos);
      if (skip_kw("while", true)) return parse_while(begin_pos);
      if (skip_kw("function", true)) return parse_function(begin_pos);
      var token = input.next();
      if (token.type == "var" || token.type == "number" || token.type == "string")
        return maybe_array(token);
      error.unexpected_token(token);
    });
  }
  function parse_toplevel() {
    var begin_pos = input.begin_pos();
    var prog = [];
    while (!input.eof()) {
      if(is_punc("\n", true)) prog.push(newline());
      prog.push(parse_expression());
      skip_punc("\n");
    }
    return {
      type: "prog",
      prog: prog,
      position: input.get_pos(begin_pos)
    };
  }
  function parse_expression() {
    return maybe_call(function(){
      return maybe_binary(parse_atom(), 0);
    });
  }
}
