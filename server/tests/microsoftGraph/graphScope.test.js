import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeGraphScope } from '../../config.js';

const DEFAULT_SCOPE = 'https://graph.microsoft.com/Mail.Send offline_access';

test('strips double quotes that a deployment platform stored literally', () => {
  // Vercel does not strip quotes like dotenv does; Microsoft then rejects the
  // scope with AADSTS70011 invalid_scope.
  assert.equal(normalizeGraphScope(`"${DEFAULT_SCOPE}"`), DEFAULT_SCOPE);
});

test('strips single quotes', () => {
  assert.equal(normalizeGraphScope(`'${DEFAULT_SCOPE}'`), DEFAULT_SCOPE);
});

test('leaves an unquoted scope unchanged', () => {
  assert.equal(normalizeGraphScope(DEFAULT_SCOPE), DEFAULT_SCOPE);
});

test('trims surrounding whitespace', () => {
  assert.equal(normalizeGraphScope(`  ${DEFAULT_SCOPE}  `), DEFAULT_SCOPE);
});

test('does not mangle a value with a lone unbalanced quote', () => {
  const unbalanced = '"https://graph.microsoft.com/Mail.Send';
  assert.equal(normalizeGraphScope(unbalanced), unbalanced);
});
