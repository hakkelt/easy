function wrap(type, value) {
  return {
      type      : type,
      value     : value,
      line      : null,
      col       : null
  };
}
// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' path_of_your_program');
  process.exit(1);
}
// Read the file and print its contents.
var fs = require('fs'), filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, code) {
  if (err) throw err;
	var env = require("./environment");
	var globalEnv = new env.Environment();
	function add_function(name, func) {
		globalEnv.def(name, wrap("function", func));
	}
	var func = require("./functions");
	add_function("printline", func.printline);
	add_function("print", func.print);
	add_function("read", func.read);
	var i = require("./inputStream");
	var t = require("./tokenStream");
	var p = require("./parser");
	var e = require("./evaluate");
	var ast = p.parse(t.TokenStream(i.InputStream(code)));
	e.evaluate(ast, globalEnv);
	const fs = require('fs');
	const util = require('util');
	const content = util.inspect(e.logger.log, {showHidden: false, depth: null});

	fs.writeFile("logger.txt", content, 'utf8', function (err) {
	    if (err) {
	        return console.log(err);
	    }

	    console.log("The file was saved!");
	});
});
