import config from '../../config';
import local from './local';
import RestifyRouter from 'restify-routing';
import User from '../users/user.model';
import {setup} from './local/passport';

// Passport Configuration
setup(User);

const router = new RestifyRouter();

router.post('/login', local);

export default router;
