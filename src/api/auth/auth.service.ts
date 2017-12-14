import * as compose from 'composable-middleware';
import * as jwt from 'jsonwebtoken';
import * as restify from 'restify';
import * as restifyJwt from 'restify-jwt';
import config from '../../config';
import {User} from '../users/user.model';

const validateJwt = restifyJwt({
  secret: config.session.secret,
});

function checkToken(req: restify.Request, res: restify.Response, next: restify.Next) {
  req.startHandlerTimer('checkToken');
  // allow access_token to be passed through query parameter as well
  if (req.query && req.query.hasOwnProperty('access_token')) {
    req.headers.authorization = `Bearer ${req.query.access_token}`;
  }
  req.endHandlerTimer('checkToken');
  validateJwt(req, res, next);
}

function attachUser(req: restify.Request, res: restify.Response, next: restify.Next) {
  const {id} = req.get('user');
  return User.find({
    where: {
      id,
    },
  })
    .then((user) => {
      if (!user) {
        return res.send(401);
      }
      req.set('user', user);
      next();
    })
    .catch((err) => next(err));
}

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
export function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(checkToken)
    // Attach user to request
    .use(attachUser);
}

function meetsRequirements(roleRequired: string) {
  return (req: restify.Request, res: restify.Response, next: restify.Next) => {
    if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
      return next();
    }
    return res.send(403, 'Forbidden');
  };
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(roleRequired: string) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use(meetsRequirements(roleRequired));
}

/**
 * Returns a jwt token signed by the app secret
 */
export function signToken(id: string, role: string) {
  return jwt.sign({ _id: id, role }, config.session.secret, {
    expiresIn: config.session.expiresIn,
  });
}
