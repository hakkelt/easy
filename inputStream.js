module.exports = {
  InputStream: InputStream
}
function InputStream(input) {
  var pos = 0, line = 1, col = 0;
  return {
    next  : next,
    peek  : peek,
    eof   : eof,
    pos   : getPosition,
  };
  function read(pos) {
    input.substring(pos.begin.pos, pos.end.pos);
  }
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
  function getPosition() {
    return {
      line : line,
      col  : col,
      pos  : pos
    }
  }
}
