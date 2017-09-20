var error = require("./error").TokenStream;
module.exports = {
  TokenStream: TokenStream
}

function TokenStream(input) {
  var current = null;
  const KW = require("./keywords");
  const op_char = "+-*/%=<>!←";
  const punctuation = ":,()[]\n";
  const whitespace = " \t";
  const id_start = new RegExp("[a-zA-ZÆÐƎƏƐƔĲŊŒẞÞǷȜæðǝəɛɣĳŋœĸſßþƿȝĄƁÇĐƊĘĦĮƘŁØƠŞȘŢȚŦŲƯY̨Ƴąɓçđɗęħįƙłøơşșţțŧųưy̨ƴÁÀÂÄǍĂĀÃÅǺĄÆǼǢƁĆĊĈČÇĎḌĐƊÐÉÈĖÊËĚĔĒĘẸƎƏƐĠĜǦĞĢƔáàâäǎăāãåǻąæǽǣɓćċĉčçďḍđɗðéèėêëěĕēęẹǝəɛġĝǧğģɣĤḤĦIÍÌİÎÏǏĬĪĨĮỊĲĴĶƘĹĻŁĽĿʼNŃN̈ŇÑŅŊÓÒÔÖǑŎŌÕŐỌØǾƠŒĥḥħıíìiîïǐĭīĩįịĳĵķƙĸĺļłľŀŉńn̈ňñņŋóòôöǒŏōõőọøǿơœŔŘŖŚŜŠŞȘṢẞŤŢṬŦÞÚÙÛÜǓŬŪŨŰŮŲỤƯẂẀŴẄǷÝỲŶŸȲỸƳŹŻŽẒŕřŗſśŝšşșṣßťţṭŧþúùûüǔŭūũűůųụưẃẁŵẅƿýỳŷÿȳỹƴźżžẓ_]", "i");
  var escape_dict = {
    "b" : "\b",
    "f" : "\f",
    "n" : "\n",
    "r" : "\r",
    "t" : "\t",
    "v" : "\v",
    "0" : "\0",
    "'" : "\'",
    "\"": "\"",
    "\\": "\\",
    "\n": "",
    " " : "skip",
    "\t": "skip"
  };

  return {
    next      : next,
    peek      : peek,
    eof       : eof,
    input     : input,
    begin_pos : getBeginPosition,
    get_pos   : wrapPosition
  };

  function is_keyword(x) {
    return KW.keywords.indexOf(x.toLowerCase()) >= 0;
  }
  function is_digit(ch) {
    return /[0-9]/i.test(ch);
  }
  function is_id_start(ch) {
    return id_start.test(ch);
  }
  function is_id(ch) {
    return is_id_start(ch) || is_digit(ch);
  }
  function is_op_char(ch) {
    return op_char.indexOf(ch) >= 0;
  }
  function is_kw_op(token) {
    return KW.operator_keywords.indexOf(token.toLowerCase()) >= 0;
  }
  function is_punc(ch) {
    return punctuation.indexOf(ch) >= 0;
  }
  function is_whitespace(ch) {
    return whitespace.indexOf(ch) >= 0;
  }
  function getBeginPosition() {
    read_while(is_whitespace);
    return input.pos();
  }
  function wrapPosition(begin) {
    return {
      begin : begin,
      end   : begin == input.prev_pos() ? input.pos() : input.prev_pos()
    };
  }
  function read_while(predicate) {
    var str = "";
    while (!input.eof() && predicate(input.peek()))
      str += input.next();
    return str;
  }
  function read_number() {
    var begin_pos = input.pos();
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
      position  : wrapPosition(begin_pos)
    };
  }
  function is_double_keyword(token) {
    return KW.double_keywords_begin.indexOf(token.toLowerCase()) >= 0;
  }
  function maybe_double_keyword(kw) {
    if (!is_double_keyword(kw)) return kw;
    read_while(is_whitespace)
    if (input.eof()) return null;
    var next_char = input.peek();
    if (kw.toLowerCase() == KW.ELSE){
      if (next_char == "\n")
        return kw;
      var next_kw = read_next();
      if (next_kw.value.toLowerCase() == KW.IF)
        return kw + " " + next_kw.value;
      error.after_else(next_kw);
    }
    var next_kw = read_next();
    if (kw.toLowerCase() == KW.END &&
      KW.double_keywords_ending.indexOf(next_kw.value.toLowerCase()) >= 0)
        return kw + " " + next_kw.value.toLowerCase();
    else
      error.after_end(next_kw);
  }
  function read_ident(begin_pos) {
    var id = read_while(is_id);
    var ret = {
      type     : is_kw_op(id) ? "op" : (is_keyword(id) ? "kw" : "var"),
      value    : maybe_double_keyword(id),
      position : wrapPosition(begin_pos)
    };
    if (! is_kw_op(id) && !is_keyword(id))
      ret.dimension = 0;
    return ret;
  }
  function escape(ch) {
    if (!(ch in escape_dict))
      error.not_known_escape_character(ch, wrapPosition(input.prev_pos));
    return escape_dict[ch];
  }
  function read_escaped(end) {
    var escaped = false, str = "", skipped = "", pos;
    input.next();
    while (!input.eof()) {
      var ch = input.next();
      if (escaped) {
        var esc = escape(ch);
        if (esc != "skip") {
          if (skipped != "" && ch != "n")
            error.not_known_escape_character(skipped, pos);
          str += esc;
          escaped = false;
        } else if (skipped == "") {
          skipped = ch;
          pos = wrapPosition(input.prev_pos());
        }
      } else if (ch == "\\")
        escaped = true;
      else if (ch == "\n")
        error.forbidden_new_line(wrapPosition(input.prev_pos()));
      else if (ch == end)
        break;
      else
        str += ch;
    }
    return str;
  }
  function read_string(begin_pos) {
    return {
      type      : KW.STRING,
      value     : read_escaped('"'),
      dimension : 0,
      position  : wrapPosition(begin_pos)
    };
  }
  function read_op(begin_pos) {
    var begin_pos = input.pos();
    var op = read_while(is_op_char);
    var position = wrapPosition(begin_pos);
    error.check_traditional_equal_sign(op, position);
    return {
      type     : "op",
      value    : op,
      position : position
    };
  }
  function read_punc(begin_pos) {
    return {
      type     : "punc",
      value    : input.next(),
      position : wrapPosition(begin_pos)
    };
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
    var begin_pos  = input.pos();
    if (ch == '"') return read_string(begin_pos);
    if (is_digit(ch)) return read_number(begin_pos);
    if (is_id_start(ch)) return read_ident(begin_pos);
    if (is_punc(ch)) return read_punc(begin_pos);
    if (is_op_char(ch)) return read_op(begin_pos);
    if (ch == "'") error.single_quote(wrapPosition(begin_pos));
    error.cannot_handle_character(ch, wrapPosition(begin_pos));
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
