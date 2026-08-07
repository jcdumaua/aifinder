import { createHash } from 'node:crypto';
import { DiagnosticError } from './error-catalog.mjs';

export const CANONICAL_LIMITS = Object.freeze({
  maxBytes: 1024 * 1024,
  maxDepth: 64,
  maxStringBytes: 64 * 1024,
  maxArrayItems: 4096,
  maxObjectKeys: 4096,
});

export function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function fail(code, pointer, evidence = {}) {
  throw new DiagnosticError(code, {
    location_json_pointer: pointer,
    sanitized_evidence: evidence,
  });
}

function assertUnicodeString(value, pointer) {
  if (value.normalize('NFC') !== value) fail('UNICODE_NOT_NFC', pointer);
  if (/\p{Surrogate}/u.test(value)) fail('UNICODE_LONE_SURROGATE', pointer);
  if (value.includes('\u0000')) fail('NUL_BYTE_FORBIDDEN', pointer);
  if (Buffer.byteLength(value) > CANONICAL_LIMITS.maxStringBytes) {
    fail('INPUT_TOO_LARGE', pointer, { kind: 'string' });
  }
  return value;
}

export function decodeUtf8(bytes, { forbidBom = true, forbidNul = true, forbidCr = true } = {}) {
  const input = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (input.length > CANONICAL_LIMITS.maxBytes) fail('INPUT_TOO_LARGE', '');
  if (forbidBom && input.length >= 3 && input[0] === 0xef && input[1] === 0xbb && input[2] === 0xbf) {
    fail('UTF8_BOM_FORBIDDEN', '');
  }
  if (forbidNul && input.includes(0)) fail('NUL_BYTE_FORBIDDEN', '');
  if (forbidCr && input.includes(13)) fail('CARRIAGE_RETURN_FORBIDDEN', '');
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(input);
  } catch {
    fail('INVALID_UTF8', '');
  }
}

function pointerJoin(pointer, token) {
  const escaped = String(token).replace(/~/gu, '~0').replace(/\//gu, '~1');
  return `${pointer}/${escaped}`;
}

function defineOwn(target, key, value) {
  Object.defineProperty(target, key, { value, enumerable: true, configurable: true, writable: true });
}

class StrictJsonParser {
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue('', 0);
    this.skipWhitespace();
    if (this.index !== this.text.length) this.syntax('trailing content');
    return value;
  }

  syntax(reason, pointer = '') {
    fail('JSON_SYNTAX', pointer, { offset: this.index, reason });
  }

  skipWhitespace() {
    while (' \n\t'.includes(this.text[this.index] ?? '\0')) this.index += 1;
  }

  parseValue(pointer, depth) {
    if (depth > CANONICAL_LIMITS.maxDepth) fail('JSON_DEPTH_EXCEEDED', pointer);
    this.skipWhitespace();
    const character = this.text[this.index];
    if (character === '{') return this.parseObject(pointer, depth + 1);
    if (character === '[') return this.parseArray(pointer, depth + 1);
    if (character === '"') return assertUnicodeString(this.parseString(pointer), pointer);
    if (character === 't' && this.consumeLiteral('true')) return true;
    if (character === 'f' && this.consumeLiteral('false')) return false;
    if (character === 'n' && this.consumeLiteral('null')) return null;
    if (character === '-' || (character >= '0' && character <= '9')) return this.parseNumber(pointer);
    this.syntax('expected value', pointer);
  }

  consumeLiteral(literal) {
    if (this.text.slice(this.index, this.index + literal.length) !== literal) return false;
    this.index += literal.length;
    return true;
  }

  parseObject(pointer, depth) {
    this.index += 1;
    const output = {};
    const keys = new Set();
    this.skipWhitespace();
    if (this.text[this.index] === '}') {
      this.index += 1;
      return output;
    }
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] !== '"') this.syntax('expected object key', pointer);
      const key = assertUnicodeString(this.parseString(pointer), pointer);
      const keyPointer = pointerJoin(pointer, key);
      if (keys.has(key)) fail('JSON_DUPLICATE_KEY', keyPointer, { key });
      keys.add(key);
      if (keys.size > CANONICAL_LIMITS.maxObjectKeys) fail('INPUT_TOO_LARGE', pointer, { kind: 'object' });
      this.skipWhitespace();
      if (this.text[this.index] !== ':') this.syntax('expected colon', keyPointer);
      this.index += 1;
      defineOwn(output, key, this.parseValue(keyPointer, depth));
      this.skipWhitespace();
      if (this.text[this.index] === '}') {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ',') this.syntax('expected comma', pointer);
      this.index += 1;
    }
  }

  parseArray(pointer, depth) {
    this.index += 1;
    const output = [];
    this.skipWhitespace();
    if (this.text[this.index] === ']') {
      this.index += 1;
      return output;
    }
    while (true) {
      if (output.length >= CANONICAL_LIMITS.maxArrayItems) fail('INPUT_TOO_LARGE', pointer, { kind: 'array' });
      output.push(this.parseValue(pointerJoin(pointer, output.length), depth));
      this.skipWhitespace();
      if (this.text[this.index] === ']') {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ',') this.syntax('expected comma', pointer);
      this.index += 1;
    }
  }

  parseString(pointer) {
    const start = this.index;
    this.index += 1;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === '"') {
        this.index += 1;
        const token = this.text.slice(start, this.index);
        try {
          return JSON.parse(token);
        } catch {
          this.syntax('invalid string escape', pointer);
        }
      }
      if (character === '\\') {
        this.index += 1;
        const escape = this.text[this.index];
        if (escape === 'u') {
          const digits = this.text.slice(this.index + 1, this.index + 5);
          if (!/^[0-9a-fA-F]{4}$/u.test(digits)) this.syntax('invalid unicode escape', pointer);
          this.index += 5;
          continue;
        }
        if (!'"\\/bfnrt'.includes(escape ?? '')) this.syntax('invalid string escape', pointer);
      } else {
        if (character.codePointAt(0) < 0x20) this.syntax('unescaped control character', pointer);
      }
      this.index += 1;
    }
    this.syntax('unterminated string', pointer);
  }

  parseNumber(pointer) {
    const remainder = this.text.slice(this.index);
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(remainder);
    if (match === null) this.syntax('invalid number', pointer);
    const token = match[0];
    this.index += token.length;
    if (token.includes('.') || /[eE]/u.test(token)) this.syntax('floating point numbers are forbidden', pointer);
    const value = Number(token);
    if (!Number.isFinite(value)) fail('JSON_SYNTAX', pointer, { reason: 'non-finite number' });
    if (!Number.isSafeInteger(value)) {
      fail('JSON_UNSAFE_INTEGER', pointer);
    }
    return value;
  }
}

export function parseStrictJson(bytes, options = undefined) {
  return new StrictJsonParser(decodeUtf8(bytes, options)).parse();
}

function canonicalCopy(value, pointer, setPointers, depth, seen) {
  if (depth > CANONICAL_LIMITS.maxDepth) fail('JSON_DEPTH_EXCEEDED', pointer);
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return assertUnicodeString(value, pointer);
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) fail('JSON_UNSAFE_INTEGER', pointer);
    return value;
  }
  if (typeof value !== 'object' || value === undefined) fail('JSON_SYNTAX', pointer, { reason: 'non-JSON value' });
  if (seen.has(value)) fail('JSON_SYNTAX', pointer, { reason: 'cyclic value' });
  seen.add(value);
  if (Array.isArray(value)) {
    let output = value.map((item, index) => canonicalCopy(item, pointerJoin(pointer, index), setPointers, depth + 1, seen));
    if (setPointers.has(pointer)) {
      output = output.sort((left, right) =>
        Buffer.compare(Buffer.from(JSON.stringify(left)), Buffer.from(JSON.stringify(right))),
      );
    }
    seen.delete(value);
    return output;
  }
  const output = {};
  for (const key of Object.keys(value).sort(compareUtf8)) {
    assertUnicodeString(key, pointerJoin(pointer, key));
    defineOwn(output, key, canonicalCopy(value[key], pointerJoin(pointer, key), setPointers, depth + 1, seen));
  }
  seen.delete(value);
  return output;
}

export function canonicalize(value, { setPointers = [] } = {}) {
  return canonicalCopy(value, '', new Set(setPointers), 0, new WeakSet());
}

export function canonicalJsonBuffer(value, options = undefined) {
  return Buffer.from(`${JSON.stringify(canonicalize(value, options), null, 2)}\n`, 'utf8');
}

export function bufferIdentity(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  let lf = 0;
  let cr = 0;
  for (const byte of buffer) {
    if (byte === 10) lf += 1;
    if (byte === 13) cr += 1;
  }
  return Object.freeze({
    sha256: createHash('sha256').update(buffer).digest('hex'),
    bytes: buffer.length,
    lf,
    cr,
  });
}

export function semanticDigest(role, bytes) {
  const input = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return createHash('sha256')
    .update(Buffer.from(`AIFINDER_PHASE_COMPILER_V1\u0000${role}\u0000`, 'utf8'))
    .update(input)
    .digest('hex');
}

export function repositorySnapshotDigest(snapshotWithoutDigestAndMarker) {
  return semanticDigest('repository-snapshot', canonicalJsonBuffer(snapshotWithoutDigestAndMarker));
}

export function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}
