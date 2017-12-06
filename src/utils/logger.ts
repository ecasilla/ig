import * as bunyan from 'bunyan';
import * as path from 'path';
import * as restify from 'restify';
import config from '../config';

let logger: bunyan;
function logging() {
	// -- Construct --

	if (logger) {
		return logger;
	}

	const loggerConfig = {
		name: config.logName,
		serializers: restify.bunyan.serializers,
		streams: new Array()
	};

	if (config.logDir) {
		const baselog = path.join(config.logDir, config.logName);
		loggerConfig.streams.push({ level: 'debug', path: baselog + '.log' });
	} else {
		loggerConfig.streams.push({ level: 'trace', stream: process.stdout });
	}

	logger = bunyan.createLogger(loggerConfig);
	return logger;
}

export default logging();
