module.exports = {
    printline: printline,
    print : print
}

function printline(){
    for (i = 0; i < arguments.length; i++){
        process.stdout.write(format(arguments[i].value, false));
        if (i < arguments.length - 1)
            process.stdout.write(" ");
    }
    process.stdout.write("\n");
}
function print(){
    for (i = 0; i < arguments.length; i++){
        process.stdout.write(format(arguments[i].value, false));
        if (i < arguments.length - 1)
            process.stdout.write(" ");
    }
}

function format(value) {
    if (value.constructor === Array)
        return JSON.stringify(value);
    return value.toString();
}
