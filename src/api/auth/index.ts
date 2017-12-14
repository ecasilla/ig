import * as RestifyRouter from 'restify-routing';
import config from '../../config';
import {User} from '../users/user.model';
import local from './local';
import {setup} from './local/passport';

// Passport Configuration
setup(User as any);

const router = new RestifyRouter();

router.post('/login', local);

export default router;
