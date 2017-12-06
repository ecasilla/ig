import compose from 'composable-middleware';
import config from '../../config';
import jwt from 'jsonwebtoken';
import restify from 'restify';
import restifyJwt from 'restify-jwt';

const validateJwt = restifyJwt({
	secret: config.session.secret,
});

function checkToken(req: restify.Request, res: restify.Response, next: restify.Next) {
	// allow access_token to be passed through query parameter as well
	if (req.query && req.query.hasOwnProperty('access_token')) {
		req.headers.authorization = `Bearer ${req.query.access_token}`;
	}
	// IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
	if (req.query && typeof req.headers.authorization === 'undefined') {
		req.headers.authorization = `Bearer ${req.cookies.token}`;
	}
	validateJwt(req, res, next);
}

function attachUser(req: restify.Request, res: restify.Response, next: restify.Next) {
	return User.find({
		where: {
			_id: req.user._id
		}
	})
		.then(user => {
			if (!user) {
				return res.status(401).end();
			}
			req.user = user;
			next();
		})
		.catch(err => next(err));
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
		return res.status(403).send('Forbidden');
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

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req: restify.Request, res: restify.Response) {
	if (!req.user) {
		return res.status(404).send('It looks like you aren\'t logged in, please try again.');
	}
	const token = signToken(req.user._id, req.user.role);
	res.cookie('token', token);
	res.redirect('/');
}
