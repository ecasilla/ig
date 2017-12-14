import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import logger from '../../../utils/logger';
import {User} from '../../users/user.model';

type cb = (error: any, user?: any, options?: any) => void;

function localAuthenticate(UserModel: any, email: string, password: string, done: cb) {
  return UserModel.findOne({
    where: {email: email.toLowerCase()},
  })
    .then((usr: User) => {
      if (!usr) {
        logger.info('This email is not registered.', usr);
        return done(null, null, {
          message: 'This email is not registered.',
        });
      }
      return usr.authenticate(password)
       .then((authenticated: boolean) => {
        if (!authenticated) {
          return done(null, null, { message: 'This password is not correct.' });
        }
        return done(null, usr);
      });
    })
    .catch((err: Error) => done(err));
}

export function setup(UserModel: User) {
  passport.use(new LocalStrategy({
    passwordField: 'password', // this is the virtual field on the model
    usernameField: 'email',
  }, function authSetup(email, password, done) {
    return localAuthenticate(UserModel, email, password, done);
  }));
}
