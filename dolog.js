// Arguments: level=LogLevel.Info, logContent, asObject=false
// Needs one call "DoLog();" to get it initialized before using it!
function DoLog() {
	// Global log levels set
	window.LogLevel = {
		None: 0,
		Error: 1,
		Success: 2,
		Warning: 3,
		Info: 4,
	}
	window.LogLevelMap = {};
	window.LogLevelMap[LogLevel.None] = {
		prefix: '',
		color: 'color:#ffffff'
	}
	window.LogLevelMap[LogLevel.Error] = {
		prefix: '[Error]',
		color: 'color:#ff0000'
	}
	window.LogLevelMap[LogLevel.Success] = {
		prefix: '[Success]',
		color: 'color:#00aa00'
	}
	window.LogLevelMap[LogLevel.Warning] = {
		prefix: '[Warning]',
		color: 'color:#ffa500'
	}
	window.LogLevelMap[LogLevel.Info] = {
		prefix: '[Info]',
		color: 'color:#888888'
	}
	window.LogLevelMap[LogLevel.Elements] = {
		prefix: '[Elements]',
		color: 'color:#000000'
	}

	// Current log level
	DoLog.logLevel = LogLevel.Info; // Info Warning Success Error

	// Log counter
	DoLog.logCount === undefined && (DoLog.logCount = 0);
	if (++DoLog.logCount > 512) {
		console.clear();
		DoLog.logCount = 0;
	}

	// Get args
	let level, logContent, asObject;
	switch (arguments.length) {
		case 1:
			level = LogLevel.Info;
			logContent = arguments[0];
			asObject = false;
			break;
		case 2:
			level = arguments[0];
			logContent = arguments[1];
			asObject = false;
			break;
		case 3:
			level = arguments[0];
			logContent = arguments[1];
			asObject = arguments[2];
			break;
		default:
			level = LogLevel.Info;
			logContent = 'DoLog initialized.';
			asObject = false;
			break;
	}

	// Log when log level permits
	if (level <= DoLog.logLevel) {
		let msg = '%c' + LogLevelMap[level].prefix;
		let subst = LogLevelMap[level].color;

		if (asObject) {
			msg += ' %o';
		} else {
			switch (typeof(logContent)) {
				case 'string':
					msg += ' %s';
					break;
				case 'number':
					msg += ' %d';
					break;
				case 'object':
					msg += ' %o';
					break;
			}
		}

		console.log(msg, subst, logContent);
	}
}
DoLog();