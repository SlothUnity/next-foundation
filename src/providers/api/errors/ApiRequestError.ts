interface ApiRequestErrorOptions extends ErrorOptions {
  url: string;
  status?: number;
}

export class ApiRequestError extends Error {
  readonly url: string;
  readonly status?: number;

  constructor(message: string, { url, status, ...options }: ApiRequestErrorOptions) {
    super(message, options);
    this.name = 'ApiRequestError';
    this.url = url;
    this.status = status;
  }
}
