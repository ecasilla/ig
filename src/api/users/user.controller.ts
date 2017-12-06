'use strict';

import config from '../../config';
import jwt from 'jsonwebtoken';
import jsonpatch from 'fast-json-patch';
import restify from 'restify';
import { User } from '../../db';
import { email } from '../../utils';


function validationError(res: restify.Response, statusCode: number) {
	statusCode = statusCode || 422;
	return function valErrorCb(err: ErrorConstructor) {
		return res.status(statusCode).json(err);
	};
}

function handleError(res: restify.Response, statusCode: number) {
	statusCode = statusCode || 500;
	return function handleErrorCb(err: ErrorConstructor) {
		return res.status(statusCode).send(err);
	};
}

function handleEntityNotFound(res: restify.Response) {
	return function entityHandler(entity: User) {
		if (!entity) {
			res.send(404);
			return null;
		}
		return entity;
	};
}

function respondWithResult(res: restify.Response, statusCode: number) {
	statusCode = statusCode || 200;
	return function respond(entity: User) {
		if (entity) {
			res.send(statusCode, entity);
		}
	};
}


function patchUpdates(patches: any) {
	return function patcher(entity: User) {
		try {
			jsonpatch.apply(entity, patches, /*validate*/ true);
		} catch (err) {
			return Promise.reject(err);
		}

		return entity.save();
	};
}

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
		.then((users: User) => {
			res.status(200).json(users);
		})
		.catch(handleError(res, null));
}

/**
 * Creates a new user
 */
export function create(req: restify.Request, res: restify.Response) {
	const newUser = new User(req.body);
	return newUser.save()
		.then(function handleResp(user: User) {
			const token = jwt.sign({ id: user.id }, config.session.secret, {
				expiresIn: config.session.expiresIn,
			});
			res.json({ token });
		})
		.catch(validationError(res, null));
}

/**
 * Get a single user
 */
export function show(req: restify.Request, res: restify.Response, next: restify.Next) {
	const userId = req.params.id;

	return User.find({
		where: {
			id: userId,
		},
	})
		.then((user: User) => {
			if (!user) {
				return res.status(404).end();
			}
			res.json(user.profile);
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
			res.status(204).end();
		})
		.catch(handleError(res, null));
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
			if (user.authenticate(oldPass)) {
				user.password = newPass;
				return user.save()
					.then(() => {
						res.status(204).end();
					})
					.catch(validationError(res, null));
			} else {
				return res.status(403).end();
			}
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
				return res.status(401).end();
			}
			res.json(user);
		})
		.catch((err: ErrorConstructor) => next(err));
}

/**
 * Authentication callback
 */
export function authCallback(req: restify.Request, res: restify.Response) {
	res.redirect('/');
}

/**
 * Reset Password
 */
export function reset(req: restify.Request, res: restify.Response) {
	res.send(200);
}

export function forgot(req: restify.Request, res: restify.Response) {
	User.findByEmail(req.body.email)
		.then(handleEntityNotFound(res))
		.then(email.forgotPassword)
		.then(respondWithResult(res, null))
		.catch(handleError(res, null));
}

export function upsert(req: restify.Request, res: restify.Response) {
	if (req.body._id) {
		req.body.id = undefined;
	}

	return User.upsert(req.body, {
		where: {
			id: req.params.id,
		},
	})
		.then(respondWithResult(res, null))
		.catch(handleError(res, null));
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
		.then(respondWithResult(res, null))
		.catch(handleError(res, null));
}
