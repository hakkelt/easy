var error = require("./error").environment;
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
    var scope = this.lookup(name.value.toLowerCase());
    error.check_if_defined(name, scope);
    error.check_if_initialized(name, this);
    return this.vars[name.value.toLowerCase()];
  },
  set: function(name, value, pos) {
    var scope = this.lookup(name.value.toLowerCase());
    error.check_if_defined(name, scope);
    var variable = (scope || this).vars[name.value.toLowerCase()];
    error.check_array_type(name, variable, value);
    return (scope || this).vars[name.value.toLowerCase()] = value;
  },
  def: function(name, value) {
    error.check_redefinition(name, this, value.position);
    this.vars[name.toLowerCase()] = {
      type      : value.type,
      value     : value.value,
      dimension : value.dimension,
      position  : value.position
    };
    if (value.dimension)
        this.vars[name.toLowerCase()].dimension = value.dimension;
    return null;
  }
}
