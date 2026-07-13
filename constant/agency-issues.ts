export function issueTypeLabelMap(t: (key: string) => string): Record<string, string> {
  return {
    NO_SHOW: t("typeNoShow"),
    MISCONDUCT: t("typeMisconduct"),
    POOR_PERFORMANCE: t("typePoorPerformance"),
    SAFETY_CONCERN: t("typeSafetyConcern"),
    OTHER: t("typeOther"),
  };
}

export function issueStatusMap(
  t: (key: string) => string,
): Record<string, { label: string; tone: "red" | "amber" | "green" }> {
  return {
    REPORTED: { label: t("statusReported"), tone: "red" },
    AGENCY_NOTIFIED: { label: t("statusInProgress"), tone: "amber" },
    RESOLVED: { label: t("statusResolved"), tone: "green" },
  };
}
