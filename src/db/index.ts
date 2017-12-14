/**
 * Sequelize initialization module
 */

'use strict';

import { Sequelize } from 'sequelize-typescript';
import config from '../config';

const db = new Sequelize(config.sequelize);

db.addModels(['../src/api/users/user.model.ts']);

export default db;
