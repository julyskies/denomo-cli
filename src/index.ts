#!/usr/bin/env node

import { stat } from 'fs/promises';

import parse from './parser';

async function main() {
  const [, , entryPoint] = process.argv;

  if (entryPoint === '/') {
    throw new Error('System root is not a valid path!');
  }

  let stats;
  try {
    stats = await stat(entryPoint);
  } catch (error: any) {
    if (error.code && error.code === 'ENOENT') {
      throw new Error('Provided path is invalid!');
    }
    throw new Error('Could not access the provided path!');
  }

  if (stats.isDirectory()) {
    return parse(entryPoint);
  }

  throw new Error('Provided path should point to a directory!');
}

main();
