import * as passport from 'passport';
import * as restify from 'restify';
import errors from 'restify-errors';
import logger from '../../../utils/logger';
import { User } from '../../users/user.model';
import { signToken } from '../auth.service';

function localAuth(req: any, res: any, next: restify.Next) {
  passport.authenticate('local', function local(err: Error, user: User, info: any) {
    const error = err || info;
    if (error) {
      logger.error(error);
      return res.send(new errors.UnauthorizedError(error));
    }
    if (!user) {
      logger.error(user);
      return res.send(new errors.NotFoundError(), { message: 'Something went wrong, please try again.' });
    }
    const token = signToken(user.id, user.role);
    res.json({ token });
  })(req, res, next);
}

export default localAuth;
