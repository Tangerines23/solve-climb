import { z } from 'zod';

function validateNumberParam(
  value: string | null,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (!value) return null;

  const schema = z.coerce.number().min(min).max(max).nullable().catch(null);

  const result = schema.safeParse(value);
  console.log('Result for', value, ':', result);
  return result.success ? result.data : null;
}

console.log('Test 1:', validateNumberParam('1', 1, 20));
console.log('Test 2:', validateNumberParam(null, 1, 20));
console.log('Test 3:', validateNumberParam('abc', 1, 20));
console.log('Test 4:', validateNumberParam('21', 1, 20));
