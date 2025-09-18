import {CloudFunctionMetadata, RouteConfig} from '../types/cloud';
import {CloudFunctionRegistry} from './registry';

export function CloudFunction(config: RouteConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor?: PropertyDescriptor | undefined
  ) {
    // Handle both static and instance methods
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }

    if (!descriptor) {
      throw new Error(`Descriptor not found for property ${propertyKey}`);
    }

    const originalMethod = descriptor.value;

    // Wrap the original method with role checking
    descriptor.value = async function (...args: any[]) {
      const request = args[0] as Parse.Cloud.FunctionRequest;

      // Check role-based authorization if configured
      if (config.requireRoles) {
        await checkUserRoles(request, config);
      }

      return originalMethod.apply(this, args);
    };

    const metadata: CloudFunctionMetadata = {
      name: propertyKey,
      config,
      handler: descriptor.value,
    };
    // Register with our registry
    CloudFunctionRegistry.register(metadata);

    return descriptor;
  };
}

/**
 * Check if user has required roles
 */
async function checkUserRoles(
  request: Parse.Cloud.FunctionRequest,
  config: RouteConfig
): Promise<void> {
  const user = request.user;

  // Require authentication
  if (!user) {
    throw new Parse.Error(
      Parse.Error.OBJECT_NOT_FOUND,
      'Authentication required'
    );
  }

  // No roles required
  if (!config.requireRoles || config.requireRoles.length === 0) {
    return;
  }

  try {
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.containedIn('name', config.requireRoles);
    roleQuery.equalTo('users', user);
    const userRoles = await roleQuery.find({useMasterKey: true});

    let hasPermission = false;

    if (config.requireAllRoles) {
      // User must have ALL specified roles
      const userRoleNames = userRoles.map(role => role.get('name'));
      hasPermission = config.requireRoles.every(role =>
        userRoleNames.includes(role)
      );
    } else {
      // User must have ANY of the specified roles
      hasPermission = userRoles.length > 0;
    }

    if (!hasPermission) {
      const errorMessage =
        config.customErrorMessage ||
        `Access denied. Required ${
          config.requireAllRoles ? 'all' : 'one of'
        } these roles: ${config.requireRoles.join(', ')}`;

      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, errorMessage);
    }
  } catch (error: any) {
    if (error.code === Parse.Error.OPERATION_FORBIDDEN) {
      throw error;
    }
    console.error('Role authorization error:', error);
    throw new Parse.Error(
      Parse.Error.OTHER_CAUSE,
      'Authorization check failed'
    );
  }
}

export function ProtectedCloudFunction(config: Partial<RouteConfig> = {}) {
  return CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
    },
    ...config,
  });
}
