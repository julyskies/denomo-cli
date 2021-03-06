export interface MessageToParent {
  directories: string[];
}

export interface MessageToWorker {
  path: string;
}

export interface NodeError extends Error {
  code: string;
}

export interface TestingError {
  code: number | null;
  error: Buffer;
}
