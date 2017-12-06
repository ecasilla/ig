'use strict';

import Restify from 'restify';
import RestifyRouter from 'restify-routing';

const rootRouter = new RestifyRouter();

export default function routesConfig(server: Restify.Server) {
	// Insert routes below
	rootRouter.use('/v1/users', require('./api/user').default);
	rootRouter.use('/v1/auth', require('./api/auth').default);
	rootRouter.applyRoutes(server);

	// All undefined asset or api routes should return a 404
	server.get(/:url(api|auth|components|config|util|node_modules)/, Restify.errors.NotFoundError);
}
