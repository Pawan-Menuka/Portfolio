import { ApiError } from '../utils/ApiError.js';

// `source` defaults to 'body' so every existing call site is unaffected;
// pass 'query' to validate query-string params instead (e.g. a DELETE with
// no body).
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const message = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ApiError(400, message);
  }
  if (source === 'query') {
    // Express 5 exposes req.query through a prototype getter. Shadow it on
    // this request with the parsed, validated value instead of assigning to
    // the getter (which throws in strict mode).
    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: false,
      configurable: true,
      enumerable: true,
    });
  } else {
    req[source] = result.data;
  }
  next();
};
