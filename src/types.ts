// import { Serializable } from 'child_process';

export interface MessageToChild {
  path: string;
}

export interface MessageToParent {
  directories: string[];
}
