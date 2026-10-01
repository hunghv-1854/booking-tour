export function selectColumns(
  alias: string,
  select: Record<string, unknown>,
): string[] {
  return Object.keys(select).map((field) => `${alias}.${field}`);
}
