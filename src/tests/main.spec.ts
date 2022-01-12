import { expect } from 'chai';
import { spawn } from 'child_process';
import { unlink, writeFile } from 'fs/promises';

import { ERROR_MESSAGES } from '../constants';
import { TestingError } from '../types';

const TEST_FILE_PATH = `${process.cwd()}/test`;

async function launchProcess(options?: string[]): Promise<TestingError> {
  const args = [`${process.cwd()}/build/index.js`];
  if (options) {
    args.push(...options);
  }
  const newProcess = spawn('node', args);
  return new Promise<TestingError>(
    (resolve) => {
      let data: Buffer;
      newProcess.on(
        'close',
        (code): void => {
          resolve({
            code,
            error: data,
          });
        },
      );
      newProcess.stderr.on(
        'data',
        (chunk): void => {
          data += chunk;
        },
      );
    },
  );
}

describe(
  'Test the main module',
  (): void => {
    it(
      'Should throw an error if no path was specified',
      async (): Promise<void> => {
        const { code, error } = await launchProcess();
        
        expect(code).to.equal(1);
        expect(error.includes(ERROR_MESSAGES.pleaseProvideThePath)).to.equal(true);
      },
    );
    it(
      'Should throw an error if path is equal to "/"',
      async (): Promise<void> => {
        const { code, error } = await launchProcess(['/'])
        
        expect(code).to.equal(1);
        expect(error.includes(ERROR_MESSAGES.systemRootIsNotAValidPath)).to.equal(true);
      },
    );
    it(
      'Should throw an error if specified path does not exist',
      async (): Promise<void> => {
        const { code, error } = await launchProcess([TEST_FILE_PATH])
        
        expect(code).to.equal(1);
        expect(error.includes(ERROR_MESSAGES.providedPathIsInvalid)).to.equal(true);
      },
    );
    it(
      'Should throw an error if path points to a file',
      async (): Promise<void> => {
        await writeFile(TEST_FILE_PATH, 'Testing');
        const { code, error } = await launchProcess([TEST_FILE_PATH])
        
        await unlink(TEST_FILE_PATH);
        expect(code).to.equal(1);
        expect(error.includes(ERROR_MESSAGES.providedPathIsInvalid)).to.equal(true);
      },
    );
  },
);
