import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  Users,
  AlertCircle,
  MessageSquare,
  Star,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface AgencyNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** key into the dashboard badge counts, when this item shows a count */
  badgeKey?: "pendingRequests" | "openIssues" | "unreadMessages";
  /** match nested routes as active (e.g. /agency/requests/[id]) */
  matchPrefix?: boolean;
}

export const AGENCY_NAV: AgencyNavItem[] = [
  { title: "Dashboard", url: "/agency", icon: LayoutDashboard },
  { title: "Inquiries", url: "/agency/requests", icon: Inbox, badgeKey: "pendingRequests", matchPrefix: true },
  { title: "Placements", url: "/agency/placements", icon: ClipboardList, matchPrefix: true },
  { title: "Workers", url: "/agency/workers", icon: Users, matchPrefix: true },
  { title: "Issues & Escalations", url: "/agency/issues", icon: AlertCircle, badgeKey: "openIssues", matchPrefix: true },
  { title: "Messages", url: "/agency/messages", icon: MessageSquare, badgeKey: "unreadMessages", matchPrefix: true },
  { title: "Reviews", url: "/agency/reviews", icon: Star, matchPrefix: true },
  { title: "Payments", url: "/agency/payments", icon: CreditCard, matchPrefix: true },
  { title: "Documents", url: "/agency/documents", icon: FileText, matchPrefix: true },
  { title: "Reports", url: "/agency/reports", icon: BarChart3, matchPrefix: true },
  { title: "Settings", url: "/agency/settings", icon: Settings, matchPrefix: true },
];
