import { Console } from 'console';

const logger = new Console(process.stdout, process.stderr);

export default logger.log;
