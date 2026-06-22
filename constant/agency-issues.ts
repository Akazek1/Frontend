export const ISSUE_TYPE_LABEL: Record<string, string> = {
  NO_SHOW: "Didn't show up",
  MISCONDUCT: "Misconduct",
  POOR_PERFORMANCE: "Poor performance",
  SAFETY_CONCERN: "Safety concern",
  OTHER: "Other",
};

export const ISSUE_STATUS: Record<string, { label: string; tone: "red" | "amber" | "green" }> = {
  REPORTED: { label: "Reported", tone: "red" },
  AGENCY_NOTIFIED: { label: "In Progress", tone: "amber" },
  RESOLVED: { label: "Resolved", tone: "green" },
};
