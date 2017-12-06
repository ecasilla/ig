/**
 * Restify configuration
 */

import errors from 'restify-errors';
import restify from 'restify';
import * as auth from '../api/auth/auth.service';
import logger from '../utils/logger';

export default function restifyConfig(server: restify.Server) {
	server.pre(restify.plugins.pre.context());
	server.pre(restify.plugins.pre.dedupeSlashes());
	server.pre(restify.plugins.pre.reqIdHeaders());
	server.pre(
		restify.CORS({
			credentials: false,
			headers: ['authorization'],
			origins: ['http://localhost:4000']
		})
	);
	server.pre(function logRequest(
		request: restify.Request,
		response: restify.Respose,
		next: restify.Next
	) {
		request.log.info({ req: request }, 'REQUEST');
		next();
	});

	restify.CORS.ALLOW_HEADERS.push('authorization');
	server.on('MethodNotAllowed', function listener(
		req: restify.Request,
		res: restify.Response
	) {
		if (req.method.toUpperCase() === 'OPTIONS') {
			// Send the CORS headers
			res.header(
				'Access-Control-Allow-Headers',
				restify.CORS.ALLOW_HEADERS.join(', ')
			);
			res.send(200);
		} else {
			res.send(new errors.MethodNotAllowedError());
		}
	});
	server.use(restify.acceptParser(server.acceptable));
	server.use(restify.bodyParser());
	server.use(restify.authorizationParser());
	server.use(restify.dateParser());
	server.use(restify.queryParser());
	server.use(restify.gzipResponse());
	server.use(restify.fullResponse());
	server.use(restify.conditionalRequest());

	// Allow 5 requests/second by IP, and burst to 10
	server.use(
		restify.throttle({
			burst: 100,
			ip: true,
			rate: 50
		})
	);

	server.on('restifyError', function uncaughtExceptionCb(
		req: restify.Request,
		res: restify.Response,
		route: restify.Route,
		err: Error
	) {
		const auditer = restify.auditLogger({ log: logger });
		auditer(req, res, route, err);
		res.send(new errors.InternalServerError());
	});

	server.on('after', function restify_auditCb(
		req: restify.Request,
		res: restify.Response,
		route: restify.Route,
		err: Error
	) {
		if (route && route.spec.path === 'health') {
			// Skip auditor logging if its health request
			return;
		}
		const auditer = restify.auditLogger({ log: logger });
		auditer(req, res, route, err);
	});
}
