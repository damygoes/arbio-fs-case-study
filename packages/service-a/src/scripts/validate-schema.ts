import { validateSchemaCompatibility } from '@arbio/shared-models';

const expected = process.env.SCHEMA_VERSION || '1.0.0';

try {
  validateSchemaCompatibility(expected);
  console.log(`✅ Schema version ${expected} is compatible`);
} catch (err) {
  console.error('❌ Schema validation failed:', (err as Error).message);
  process.exit(1);
}
