const { Signale } = require('signale');
const chalk = require('chalk');

const options = {
  scope: 'Soundy',
  types: {
    info: {
      badge: 'ℹ',
      color: 'blue',
      label: 'info'
    },
    warn: {
      badge: '⚠',
      color: 'yellow',
      label: 'warning'
    },
    error: {
      badge: '✖',
      color: 'red',
      label: 'error'
    },
    success: {
      badge: '✔',
      color: 'green',
      label: 'success'
    },
    debug: {
      badge: '🐛',
      color: 'magenta',
      label: 'debug'
    },
    log: {
      badge: '📝',
      color: 'cyan',
      label: 'log'
    }
  },
  config: {
    displayTimestamp: true,
    displayDate: true
  }
};

const signale = new Signale(options);

function getTimestamp() {
  return new Date().toISOString();
}

module.exports = {
  info: (message) => signale.info(chalk.blue(message)),
  warn: (message) => signale.warn(chalk.yellow(message)),
  error: (message) => signale.error(chalk.red(message)),
  success: (message) => signale.success(chalk.green(message)),
  debug: (message) => signale.debug(chalk.magenta(message)),
  log: (message) => signale.log(chalk.cyan(message)),
  getTimestamp
};
