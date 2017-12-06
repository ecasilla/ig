import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import logger from 'src/utils/logger';
import { IUser } from 'src/api/users/user.model';

type cb = (error: any, user?: any, options?: any) => void;
function localAuthenticate(User: IUser, email: string, password: string, done: cb) {
	return User.findOne({
		email: email.toLowerCase(),
	})
		.then(user => {
			if (!user) {
				logger.info('This email is not registered.', user);
				return done(null, null, {
					message: 'This email is not registered.',
				});
			}
			return user.authenticate(password, (authError: Error, authenticated: boolean) => {
				if (authError) {
					return done(authError);
				}
				if (!authenticated) {
					return done(null, null, { message: 'This password is not correct.' });
				}
				return done(null, user);
			});
		})
		.catch((err: Error) => done(err));
}
export function setup(User) {
	passport.use(new LocalStrategy({
		passwordField: 'password', // this is the virtual field on the model
		usernameField: 'email',
	}, function authSetup(email, password, done) {
		return localAuthenticate(User, email, password, done)
	}));
}
