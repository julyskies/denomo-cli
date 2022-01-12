import { expect } from 'chai';
import { fork } from 'child_process';
import {
  mkdir,
  rm,
  stat,
  writeFile,
} from 'fs/promises';

import { NodeError } from '../types';

const DIRECTORY_PATH = `${process.cwd()}/test-dir`;
const CONTENT_DIRECTORY_PATH = `${DIRECTORY_PATH}/not_node_modules`;
const CONTENT_FILE_PATH = `${DIRECTORY_PATH}/test`;

async function createContentStructure(withModules: boolean): Promise<void> {
  await mkdir(DIRECTORY_PATH);
  await mkdir(CONTENT_DIRECTORY_PATH);
  await writeFile(CONTENT_FILE_PATH, 'test');

  if (withModules) {
    await mkdir(`${DIRECTORY_PATH}/node_modules`);
  }
}

async function deleteContentStructure(): Promise<void> {
  return rm(
    DIRECTORY_PATH,
    {
      recursive: true,
    },
  );
}

describe(
  'Test the worker',
  (): void => {
    it(
      'Should parse the directory and should not delete any files or directories if there are no node_modules',
      async (): Promise<void> => {
        await createContentStructure(false);

        const newWorker = fork(`${process.cwd()}/build/worker.js`);
        newWorker.send({ path: DIRECTORY_PATH });
        await new Promise<void>(
          (resolve): void => {
            newWorker.on('close', resolve);
          },
        );

        const [directoryStats, fileStats] = await Promise.all([
          stat(CONTENT_DIRECTORY_PATH),
          stat(CONTENT_FILE_PATH),
        ]);
 
        await deleteContentStructure();

        expect(directoryStats).to.exist;
        expect(fileStats).to.exist;
      },
    );
    it(
      'Should delete the node_modules directory',
      async (): Promise<void> => {
        await createContentStructure(true);

        const newWorker = fork(`${process.cwd()}/build/worker.js`);
        newWorker.send({ path: DIRECTORY_PATH });
        await new Promise<void>(
          (resolve): void => {
            newWorker.on('close', resolve);
          },
        );

        try {
          await stat(`${DIRECTORY_PATH}/node_modules`);
        } catch (error) {
          await deleteContentStructure();
          const nodeError = error as NodeError;

          expect(nodeError.code).to.exist;
          expect(nodeError.code).to.equal('ENOENT');
        }
      },
    );
    it(
      'Should not delete a file called node_modules',
      async (): Promise<void> => {
        await createContentStructure(false);
        await writeFile(`${DIRECTORY_PATH}/node_modules`, 'testing');

        const newWorker = fork(`${process.cwd()}/build/worker.js`);
        newWorker.send({ path: DIRECTORY_PATH });
        await new Promise<void>(
          (resolve): void => {
            newWorker.on('close', resolve);
          },
        );

        const fileStats = await stat(`${DIRECTORY_PATH}/node_modules`);
        await deleteContentStructure();

        expect(fileStats).to.exist;
        expect(fileStats.isFile()).to.equal(true);
      },
    );
  },
);
