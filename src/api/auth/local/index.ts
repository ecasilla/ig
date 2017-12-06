import { signToken } from '../auth.service';
import {IUser} from '../../users/user.model';
import errors from 'restify-errors';
import logger from '../../../utils/logger';
import passport from 'passport';
import restify from 'restify';

function localAuth(req: restify.Request, res: restify.Response, next: restify.Next) {
	passport.authenticate('local', function local(err: Error, user: IUser, info) {
		const error = err || info;
		if (error) {
			logger.error(error);
			return res.send(new errors.UnauthorizedError(error));
		}
		if (!user) {
			logger.error(user);
			return res.send(new errors.NotFoundError(), { message: 'Something went wrong, please try again.' });
		}
		const token = signToken(user._id, user.role);
		res.json({ token });
	})(req, res, next);
}

export default localAuth;
