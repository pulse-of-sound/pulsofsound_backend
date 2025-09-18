export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RouteConfig {
  methods: HttpMethod[];
  requiresAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  validation?: Parse.Cloud.Validator;
  description?: string;
  // Role-based authorization
  requireRoles?: string[];
  requireAllRoles?: boolean; // If true, user must have ALL roles (not just any)
  customErrorMessage?: string;
}
export interface CloudFunctionMetadata {
  name: string;
  config: RouteConfig;
  handler: (request: Parse.Cloud.FunctionRequest) => Promise<any> | any;
}
