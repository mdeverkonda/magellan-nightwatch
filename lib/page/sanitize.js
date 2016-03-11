var path = require("path"),
  fs = require("fs"),
  Q = require("q"),
  _ = require("lodash");

module.exports = function sanitize(client) {
  var deferred = Q.defer();

  if (!client.globals.test_settings.page_objects_path) {
    // how come this is possible, no page object path but have page object bound
    deferred.resolve();
  } else {
    deferred.resolve();
  }

  return deferred.promise;
};
