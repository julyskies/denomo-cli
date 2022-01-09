export interface MessageToWorker {
  path: string;
}

export interface MessageToParent {
  directories: string[];
}

export interface NodeError extends Error {
  code: string;
}
