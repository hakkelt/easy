var error = require("./error");
module.exports = {
    Environment : Environment
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
}
Environment.prototype = {
    extend: function() {
        return new Environment(this);
    },
    lookup: function(name) {
        var scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name.toLowerCase()))
                return scope;
            scope = scope.parent;
        }
    },
    get: function(name) {
        if (name.value.toLowerCase() in this.vars){
            if (!this.vars[name.value.toLowerCase()])
                error.croak("Variable not initialized: " + name.value, name);
            return this.vars[name.value.toLowerCase()];
        }
        error.croak("Undefined variable " + name.value, name);
    },
    set: function(name, value, pos) {
        var scope = this.lookup(name.value.toLowerCase());
        if (!scope && this.parent)
            error.croak("Undefined variable " + name.value, exp);
        var variable = (scope || this).vars[name.value.toLowerCase()];
        if (variable.dimension !== value.dimension) {
            if (value.type == "string") value.value = "\"" + value.value + "\"";
            error.croak("Dimension mismatch: Variable '" + name.value + "' is " +
              (variable.dimension == 0 ? variable.type :
                (variable.dimension > 1 ? variable.dimension + "D " : "") + "array")
              + " and '" + value.value + "' is " +
                (value.dimension == 0 ? value.type :
                  (value.dimension > 1 ? value.dimension + "D " : "") + "array "), pos);
        }
        if (variable.type !== value.type)
            error.croak("Type mismatch: Variable '" + name.value + "' is type of '" + variable.type
              + "' and '" + format(value.value) + "' is type of '" + value.type + "'", pos);
        return (scope || this).vars[name.value.toLowerCase()] = value;
    },
    def: function(name, value) {
        if (Object.prototype.hasOwnProperty.call(this.vars, name.toLowerCase())) {
            if (value.type !== "function") type = "variable";
            error.croak("Re-definition of " + type + " " + name, value);
        }
        var ret = this.vars[name.toLowerCase()] = {
          type      : value.type,
          value     : value.value,
          dimension : value.dimension,
          line      : value.line,
          col       : value.col
        };
        if (value.dimension)
            ret.dimension = value.dimension;
        return ret;
    }
}
