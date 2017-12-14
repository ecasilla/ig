/**
 * Restify configuration
 */

import * as restify from 'restify';
import * as corsMiddleware from 'restify-cors-middleware';
import * as errors from 'restify-errors';
import config from '../config';
import logger from '../utils/logger';

export default function restifyConfig(server: restify.Server) {
  server.pre(restify.plugins.pre.context());
  server.pre(restify.plugins.pre.dedupeSlashes());
  server.pre(restify.plugins.pre.reqIdHeaders({ headers: ['requestId'] }));
  const cors = corsMiddleware({
    allowHeaders: ['API-Token', 'authorization', 'Authorization'],
    exposeHeaders: ['API-Token-Expiry', 'authorization', 'Authorization'],
    origins: [config.client],
    preflightMaxAge: 5,
  });

  server.pre(cors.preflight);
  server.use(cors.actual);

  server.pre(function logRequest(
    request: restify.Request,
    response: restify.Response,
    next: restify.Next,
  ) {
    request.log.info({ req: request }, 'REQUEST');
    next();
  });

  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(restify.plugins.bodyParser());
  server.use(restify.plugins.authorizationParser());
  server.use(restify.plugins.dateParser());
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.gzipResponse());
  server.use(restify.plugins.fullResponse());
  server.use(restify.plugins.conditionalRequest());

  // Allow 5 requests/second by IP, and burst to 10
  server.use(
    restify.plugins.throttle({
      burst: 100,
      ip: true,
      rate: 50,
    }),
  );

  server.on('restifyError', function uncaughtExceptionCb(
    req: restify.Request,
    res: restify.Response,
    route: restify.Route,
    err: Error,
  ) {
    const auditer = restify.plugins.auditLogger({
      event: 'routed',
      log: logger,
    });
    auditer(req, res, route, err);
    res.send(new errors.InternalServerError());
  });

  server.on('after', function restify_auditCb(
    req: restify.Request,
    res: restify.Response,
    route: restify.Route,
    err: Error,
  ) {
    if (route && route.spec.path === 'health') {
      // Skip auditor logging if its health request
      return;
    }
    const auditer = restify.plugins.auditLogger({
      event: 'after',
      log: logger,
    });
    auditer(req, res, route, err);
  });
}
