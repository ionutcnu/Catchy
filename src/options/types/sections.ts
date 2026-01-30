/**
 * Section identifiers for the settings page navigation
 */
export type SectionId =
  | 'global'
  | 'position'
  | 'errors'
  | 'persite'
  | 'display'
  | 'history'
  | 'ignored'
  | 'visual'
  | 'about';

/**
 * Ensures exhaustive handling of all section IDs in switch statements
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled section: ${value}`);
}
