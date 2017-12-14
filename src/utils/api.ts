import * as jsonpatch from 'fast-json-patch';
import { isEmpty, isNil } from 'lodash';
import * as restify from 'restify';

export function validationError(res: restify.Response, statusCode?: number) {
  statusCode = statusCode || 422;
  return function valErrorCb(err: ErrorConstructor) {
    return res.send(statusCode, err);
  };
}

export function handleError(res: restify.Response, statusCode?: number) {
  statusCode = statusCode || 500;
  return function handleErrorCb(err: ErrorConstructor) {
    return res.send(statusCode, err);
  };
}

export function handleEntityNotFound(res: restify.Response) {
  return function entityHandler(entity: any) {
    if (isNil(entity) || isEmpty(entity)) {
      return res.send(404);
    }
    return entity;
  };
}

export function respondWithResult(res: restify.Response, statusCode?: number) {
  statusCode = statusCode || 200;
  return function respond(entity: any) {
    if (entity) {
      res.send(statusCode, entity);
    }
  };
}

export function patchUpdates(patches: any) {
  return function patcher(entity: any) {
    try {
      jsonpatch.applyPatch(entity, patches, /*validate*/ true);
    } catch (err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}
