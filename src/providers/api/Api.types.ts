export interface ApiConfig {
  url: string;
  token?: string;
  revalidate: number;
}

export type ApiParamValue = string | number | boolean | undefined;

export interface ApiRequest {
  endpoint: string;
  params?: Record<string, ApiParamValue>;
  headers?: Record<string, string>;
}

export interface ApiRequestOptions {
  params?: Record<string, ApiParamValue>;
  headers?: Record<string, string>;
  draft?: boolean;
  tags?: string[];
}
