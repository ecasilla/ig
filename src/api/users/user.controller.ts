'use strict';

import jwt from 'jsonwebtoken';
import * as restify from 'restify';
import config from '../../config';
import {
  forgotPassword,
  handleEntityNotFound,
  handleError,
  patchUpdates,
  respondWithResult,
  validationError,
} from '../../utils';
import { User } from './user.model';

/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req: restify.Request, res: restify.Response) {
  return User.findAll({
    attributes: [
      'id',
      'name',
      'email',
      'role',
      'provider',
    ],
  })
    .then((users: User[]) => {
      res.json(users);
    })
    .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req: restify.Request, res: restify.Response) {
  const newUser = new User(req.body);
  console.log(newUser)
  return newUser.save()
    .then(function handleResp(user: User) {
      const token = jwt.sign({ id: user.id }, config.session.secret, {
        expiresIn: config.session.expiresIn,
      });
      res.json({ token });
    })
    .catch(validationError(res));
}

/**
 * Get a single user
 */
export function show(req: restify.Request, res: restify.Response, next: restify.Next) {
  const id = req.params.id;

  return User.find({
    where: {
      id,
    },
  })
    .then((user: User) => {
      if (!user) {
        return res.send(404);
      }
      res.json(user.profile());
    })
    .catch((err: ErrorConstructor) => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req: restify.Request, res: restify.Response) {
  return User.destroy({ where: { id: req.params.id } })
    .then(function handleDelete() {
      res.status(204);
    })
    .catch(handleError(res));
}

/**
 * Change a users password
 */
export function changePassword(req: restify.Request, res: restify.Response) {
  const userId = req.user.id;
  const oldPass = String(req.body.oldPassword);
  const newPass = String(req.body.newPassword);

  return User.find({
    where: {
      id: userId,
    },
  })
    .then((user: User) => {
      user.authenticate(oldPass)
        .then((authed) => {
          if (authed) {
            user.password = newPass;
            return user.save()
              .then(() => res.send(204))
              .catch(validationError(res));
          }
          return res.send(403);
        });
    });
}

/**
 * Get my info
 */
export function me(req: restify.Request, res: restify.Response, next: restify.Next) {
  const userId = req.user.id;

  return User.find({
    attributes: [
      'id',
      'name',
      'email',
      'role',
      'provider',
    ],
    where: {
      id: userId,
    },
  })
    .then((user: User) => { // don't ever give out the password or salt
      if (!user) {
        return res.send(401);
      }
      res.json(user);
    })
    .catch((err: ErrorConstructor) => next(err));
}

/**
 * Reset Password
 */
export function reset(req: restify.Request, res: restify.Response) {
  res.send(200);
}

export function forgot(req: restify.Request, res: restify.Response) {
  return User.findOne({ where: { email: req.body.email } })
    .then(handleEntityNotFound(res))
    .then(forgotPassword)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function upsert(req: restify.Request, res: restify.Response) {
  if (!req.body.id) {
    return handleError(res);
  }

  return User.upsert(req.body)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing User in the DB
export function patch(req: restify.Request, res: restify.Response) {
  if (req.body._id) {
    req.body.id = undefined;
  }
  return User.find({
    where: {
      id: req.params.id,
    },
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}
