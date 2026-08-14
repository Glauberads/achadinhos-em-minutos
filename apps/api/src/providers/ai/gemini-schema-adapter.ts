import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Adapts a generic JSON Schema (produced by zod-to-json-schema) to the strict subset
 * supported by Gemini REST API (OpenAPI 3.0 subset).
 */
export function toGeminiResponseSchema(zodSchema: any): any {
  const jsonSchema: any = zodToJsonSchema(zodSchema);

  // Gemini does not support these JSON Schema keywords at the top level or nested deeply.
  // We need to recursively sanitize them.
  function sanitize(obj: any) {
    if (Array.isArray(obj)) {
      obj.forEach(sanitize);
    } else if (typeof obj === 'object' && obj !== null) {
      // Remove keys not supported by Gemini
      delete obj['$schema'];
      delete obj['additionalProperties'];
      delete obj['default'];
      delete obj['const'];

      // If it's an array definition, Gemini requires 'items' to be a valid schema type,
      // but zod-to-json-schema might output something Gemini dislikes if it's too complex.
      // Usually, basic string/number arrays are fine.

      // If 'const' was used, we should fall back to just specifying the type.
      // e.g. "const": "v2" -> "type": "string" (zod-to-json-schema includes "type": "string" alongside "const")

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitize(obj[key]);
        }
      }
    }
  }

  sanitize(jsonSchema);
  return jsonSchema;
}
