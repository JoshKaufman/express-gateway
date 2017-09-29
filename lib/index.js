require('./eventBus'); // init event bus
const pluginsLoader = require('./plugins');
if (require.main === module) {
  let config = require('./config'); // this is to init config before loading servers and plugins
  let plugins = pluginsLoader.load({ config });
  require('./gateway')({ plugins, config });
  require('./rest')({ plugins, config });
} else { // Loaded as module (e.g. if "eg gateway create" generated code )
  class Main {
    constructor () {
      this.configPath = null;
    }

    load (configPath) {
      this.configPath = configPath;
      return this;
    }

    run () {
      process.env.EG_CONFIG_DIR =
        this.configPath || process.env.EG_CONFIG_DIR;
      let config = require('./config'); // this is to init config before loading servers and plugins
      let plugins = pluginsLoader.load({ config });

      const gateway = require('./gateway')({ plugins, config });
      const adminApi = require('./rest')({ plugins, config });

      return Promise.all([gateway, adminApi])
        .then(([gatewayApps, adminApp]) => {
          this.gatewayApps = gatewayApps;
          this.adminApp = adminApp;

          return { gatewayApps, adminApp };
        });
    }

    shutdown () {
      this.gatewayApps.app.close(() => {
        this.gatewayApps.httpsApp.close(() => {
          this.adminApps.close(() => {

          });
        });
      });
    }
  }

  module.exports = () => {
    return new Main();
  };
}
