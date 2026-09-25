import type { ApiError } from "./ApiError";

export type ErrorAdapter = (error: unknown) => ApiError | undefined;

export interface ErrorRequestContext {
  requestId: string;
  method: string;
  url: string;
  path: string;
}

export interface ErrorLogContext extends ErrorRequestContext {
  statusCode: number;
  code?: string;
  errorName: string;
}

export interface ErrorSerializationContext extends ErrorRequestContext {
  isProduction: boolean;
  exposeMessage: boolean;
  includeStack: boolean;
}

export type ErrorExposurePolicy =
  | boolean
  | ((error: ApiError, context: ErrorRequestContext) => boolean);

export type ErrorResponseSerializer = (
  error: ApiError,
  context: ErrorSerializationContext,
) => unknown;

export type ErrorResponseFormat = "legacy" | "problem";

export interface RequestIdOptions {
  headerName?: string;
  generator?: () => string;
}

export interface ErrorMiddlewareOptions {
  logger?: (error: unknown, context: ErrorLogContext) => void;
  showStack?: boolean;
  expose?: ErrorExposurePolicy;
  responseFormat?: ErrorResponseFormat;
  serializer?: ErrorResponseSerializer;
  requestId?: RequestIdOptions;
  adapters?: readonly ErrorAdapter[] | ErrorAdapterRegistry;
}

export class ErrorAdapterRegistry {
  private readonly registeredAdapters: ErrorAdapter[];

  public constructor(adapters: readonly ErrorAdapter[] = []) {
    this.registeredAdapters = [...adapters];
  }

  public register(adapter: ErrorAdapter): this {
    this.registeredAdapters.push(adapter);
    return this;
  }

  public registerMany(adapters: readonly ErrorAdapter[]): this {
    this.registeredAdapters.push(...adapters);
    return this;
  }

  public getAdapters(): readonly ErrorAdapter[] {
    return this.registeredAdapters;
  }
}
