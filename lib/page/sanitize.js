var path = require("path"),
  fs = require("fs"),
  Q = require("q"),
  _ = require("lodash");

var buildCommands = function buildCommands(prototype, client) {
  // only copy function to page object
  // two exceptions
  _.forIn(client, function (value, key) {
    if (typeof value === "function" || key === "verify" || key === "assert") {
      _.set(prototype, key, value);
    }
  });
};

var buildCustomizedCommands = function buildCustomizedCommands(prototype, commands) {
  // copy page object function
  _.each(commands, function (command) {
    _.forIn(command, function (value, key) {
      _.set(prototype, key, value);
    });
  })
};

var buildSections = function buildSections(prototype, sections) {
  _.set(prototype, "sections", sections)
};

var buildElements = function buildElements(prototype, elements) {
  _.set(prototype, "elements", elements);
};

var buildPageObject = function buildPageObject(client, pageobject) {
  /*
   *
   *
   *
   */

  var Base = function (client, pageobject) {
    this.url = pageobject.url;
    this.api = client;
    return this;
  };


  Base.prototype.navigate = function navigate(url) {
    var u = url;
    if (u === undefined) {
      if (typeof pageobject.url === "function") {
        u = this.url.bind(this)
          .call();
      } else {
        u = this.url;
      }
    }
    this.api.url(u);
    return this;
  };

  buildCommands(Base.prototype, client);
  buildCustomizedCommands(Base.prototype, pageobject.commands);
  buildSections(Base.prototype, pageobject.sections);
  buildElements(Base.prototype, pageobject.elements);

  return function () {
    return new Base(client, pageobject);
  };
};

module.exports = function sanitize(client) {
  var deferred = Q.defer();

  if (!client.globals.test_settings.page_objects_path) {
    // how come this is possible, no page object path but have page object bound
    deferred.resolve();
  } else {
    var pages = [];
    var originPageobjects = client.page;
    var pageObjectsPath = client.globals.test_settings.page_objects_path;
    // unbind page object
    _.unset(client, 'page');

    try {

      // loop through page object path
      _.each(pageObjectsPath, function (p) {
        var files = fs.readdirSync(path.join(process.cwd(), p));
        // only deal with .js file
        _.each(files, function (f) {
          if (_.endsWith(f, ".js")) {
            var filename = _.replace(f, ".js", "");

            pages.push({
              name: filename,
              object: buildPageObject(client, require(path.join(process.cwd(), p, f)))
            });
          }
        });
      });

      if (pages.length > 0) {
        var pgs = {};
        _.each(pages, function (p) {
          pgs[p.name] = p.object;
        });

        _.set(client, 'page', pgs);
        deferred.resolve();
      } else {
        throw new Error("pages are not initialized");
      }
    } catch (e) {

      // we're only going to use error as `alert`
      _.set(client, 'page', originPageobjects);
      deferred.resolve(e);
    }
  }

  return deferred.promise;
};
