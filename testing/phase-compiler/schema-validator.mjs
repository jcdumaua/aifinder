import { compareUtf8, deepFreeze } from './canonical.mjs';
import { DiagnosticError, diagnostic } from './error-catalog.mjs';

export const SUPPORTED_SCHEMA_KEYWORDS = Object.freeze([
  '$id',
  '$schema',
  'additionalProperties',
  'const',
  'description',
  'enum',
  'items',
  'maxItems',
  'maxLength',
  'maximum',
  'minItems',
  'minLength',
  'minimum',
  'pattern',
  'properties',
  'required',
  'title',
  'type',
  'uniqueItems',
].sort(compareUtf8));

const SUPPORTED = new Set(SUPPORTED_SCHEMA_KEYWORDS);
const TYPES = new Set(['array', 'boolean', 'integer', 'null', 'number', 'object', 'string']);
const MAX_VALIDATION_DEPTH = 64;

function pointerJoin(pointer, token) {
  return `${pointer}/${String(token).replace(/~/gu, '~0').replace(/\//gu, '~1')}`;
}

function schemaFailure(code, pointer, evidence) {
  throw new DiagnosticError(code, {
    location_json_pointer: pointer,
    sanitized_evidence: evidence,
  });
}

function assertNonNegativeSafeInteger(value, pointer) {
  if (!Number.isSafeInteger(value) || value < 0) {
    schemaFailure('SCHEMA_INVALID', pointer, { reason: 'expected non-negative safe integer' });
  }
}

function inspectSchema(schema, pointer, depth) {
  if (depth > MAX_VALIDATION_DEPTH) schemaFailure('SCHEMA_DEPTH_EXCEEDED', pointer);
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    schemaFailure('SCHEMA_INVALID', pointer, { reason: 'schema must be an object' });
  }
  for (const keyword of Object.keys(schema).sort(compareUtf8)) {
    if (!SUPPORTED.has(keyword)) {
      schemaFailure('SCHEMA_UNSUPPORTED_KEYWORD', pointerJoin(pointer, keyword), { keyword });
    }
  }
  if (typeof schema.type !== 'string' || !TYPES.has(schema.type)) {
    schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'type'), { reason: 'unsupported or missing type' });
  }
  if (schema.type === 'object') {
    if (schema.additionalProperties !== false) {
      schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'additionalProperties'), {
        reason: 'object schemas must be closed',
      });
    }
    if (schema.properties === null || typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
      schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'properties'), { reason: 'properties object required' });
    }
    const propertyNames = Object.keys(schema.properties);
    if (schema.required !== undefined) {
      if (!Array.isArray(schema.required) || !schema.required.every((item) => typeof item === 'string')) {
        schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'required'), { reason: 'string array required' });
      }
      if (new Set(schema.required).size !== schema.required.length) {
        schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'required'), { reason: 'duplicate required property' });
      }
      for (const required of schema.required) {
        if (!propertyNames.includes(required)) {
          schemaFailure('SCHEMA_INVALID', pointerJoin(pointerJoin(pointer, 'required'), required), {
            reason: 'required property is not declared',
          });
        }
      }
    }
    for (const propertyName of propertyNames.sort(compareUtf8)) {
      inspectSchema(schema.properties[propertyName], pointerJoin(pointerJoin(pointer, 'properties'), propertyName), depth + 1);
    }
  }
  if (schema.type === 'array') {
    if (schema.items === undefined) schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'items'), { reason: 'items required' });
    inspectSchema(schema.items, pointerJoin(pointer, 'items'), depth + 1);
  }
  for (const bound of ['minItems', 'maxItems', 'minLength', 'maxLength']) {
    if (schema[bound] !== undefined) assertNonNegativeSafeInteger(schema[bound], pointerJoin(pointer, bound));
  }
  for (const bound of ['minimum', 'maximum']) {
    if (schema[bound] !== undefined && !Number.isSafeInteger(schema[bound])) {
      schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, bound), { reason: 'safe integer bound required' });
    }
  }
  if (schema.pattern !== undefined) {
    if (typeof schema.pattern !== 'string') schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'pattern'));
    try {
      new RegExp(schema.pattern, 'u');
    } catch {
      schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'pattern'), { reason: 'invalid pattern' });
    }
  }
  if (schema.enum !== undefined && (!Array.isArray(schema.enum) || schema.enum.length === 0)) {
    schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'enum'), { reason: 'non-empty enum required' });
  }
  if (schema.uniqueItems !== undefined && typeof schema.uniqueItems !== 'boolean') {
    schemaFailure('SCHEMA_INVALID', pointerJoin(pointer, 'uniqueItems'));
  }
}

export function assertSupportedSchema(schema) {
  inspectSchema(schema, '', 0);
  return deepFreeze(schema);
}

function actualType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isSafeInteger(value)) return 'integer';
  if (typeof value === 'number') return 'number';
  return typeof value;
}

function equalJson(left, right) {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    return left.length === right.length && left.every((item, index) => equalJson(item, right[index]));
  }
  const leftKeys = Object.keys(left).sort(compareUtf8);
  const rightKeys = Object.keys(right).sort(compareUtf8);
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && equalJson(left[key], right[key]));
}

function pushDiagnostic(diagnostics, pointer, evidence) {
  diagnostics.push(
    diagnostic('SCHEMA_VALIDATION', {
      location_json_pointer: pointer,
      sanitized_evidence: evidence,
    }),
  );
}

function validateNode(value, schema, pointer, depth, diagnostics) {
  if (depth > MAX_VALIDATION_DEPTH) {
    diagnostics.push(diagnostic('SCHEMA_DEPTH_EXCEEDED', { location_json_pointer: pointer }));
    return;
  }
  const type = actualType(value);
  if (schema.type === 'number' ? type !== 'number' && type !== 'integer' : type !== schema.type) {
    pushDiagnostic(diagnostics, pointer, { expected: schema.type, actual: type });
    return;
  }
  if (schema.const !== undefined && !equalJson(value, schema.const)) {
    pushDiagnostic(diagnostics, pointer, { constraint: 'const' });
  }
  if (schema.enum !== undefined && !schema.enum.some((candidate) => equalJson(value, candidate))) {
    pushDiagnostic(diagnostics, pointer, { constraint: 'enum' });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'minLength', bound: schema.minLength });
    }
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'maxLength', bound: schema.maxLength });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'pattern' });
    }
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    if (!Number.isSafeInteger(value)) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'safeInteger' });
      return;
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'minimum', bound: schema.minimum });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'maximum', bound: schema.maximum });
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'minItems', bound: schema.minItems });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'maxItems', bound: schema.maxItems });
    }
    if (schema.uniqueItems && value.some((item, index) => value.slice(0, index).some((prior) => equalJson(item, prior)))) {
      pushDiagnostic(diagnostics, pointer, { constraint: 'uniqueItems' });
    }
    value.forEach((item, index) => validateNode(item, schema.items, pointerJoin(pointer, index), depth + 1, diagnostics));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties;
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) {
        pushDiagnostic(diagnostics, pointerJoin(pointer, required), { constraint: 'required' });
      }
    }
    for (const key of Object.keys(value).sort(compareUtf8)) {
      if (!Object.hasOwn(properties, key)) {
        pushDiagnostic(diagnostics, pointerJoin(pointer, key), { constraint: 'additionalProperties' });
      } else {
        validateNode(value[key], properties[key], pointerJoin(pointer, key), depth + 1, diagnostics);
      }
    }
  }
}

export function validateSchema(value, schema) {
  assertSupportedSchema(schema);
  const diagnostics = [];
  validateNode(value, schema, '', 0, diagnostics);
  return deepFreeze({ valid: diagnostics.length === 0, diagnostics });
}

export function assertSchema(value, schema) {
  const result = validateSchema(value, schema);
  if (!result.valid) throw new DiagnosticError(result.diagnostics[0].code, result.diagnostics[0]);
  return value;
}
