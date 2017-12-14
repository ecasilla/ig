'use strict';

import * as restify from 'restify';
import * as errors from 'restify-errors';
import * as RestifyRouter from 'restify-routing';

const rootRouter = new RestifyRouter();

function handleNotFoundError(req, res) {
  return res.send(new errors.NotFoundError());
}

export default function routesConfig(server: restify.Server) {
  // Insert routes below
  rootRouter.use('/v1/users', require('./api/users').default);
  rootRouter.use('/v1/auth', require('./api/auth').default);
  rootRouter.applyRoutes(server);

  // All undefined asset or api routes should return a 404
  server.get(/:url(api|auth|components|config|util|node_modules)/, handleNotFoundError);
}
