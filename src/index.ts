#!/usr/bin/env node

import { ChildProcess, fork } from 'child_process';
import { cpus } from 'os';
import { stat } from 'fs/promises';

import logger from './logger';
import { MessageToParent, NodeError } from './types';

const DIRECTORIES: string[] = [];
const MAX_WORKERS: number = cpus().length;

let START_TIME: number;
let WORKERS: ChildProcess[] = [];

// TODO: move this to a separate file
function handleClose(worker: ChildProcess): void | never {
  logger('Closing worker', worker.pid);
  WORKERS = WORKERS.filter(
    (storedWorker: ChildProcess): boolean => worker.pid !== storedWorker.pid,
  );

  const availableWorkers = MAX_WORKERS - WORKERS.length;
  if (availableWorkers > 0 && DIRECTORIES.length > 0) {
    const paths = DIRECTORIES.splice(0, availableWorkers);
    logger('PATHS', paths, availableWorkers, DIRECTORIES);
    // eslint-disable-next-line
    for (const path of paths) {
      const newWorker = fork(`${process.cwd()}/build/worker.js`);
      newWorker.send({ path });
      newWorker.on(
        'message',
        ({ directories }: MessageToParent): void => {
          DIRECTORIES.push(...directories);
          // TODO: run workers at this point
        },
      );
      newWorker.on(
        'close',
        (): never | void => handleClose(newWorker),
      );
      WORKERS.push(newWorker);
    }
  }
  if (DIRECTORIES.length === 0 && WORKERS.length === 0) {
    logger(`Done in ${Date.now() - START_TIME} ms`);
    process.exit(0);
  }
}

async function main(): Promise<Error | void> {
  START_TIME = Date.now();

  const [, , entryPoint] = process.argv;
  if (entryPoint === '/') {
    throw new Error('System root is not a valid path!');
  }

  try {
    const stats = await stat(entryPoint);
    if (stats.isDirectory()) {
      DIRECTORIES.push(entryPoint);
    }
  } catch (error) {
    if ((error as NodeError).code && (error as NodeError).code === 'ENOENT') {
      throw new Error('Provided path is invalid!');
    }
    throw new Error('Could not access the provided path!');
  }

  if (DIRECTORIES.length > 0) {
    const entryWorker = fork(`${process.cwd()}/build/worker.js`);
    entryWorker.send({ path: DIRECTORIES[0] });
    DIRECTORIES.splice(0);
    entryWorker.on(
      'message',
      ({ directories }: MessageToParent): void => {
        DIRECTORIES.push(...directories);
        // TODO: run workers at this point
      },
    );
    entryWorker.on(
      'close',
      (): never | void => handleClose(entryWorker),
    );
    WORKERS.push(entryWorker);
  }
}

main();
