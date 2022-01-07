import { readdir, rm, stat } from 'fs/promises';
import { Stats } from 'fs';

import logger from './logger';

export default async function parse(path: string): Promise<any> {
  logger('ON PATH', path);
  if (!path) {
    throw new Error('Path is required!');
  }

  const contents = await readdir(path);
  if (contents.length === 0) {
    logger('Done!');
    return process.exit(0);
  }

  const contentStats = await Promise.all(
    contents.map(
      (entry: string): Promise<Stats> => stat(`${path}/${entry}`),
    ),
  );

  const [directories, unlinkArray] = contentStats.reduce(
    (array, item: Stats, index: number) => {
      if (item.isDirectory()) {
        const [itemName] = contents[index].split('/').slice(-1);
        if (itemName === 'node_modules') {
          return [
            [...array[0]],
            [
              ...array[1],
              contents[index],
            ],
          ];
        }
        return [
          [
            ...array[0],
            contents[index],
          ],
          [...array[1]],
        ];
      }
      return array;
    },
    [[] as string[], [] as string[]],
  );

  if (unlinkArray.length > 0) {
    // eslint-disable-next-line
    for await (const i of unlinkArray) {
      logger('Delete', `${path}/${i}`);
      await rm(
        `${path}/${i}`,
        {
          recursive: true,
        },
      );
    }
  }

  return directories.forEach((directoryPath) => parse(`${path}/${directoryPath}`));
}
