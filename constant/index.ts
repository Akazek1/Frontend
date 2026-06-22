import { NavItem } from "@/types";

export const navItems: NavItem[] = [
  { title: "Home", url: "/", icon: "HomeIcon" },
  { title: "Work", url: "/work", icon: "BriefcaseBusiness", matchPattern: "/work/*" },
  { title: "Message", url: "/conversations", icon: "MessageIcon" },
  {
    title: "More",
    url: "/more",
    icon: "SettingIcon",
    matchPattern: "/more/*",
  },
];

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const CHAT_WINDOW_HOURS = 72;

// After this many messages on a still-PENDING booking, surface a gentle,
// non-blocking nudge encouraging users to confirm the work through Akazek
// instead of arranging it informally in chat.
export const PENDING_NUDGE_MESSAGE_THRESHOLD = 6;

// Preset text sent when an employer taps "Remind" on the pending nudge.
// Shared so the recipient's client can recognise it and re-surface the
// nudge (with its Accept button) even after they dismissed it.
export const PENDING_REMINDER_MESSAGE =
  "Hi, can you accept the offer here so we can start? Thanks!";

export const PrivacyPolicyData = [
  {
    id: 1,
    title: "Information We Collect",
    content:
      "Akazek collects personal information to provide, maintain, and improve our marketplace services. This includes: (1) Account Information: name, phone number, email address, profile picture, and gender when you create an account; (2) Verification Information: government-issued ID documents for workers to verify their identity and qualifications; (3) Service Information: for workers, we collect details about services offered, pricing, availability, and service areas; (4) Booking Information: dates, times, locations, and notes related to service bookings; (5) Communication Data: messages exchanged between employers and workers; (6) Payment Information: transaction history and payment method details (processed securely through payment processors); (7) Device Information: IP address, browser type, device type, and usage patterns to improve user experience; (8) Location Data: with your permission, we collect location information to help match employers with nearby workers.",
  },
  {
    id: 2,
    title: "How We Use Your Information",
    content:
      "We use the information we collect for the following purposes: (1) Providing Services: to facilitate connections between employers and service workers, process bookings, and manage the marketplace; (2) Verification & Safety: to verify worker credentials, conduct background checks where applicable, and ensure platform safety; (3) Communication: to send SMS notifications (for OTP verification, booking updates), email confirmations, and in-app messages; (4) Personalization: to customize your experience, show relevant services or job opportunities based on your location and preferences; (5) Payments: to process payments securely and provide transaction records; (6) Support: to respond to your inquiries, resolve disputes, and provide customer support; (7) Analytics: to understand how the platform is used and improve features and functionality; (8) Legal Compliance: to comply with applicable laws, regulations, and legal requests; (9) Marketing: with your consent, to send promotional offers and updates about new features (you can opt-out anytime).",
  },
  {
    id: 3,
    title: "Data Security",
    content:
      "We implement industry-standard security measures to protect your personal information, including encryption of sensitive data, secure server infrastructure, and restricted access controls. However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials. If you suspect unauthorized access, please contact support immediately at support@akazek.rw.",
  },
  {
    id: 4,
    title: "Sharing Your Information",
    content:
      "We do not sell your personal information. We share information only in the following circumstances: (1) With Service Providers: payment processors, SMS providers, and hosting services that assist us in operating the platform; (2) Between Users: employers and workers exchange necessary information to complete bookings (name, phone, location); (3) With Law Enforcement: when required by law or to comply with legal processes; (4) Business Transfers: if Akazek is acquired or merged, user information may be transferred as part of that transaction; (5) Aggregated Data: we may share anonymized, aggregated analytics with partners and researchers.",
  },
  {
    id: 5,
    title: "Your Rights & Choices",
    content:
      "You have the right to: (1) Access Your Data: request a copy of personal information we hold about you; (2) Correct Information: update or correct inaccurate information in your profile; (3) Delete Data: request deletion of your account and associated data (subject to legal retention requirements); (4) Opt-Out: decline marketing communications and non-essential notifications; (5) Data Portability: request your data in a portable format. To exercise these rights, contact support@akazek.rw with your request. We will respond within 30 days.",
  },
  {
    id: 6,
    title: "Third-Party Links",
    content:
      "Akazek may contain links to third-party websites and services. We are not responsible for the privacy practices of these external sites. Please review their privacy policies before providing personal information.",
  },
  {
    id: 7,
    title: "Policy Updates",
    content:
      "We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. We will notify you of significant changes via email or through the app. Your continued use of Akazek after changes constitutes acceptance of the updated policy.",
  },
  {
    id: 8,
    title: "Contact Us",
    content:
      "If you have questions about this Privacy Policy or our privacy practices, please contact us at: Akazek Rwanda Ltd, Kigali, Rwanda. Email: support@akazek.rw. Phone: +250788000000. We are committed to resolving any privacy concerns.",
  },
];

export const TermsAndConditionsData = [
  {
    id: 1,
    title: "Acceptance of Terms",
    content:
      "By accessing and using Akazek, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not use our services. Akazek reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to the platform.",
  },
  {
    id: 2,
    title: "User Accounts & Eligibility",
    content:
      "To use Akazek, you must be at least 18 years old and a resident of Rwanda. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate, complete, and current information during registration. Akazek reserves the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.",
  },
  {
    id: 3,
    title: "User Roles: Employers & Workers",
    content:
      "Akazek allows users to be both employers (hiring workers) and workers (offering services). As an Employer: you agree to provide accurate service details, fair compensation, and respectful treatment of workers. As a Worker: you agree to provide quality services as described, maintain professional conduct, and be available during agreed times. You are responsible for your own conduct and the accuracy of information you provide.",
  },
  {
    id: 4,
    title: "Verification & Background Checks",
    content:
      "Workers are required to provide government-issued ID verification. Akazek may conduct background checks or additional verification as deemed necessary for safety. Employers and workers agree to comply with Akazek's verification procedures. Verification does not guarantee safety—users remain responsible for assessing whether to proceed with transactions.",
  },
  {
    id: 5,
    title: "Booking & Payment",
    content:
      "When you book a service, you agree to pay the quoted amount. Payments are processed securely through our payment processor. Payment is due before or at the time of service completion. Cancellations must be made with reasonable notice (minimum 24 hours recommended). Late cancellations may incur fees as outlined in the booking details. Akazek is not responsible for disputes between employers and workers regarding pricing or service quality.",
  },
  {
    id: 6,
    title: "Service Quality & Disputes",
    content:
      "Agazek provides the platform to connect users but does not employ workers or guarantee service quality. Akazek is not responsible for: incomplete or poor quality services, delays, cancellations by workers, or workplace injuries. Disputes between employers and workers are to be resolved directly when possible. For escalated disputes, contact support@akazek.rw with evidence (messages, photos, booking details). Akazek may mediate but reserves the right to determine outcomes.",
  },
  {
    id: 7,
    title: "Prohibited Conduct",
    content:
      "Users agree not to: (1) Provide false or misleading information; (2) Harass, abuse, or discriminate against other users; (3) Engage in illegal activities or violate local laws; (4) Attempt to circumvent payment or verification systems; (5) Share explicit or offensive content; (6) Arrange services outside the platform to avoid fees; (7) Use the platform for human trafficking, fraud, or other crimes. Violation of these terms may result in account suspension or termination.",
  },
  {
    id: 8,
    title: "Safety & Liability",
    content:
      "Employers and workers use Akazek at their own risk. Akazek does not guarantee the safety, reliability, or background of any user. We recommend: meeting in safe public locations, informing others of your whereabouts, verifying worker credentials, and trusting your instincts. Akazek is not liable for personal injury, theft, fraud, or other harm resulting from transactions between users. Users assume all risk associated with using the platform.",
  },
  {
    id: 9,
    title: "Intellectual Property",
    content:
      "All content on Akazek, including logos, text, images, and design, is owned by or licensed to Akazek Rwanda Ltd and protected by copyright law. You may not reproduce, distribute, or use this content without permission. User-generated content (profiles, service descriptions) remains your property, but you grant Akazek a license to use it on the platform.",
  },
  {
    id: 10,
    title: "Limitation of Liability",
    content:
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, AKAZEK AND ITS OWNERS, EMPLOYEES, AND PARTNERS ARE NOT LIABLE FOR: indirect damages, lost profits, lost data, or incidental damages arising from platform use; errors or omissions in content; or unauthorized access to your information. Akazek's total liability is limited to the amount you paid Akazek in the past 12 months.",
  },
  {
    id: 11,
    title: "Termination",
    content:
      "Akazek may suspend or terminate your account for: violation of these terms, fraudulent activity, unpaid fees, or at our sole discretion. Upon termination, your right to use the platform ends immediately. You remain liable for any outstanding fees or damages. Termination does not relieve you of obligations incurred before termination.",
  },
  {
    id: 12,
    title: "Governing Law",
    content:
      "These Terms & Conditions are governed by the laws of Rwanda. Any disputes arising from these terms shall be resolved in the courts of Kigali, Rwanda. You agree to submit to the exclusive jurisdiction of these courts.",
  },
  {
    id: 13,
    title: "Contact & Support",
    content:
      "For questions about these Terms & Conditions or to report violations, contact: support@akazek.rw, Phone: +250788000000. We aim to respond to inquiries within 24-48 hours. This agreement constitutes the entire terms between you and Akazek.",
  },
];
