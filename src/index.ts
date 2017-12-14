'use strict';

import * as restify from 'restify';
import config from './config';
import restifyConf from './config/restify';
import db from './db';
import routes from './routes';
import logger from './utils/logger';

const server: restify.Server = restify.createServer({
  log: logger,
  name: config.name,
  version: '1.0.0',
});

// Setup server dont switch ordering
restifyConf(server);
routes(server);

function listener() {
  logger.info('Node Server listening on %d, in %s mode', config.port, config.env);
  if (config.api_table) {
    require('./utils/table')(server.router.mounts);
  }
}

// Start server
function startServer() {
  server.listen(config.port, config.ip, listener);
}

Promise.resolve()
  .then(startServer)
  .catch(function catchErr(err: Error) {
    process.stdout.write('Server failed to start due to error: %s', err.message);
  });

// Expose server
exports = module.exports = server;
