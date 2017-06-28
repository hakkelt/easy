function print_ast(ast) {
	const util = require('util')
	console.log(util.inspect(ast, {showHidden: false, depth: null}))
}

/* -----[ entry point for NodeJS ]----- */
var env = require("./environment");
var globalEnv = new env.Environment();

function add_function(name, func) {
  globalEnv.def(name, wrap("function", func));
}

function wrap(type, value) {
  return {
      type      : type,
      value     : value,
      line      : null,
      col       : null
  };
}

if (typeof process != "undefined") (function(){
    var func = require("./functions");
    add_function("printline", func.printline);
    add_function("print", func.print);
    var code = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", function(){
        var chunk = process.stdin.read();
        if (chunk) code += chunk;
    });
    process.stdin.on("end", function(){
        var i = require("./inputStream");
        var t = require("./tokenStream");
        var p = require("./parser");
        var e = require("./evaluate")
        var ast = p.parse(t.TokenStream(i.InputStream(code)));
        print_ast(ast);
        e.evaluate(ast, globalEnv);
        print_ast(globalEnv);
    });
})();
