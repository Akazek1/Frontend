type Localizable = {
  name?: string | null;
  nameKn?: string | null;
  nameFr?: string | null;
};

/**
 * The name to show for a taxonomy row (category / grouping) in the active
 * locale, falling back to the English `name` whenever the translation is empty.
 * So a row with no Kinyarwanda name still renders — it just shows English.
 */
export function localizedName(
  obj: Localizable | null | undefined,
  locale: string,
): string {
  if (!obj) return "";
  const translated =
    locale === "rw" ? obj.nameKn : locale === "fr" ? obj.nameFr : null;
  return (translated && translated.trim()) || obj.name || "";
}
