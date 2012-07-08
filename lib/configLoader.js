var fs = require('fs');
var path = require('path');

exports.load = function (callback) {
  var configFilePath = path.join(__dirname, '..', 'config.json');
  fs.readFile(configFilePath, 'utf8', function (err, configFile) {
    try {
      configFile = JSON.parse(configFile);
    } catch (error) {
      configFile = null;
    }

    var defaultConfig = {
      server: {
        port: 3000
      },

      database: {
        port: 3306,
        host: 'localhost'
      }
    };

    if (err || !configFile) {
      return callback(null, defaultConfig);
    }

    var config = {
      server: {
        port: (configFile.server && configFile.server.port) || defaultConfig.server.port
      },

      database: {
        port: (configFile.database && configFile.database.port) || defaultConfig.database.port,
        host: (configFile.database && configFile.database.host) || defaultConfig.database.host
      }
    };

    callback(null, config);
  });
};
