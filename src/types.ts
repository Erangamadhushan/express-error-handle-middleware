export interface ErrorMiddlewareOptions {
  logger?: (error: unknown) => void;
  showStack?: boolean;
}
