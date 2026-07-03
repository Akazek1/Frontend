/**
 * Localized taxonomy (grouping / service type) name. Falls back to the English
 * `name` whenever the active locale's translation is empty, so an untranslated
 * item never renders blank — English is the default for any missing language.
 */
export function localizedName(
  item: { name: string; nameKn?: string | null },
  locale: string,
): string {
  if (locale === "rw") return item.nameKn?.trim() || item.name;
  return item.name;
}
