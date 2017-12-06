/**
 * Sequelize initialization module
 */

'use strict';

import Sequelize from 'sequelize';
import config from '../config';

const { sequelize } = config;
const db = {
	Sequelize,
	User: {},
	sequelize: new Sequelize(
		sequelize.database,
		sequelize.username,
		sequelize.password,
		sequelize.options
	)
};

// Insert models below
db.User = db.sequelize.import('../api/user/user.model');

export default db;
