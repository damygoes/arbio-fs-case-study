export const SCHEMA_VERSION = '1.0.0';
export const COMPATIBLE_VERSIONS = ['1.x.x'];

export function isCompatibleVersion(version: string): boolean {
  const [major] = version.split('.');
  const [compatibleMajor] = COMPATIBLE_VERSIONS[0].split('.');
  return major === compatibleMajor;
}

export function validateSchemaCompatibility(requiredVersion?: string): void {
  if (requiredVersion && !isCompatibleVersion(requiredVersion)) {
    throw new Error(
      `Schema version incompatible. Current: ${SCHEMA_VERSION}, Required: ${requiredVersion}`
    );
  }
}