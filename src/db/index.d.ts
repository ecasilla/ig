import Sequelize from 'sequelize';

export interface IDB {
	Sequelize: Sequelize.SequelizeStatic;
	sequelize: Sequelize.Instance;
	User: Sequelize.Model;
}
