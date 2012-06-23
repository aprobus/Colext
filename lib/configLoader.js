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

            couch: {
                port: 5984,
                host: '127.0.0.1'
            }
        };

        if (err || !configFile) {
            return callback(null, defaultConfig);
        }

        var config = {
            server: {
                port: (configFile.server && configFile.server.port) || defaultConfig.server.port
            },

            couch: {
                port: (configFile.couch && configFile.couch.port) || defaultConfig.couch.port,
                host: (configFile.couch && configFile.couch.host) || defaultConfig.couch.host
            }
        }

        callback(null, config);
    });
};
