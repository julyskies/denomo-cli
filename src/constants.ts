export const ERROR_MESSAGES = {
  couldNotAccessTheModule: 'Could not access the module!',
  couldNotAccessTheProvidedPath: 'Could not access the provided path!',
  pathIsRequired: 'Path is required!',
  pleaseProvideThePath: 'Please provide the path!',
  providedPathIsInvalid: 'Provided path is invalid!',
  systemRootIsNotAValidPath: 'System root is not a valid path!',
} as const;

export const HANDLER_TYPES = {
  message: 'message',
  close: 'close',
} as const;
