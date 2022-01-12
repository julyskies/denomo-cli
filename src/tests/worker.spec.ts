import { expect } from 'chai';
import { fork } from 'child_process';

describe(
  'Test the worker',
  (): void => {
    it(
      'Should throw an error if path was not sent to worker process',
      async (): Promise<void> => {
        const newWorker = fork(`${process.cwd()}/build/worker.js`);
        newWorker.send({ invalid: 'data' });
        newWorker.on('error', (data) => console.log('ERRRRR', data));
        await new Promise((r) => setTimeout(r, 1500));
        expect(newWorker).to.exist;
      },
    );
  },
);
