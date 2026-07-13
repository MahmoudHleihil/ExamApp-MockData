export function checkPermission(tool, context) {
  if (!context?.user) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!tool.permissions || tool.permissions.length === 0) {
    return;
  }

  if (!tool.permissions.includes(context.user.role)) {
    const error = new Error(
      `Forbidden: ${context.user.role} cannot use tool ${tool.name}`
    );
    error.statusCode = 403;
    throw error;
  }
}