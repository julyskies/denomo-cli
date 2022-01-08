#!/usr/bin/env node

import { ChildProcess, fork } from 'child_process';
import { cpus } from 'os';
import { stat } from 'fs/promises';

import logger from './logger';
import { MessageToParent } from './types';

const DIRECTORIES: string[] = [];
const MAX_WORKERS: number = cpus().length;

let START_TIME: number;
let WORKERS: ChildProcess[] = [];

function handleClose(worker: ChildProcess): void {
  logger('Closing worker', worker.pid);
  WORKERS = WORKERS.filter(
    (storedWorker: ChildProcess): boolean => worker.pid !== storedWorker.pid,
  );

  if (DIRECTORIES.length > 0) {
    const availableWorkers = MAX_WORKERS - WORKERS.length;
    const paths = DIRECTORIES.splice(0, availableWorkers);
    logger('PATHS', paths, availableWorkers, DIRECTORIES);
    // eslint-disable-next-line
    for (const path of paths) {
      const newWorker = fork(`${process.cwd()}/build/parser.js`);
      newWorker.send({ path });
      newWorker.on(
        'message',
        ({ directories }: MessageToParent) => {
          DIRECTORIES.push(...directories);
        },
      );
      newWorker.on(
        'close',
        () => handleClose(newWorker),
      );
      WORKERS.push(newWorker);
    }
  }
  if (DIRECTORIES.length === 0 && WORKERS.length === 0) {
    logger(`Done in ${Date.now() - START_TIME} ms`);
    process.exit(0);
  }
}

async function main(): Promise<any> {
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
  } catch (error: any) {
    if (error.code && error.code === 'ENOENT') {
      throw new Error('Provided path is invalid!');
    }
    throw new Error('Could not access the provided path!');
  }

  if (DIRECTORIES.length > 0) {
    const entryWorker = fork(
      `${process.cwd()}/build/parser.js`,
    );
    entryWorker.send({ path: DIRECTORIES[0] });
    DIRECTORIES.splice(0);
    entryWorker.on(
      'message',
      ({ directories }: any) => {
        DIRECTORIES.push(...directories);
        logger('entryWorker message', DIRECTORIES);
      },
    );
    entryWorker.on(
      'close',
      () => handleClose(entryWorker),
    );
    WORKERS.push(entryWorker);
  }
}

main();
