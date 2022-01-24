import { ChildProcess, exec, fork } from 'child_process';
import { cpus } from 'os';
import { promisify } from 'util';
import { stat } from 'fs/promises';

import { ERROR_MESSAGES, HANDLER_TYPES } from './constants';
import logger from './logger';
import { MessageToParent, NodeError } from './types';

const execPromise = promisify(exec);

const DIRECTORIES: string[] = [];
const MAX_WORKERS: number = cpus().length;

let START_TIME: number;
let WORKER_PATH: string;
let WORKERS: ChildProcess[] = [];

/**
 * Handler for the worker events
 * @param {string} type - handler type
 * @param {ChildProcess | string[]} payload - payload for the handler
 * @returns {never | void}
 */
function handler(type: string, payload: ChildProcess | string[]): never | void {
  if (type === HANDLER_TYPES.close) {
    WORKERS = WORKERS.filter(
      (storedWorker: ChildProcess): boolean => (payload as ChildProcess).pid !== storedWorker.pid,
    );
  }
  if (type === HANDLER_TYPES.message && (payload as string[]).length > 0) {
    DIRECTORIES.push(...(payload as string[]));
  }

  const availableWorkers = MAX_WORKERS - WORKERS.length;
  if (availableWorkers > 0 && DIRECTORIES.length > 0) {
    const paths = DIRECTORIES.splice(0, availableWorkers);

    // eslint-disable-next-line
    for (const path of paths) {
      const newWorker = fork(WORKER_PATH);
      newWorker.send({ path });
      newWorker.on(
        HANDLER_TYPES.close,
        (): never | void => handler(HANDLER_TYPES.close, newWorker),
      );
      newWorker.on(
        HANDLER_TYPES.message,
        ({ directories }: MessageToParent): never | void => handler(
          HANDLER_TYPES.message,
          directories,
        ),
      );
      WORKERS.push(newWorker);
    }
  }

  if (type === HANDLER_TYPES.close && DIRECTORIES.length === 0 && WORKERS.length === 0) {
    logger(`Done in ${Date.now() - START_TIME} ms`);
    process.exit(0);
  }
}

/**
 * Module entry
 * @returns {Promise<Error | void>}
 */
export default async function main(): Promise<Error | void> {
  START_TIME = Date.now();

  try {
    const { stdout = '', stderr = '' } = await execPromise('npm root -g');
    if (stderr || !stdout) {
      throw new Error(ERROR_MESSAGES.couldNotAccessTheModule);
    }
    WORKER_PATH = process.env.TESTING
      ? `${process.cwd()}/build/worker.js`
      : `${stdout.trim()}/denomo-cli/build/worker.js`;
  } catch {
    throw new Error(ERROR_MESSAGES.couldNotAccessTheModule);
  }

  const [, , entryPoint = ''] = process.argv;
  if (!entryPoint) {
    throw new Error(ERROR_MESSAGES.pleaseProvideThePath);
  }
  if (entryPoint === '/') {
    throw new Error(ERROR_MESSAGES.systemRootIsNotAValidPath);
  }

  const fixedEntry = entryPoint.slice(-1) === '/'
    ? entryPoint.slice(0, entryPoint.length - 1)
    : entryPoint;

  try {
    const stats = await stat(fixedEntry);
    if (stats.isDirectory()) {
      DIRECTORIES.push(fixedEntry);
    }
  } catch (error) {
    const nodeError = error as NodeError;
    if (nodeError.code && nodeError.code === 'ENOENT') {
      throw new Error(ERROR_MESSAGES.providedPathIsInvalid);
    }
    throw new Error(ERROR_MESSAGES.couldNotAccessTheProvidedPath);
  }

  if (DIRECTORIES.length > 0) {
    const entryWorker = fork(WORKER_PATH);
    entryWorker.send({ path: DIRECTORIES[0] });
    DIRECTORIES.splice(0);
    entryWorker.on(
      HANDLER_TYPES.close,
      (): never | void => handler(HANDLER_TYPES.close, entryWorker),
    );
    entryWorker.on(
      HANDLER_TYPES.message,
      ({ directories }: MessageToParent): never | void => handler(
        HANDLER_TYPES.message,
        directories,
      ),
    );
    WORKERS.push(entryWorker);
  } else {
    throw new Error(ERROR_MESSAGES.providedPathIsInvalid);
  }
}
