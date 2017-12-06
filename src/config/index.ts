import * as dotenv from 'dotenv';
let config = null;
let requestLogging = null;

// Pull data from environment and from .env
dotenv.config();

function configWarning(value: string, message: string): string {
	process.stdout.write('\nCONFIG WARNING - ' + message);
	return value;
}

requestLogging = (process.env.REQUEST_LOGGING || 'none').toLowerCase();

export default (config = {
	api_table: false,
	bodyParserLimit: process.env.BODY_PARSER_LIMIT || false,
	client: process.env.CLIENT,
	debug: process.env.DEBUG || 1,
	defaultDate: process.env.DEFAULT_DATE,
	env: process.env.NODE_ENV || 'development',
	instagram: {
		callbackURL: (process.env.DOMAIN || '') + '/auth/google/callback',
		clientID: process.env.INSTAGRAM_ID || 'id',
		clientSecret: process.env.INSTAGRAM_SECRET || 'secret'
	},
	ip: process.env.IP,
	// Service listen port and workers
	// Logging configuration
	logDir: configWarning('', 'LOG_DIR not set, logging to process.stdout'),
	logInterval:
		process.env.LOG_INTERVAL ||
		configWarning('', 'LOG_INTERVAL is not set, recommended value: 5000'),
	logName: process.env.LOG_NAME || 'service',
	name: process.env.SERVICE_NAME || 'Node Application',
	port: process.env.PORT || 3000,
	// Redis config
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	},
	requestLogging,
	seedDB: process.env.SEED_DB || false,
	sequelize: {
		database: process.env.DB_NAME,
		options: {
			dialect: 'postgres'
		},
		password: process.env.DB_PASSWORD,
		uri: process.env.DB_HOSTNAME,
		username: process.env.DB_USER
	},
	// Session Config
	session: {
		expiresIn: 60 * 60 * 24 * 30, // days last number
		maxage: process.env.SESSION_MAXAGE || 3600000,
		oneUseexpiresIn: process.env.SESSION_ONETIME_SECRET || 60 * 60 * 2,
		saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED || false,
		secret:
			process.env.SESSION_SECRET ||
			configWarning(
				'this.is.not.secure',
				'SESSION_SECRET set to a non-secure value'
			)
	},
	// CORS configuration
	useCors: process.env.USE_CORS || false,
	userRoles: ['user', 'guest', 'admin']
});

if (config.env === 'development') {
	process.stdout.write('\nDEVELOPMENT MODE');
}
