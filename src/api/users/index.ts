import * as RestifyRouter from 'restify-routing';
import config from '../../config';
import * as auth from '../auth/auth.service';
import * as controller from './user.controller';

const router = new RestifyRouter();

router.post('/new', controller.create);
router.post('/forgot', controller.forgot);
router.get('/reset', controller.reset);

router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/:id', auth.isAuthenticated(), controller.upsert);
router.patch('/:id', auth.isAuthenticated(), controller.patch);

router.get('/all', controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

export default router;
