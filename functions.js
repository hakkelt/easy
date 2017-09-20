module.exports = {
    printline: function(){
      for (i = 0; i < arguments.length; i++){
        process.stdout.write(format(arguments[i].value, false));
        if (i < arguments.length - 1)
          process.stdout.write(" ");
      }
      process.stdout.write("\n");
      return null;
    },
    print : function(){
      for (i = 0; i < arguments.length; i++){
        process.stdout.write(format(arguments[i].value, false));
        if (i < arguments.length - 1)
          process.stdout.write(" ");
      }
      return null;
    },
    read : read,
}

function format(value) {
    if (value.constructor === Array)
        return JSON.stringify(value);
    return value.toString();
}
function read() {
  var readlineSync = require('readline-sync');
  command = readlineSync.prompt();
  return {
    type: "string",
    value: command,
    dimension: 0
  };
}
