export class AIProviderError extends Error {
  public provider: string;
  public operation: string;

  constructor(message: string, provider: string = 'unknown', operation: string = 'generate') {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.operation = operation;
    Object.setPrototypeOf(this, AIProviderError.prototype);
  }
}

export class AIResponseValidationError extends AIProviderError {
  constructor(message: string, provider: string = 'unknown', operation: string = 'generate') {
    super(message, provider, operation);
    this.name = 'AIResponseValidationError';
    Object.setPrototypeOf(this, AIResponseValidationError.prototype);
  }
}

export class AIConfigurationError extends AIProviderError {
  constructor(message: string, provider: string = 'unknown', operation: string = 'init') {
    super(message, provider, operation);
    this.name = 'AIConfigurationError';
    Object.setPrototypeOf(this, AIConfigurationError.prototype);
  }
}
