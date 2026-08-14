const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

export const parseAllowedOrigins = (configuredOrigins?: string): string[] => {
  const origins = configuredOrigins
    ? configuredOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;

  if (origins.includes('*')) {
    throw new Error('CORS configuration error: wildcard origins are forbidden when credentials are enabled');
  }

  return [...new Set(origins)];
};
