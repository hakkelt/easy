module.exports = {
    printline: function(){
        for (i = 1; i < arguments.length; i++){
            process.stdout.write(format(arguments[i].value, false));
            if (i < arguments.length - 1)
                process.stdout.write(" ");
        }
        process.stdout.write("\n");
    },
    print : function(){
        for (i = 1; i < arguments.length; i++){
            process.stdout.write(format(arguments[i].value, false));
            if (i < arguments.length - 1)
                process.stdout.write(" ");
        }
    },
}

function format(value) {
    if (value.constructor === Array)
        return JSON.stringify(value);
    return value.toString();
}
