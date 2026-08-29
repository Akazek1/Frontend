import { NavItem } from "@/types";

export function navItems(t: (key: string) => string): NavItem[] {
  return [
    { title: t("home"), url: "/", icon: "HomeIcon" },
    { title: t("work"), url: "/work", icon: "BriefcaseBusiness", matchPattern: "/work/*" },
    { title: t("message"), url: "/conversations", icon: "MessageIcon" },
    {
      title: t("more"),
      url: "/more",
      icon: "SettingIcon",
      matchPattern: "/more/*",
    },
  ];
}

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const CHAT_WINDOW_HOURS = 72;

// After this many messages on a still-PENDING booking, surface a gentle,
// non-blocking nudge encouraging users to confirm the work through Huza
// instead of arranging it informally in chat.
export const PENDING_NUDGE_MESSAGE_THRESHOLD = 6;

// Preset text sent when an employer taps "Remind" on the pending nudge.
// Shared so the recipient's client can recognise it and re-surface the
// nudge (with its Accept button) even after they dismissed it.
export const PENDING_REMINDER_MESSAGE =
  "Hi, can you accept the offer here so we can start? Thanks!";

// Long-press a chat bubble to react. Kept in sync by hand with the backend's
// allow-list (HWA_Backend/src/modules/bookings/dto/create-booking.dto.ts
// QUICK_REACTION_EMOJIS) — there's no shared package between the two repos.
export const QUICK_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// The emoji double-tapping a bubble reacts with (skin tone applied per user).
export const QUICK_TAP_EMOJI = "👍";

// Fitzpatrick skin-tone modifiers ("" = default yellow). The web can't read the
// OS emoji-tone preference, so users pick their own; it's remembered per device.
export const SKIN_TONES = ["", "🏻", "🏼", "🏽", "🏾", "🏿"];
export const SKIN_TONE_STORAGE_KEY = "hwa.emojiSkinTone";

// Only some emojis have skin-tone variants; the rest are returned unchanged.
const TONE_SUPPORTING = new Set(["👍", "🙏"]);
export function applySkinTone(emoji: string, tone: string): string {
  return tone && TONE_SUPPORTING.has(emoji) ? emoji + tone : emoji;
}
export function supportsSkinTone(emoji: string): boolean {
  return TONE_SUPPORTING.has(emoji);
}

// NOTE: These are the bundled fallback texts. The authoritative versions are the
// admin-managed LegalDocument rows served from GET /legal/:type; keep the two in
// sync when either changes. This copy describes Huza's actual data flows (public
// provider profiles, contact exchange on booking, public reviews, optional social
// showcase) and is written to align with Rwanda's Law No. 058/2021 on the
// protection of personal data. It is a plain-language draft and should be
// reviewed by a qualified lawyer before it is relied on at launch.
export const PrivacyPolicyData = [
  {
    id: 1,
    title: "Who We Are",
    content:
      "Huza is operated by Huza.app LTD, a company registered in Rwanda with its office in Kigali. For the personal data described in this policy, Huza.app LTD is the data controller. This means we decide why and how your personal data is processed, and we are responsible for looking after it in line with Rwanda's Law No. 058/2021 relating to the protection of personal data and privacy. You can reach us about any privacy matter at support@huza.app or +250788000000.",
  },
  {
    id: 2,
    title: "Information We Collect",
    content:
      "We collect the following personal data:\n(1) Account information: your name, phone number, and (if you add them) email address, username, profile photo, gender, date of birth, and a short bio.\n(2) Verification information: for people who offer services, a government-issued ID document and its verification status. This is used to confirm identity and is reviewed by our team.\n(3) Service information: for providers, the services you list, pricing, availability, working areas, experience, languages, and similar profile details you choose to publish.\n(4) Job and booking information: jobs you post, and the dates, times, locations, and notes attached to bookings you make or receive.\n(5) Communications: messages you exchange with other users through Huza, and messages you send to our support team.\n(6) Reviews and ratings: feedback you give or receive after a booking.\n(7) Payment information: transaction records and, where payments run through a payment processor, limited payment method details held by that processor.\n(8) Device and usage information: IP address, device and browser type, app version, push-notification tokens, and how you use the app, collected to keep the service secure and to improve it.\n(9) Location information: with your permission, approximate location to help match you with nearby services or jobs.",
  },
  {
    id: 3,
    title: "How We Use Your Information and Our Legal Basis",
    content:
      "We use your personal data only where the law allows. Our legal bases are:\n(1) Performance of a contract with you - to create and run your account, show your profile, match employers and providers, process jobs and bookings, exchange the contact details needed to complete a booking, carry messages, and take payments.\n(2) Your consent - to send you marketing messages, to use your identifiable photo or profile in Huza's own social media and advertising (a separate opt-in, see section 7), and to use your device location. You can withdraw any consent at any time.\n(3) Our legitimate interests - to verify identity, prevent fraud and abuse, keep users safe, respond to disputes, and analyse and improve the platform, in a way that does not override your rights.\n(4) Legal obligation - to keep records and respond to lawful requests from courts or authorities in Rwanda.",
  },
  {
    id: 4,
    title: "Information That Is Public",
    content:
      "Huza is a public marketplace. If you list a service, your provider profile is visible to anyone who uses Huza, including people who do not have an account, and it may be found through search engines. Your public provider profile can include: your display name, profile photo, bio, gender (only if you choose to show it), the services you offer, pricing, general working areas, experience and languages, your verification badge, your rating, and reviews written about you.\nThe following are never shown publicly: your phone number, email address, exact home address, date of birth, government ID document, and payment details.\nIf you use Huza only to hire, your profile is not listed in the marketplace; the limited details in section 5 are shared only with a provider you actually transact with.",
  },
  {
    id: 5,
    title: "Information Shared Between Users",
    content:
      "To let work actually happen, Huza shares some information directly between the two sides of a booking:\n(1) When a booking is made or accepted, we share each party's name and phone number, and the service location, with the other party. Before that point, a provider and an employer see only what is on the public profile and what they choose to say in chat.\n(2) A job you post is shown to providers whose services match it, so they can offer to take it. Do not include information in a job post that you do not want providers to see.\n(3) Messages you send in a conversation are visible to the other participants in that conversation.",
  },
  {
    id: 6,
    title: "Reviews and Ratings",
    content:
      "After a completed booking, either party may leave a review of the other. Reviews and ratings about a provider are published on that provider's public profile. Reviews are shown with the reviewer's first name and last initial, not their full contact details.\nThe person reviewed can post a public reply to any review about them. We do not remove honest reviews that are based on a real booking simply because the subject disagrees with them. We will remove or edit a review that contains someone's contact details or ID information, hate speech, threats, clearly unlawful content, or content that breaches our guidelines. To report a review, contact support@huza.app.",
  },
  {
    id: 7,
    title: "Marketing and Social Media Showcase",
    content:
      "We will only send you marketing messages, and we will only feature your identifiable photo, name, or profile on Huza's own social media accounts, advertising, or promotional material, if you have given us specific opt-in consent for that purpose. This consent is separate from accepting these documents, and you can give or withdraw it at any time in your account settings or by emailing support@huza.app.\nWithdrawing consent stops any further such use by us. It may not be possible to recover material that has already been published or that other people have re-shared. Running your public provider profile inside the Huza marketplace is part of providing the service (section 4) and does not depend on this marketing consent.",
  },
  {
    id: 8,
    title: "Sharing With Service Providers and Others",
    content:
      "We do not sell your personal data. We share it only in these cases:\n(1) Processors who run parts of the service for us: hosting and database providers, media/image hosting, the SMS provider that sends verification codes and alerts, the push-notification service, and the payment processor. Some of these providers operate outside Rwanda, so your data may be transferred internationally; where that happens we take steps to ensure it remains protected.\n(2) Authorities and legal process: where we are required by law, or to protect the rights, safety, or property of users or Huza.\n(3) Business transfer: if Huza is merged with or acquired by another organisation, user data may transfer as part of that transaction, subject to this policy.\n(4) Aggregated or anonymised data that does not identify you may be shared for research or reporting.",
  },
  {
    id: 9,
    title: "How Long We Keep Your Data",
    content:
      "We keep your personal data for as long as your account is open, and for a limited period afterwards so we can resolve disputes, enforce our terms, and meet legal, tax, and accounting requirements in Rwanda. Transaction and booking records are kept longer than profile content for those reasons. When data is no longer needed we delete it or irreversibly anonymise it. You can ask us to delete your account at any time (see section 11).",
  },
  {
    id: 10,
    title: "Data Security",
    content:
      "We use appropriate technical and organisational measures to protect personal data, including encryption in transit, access controls, and restricted staff access on a need-to-know basis. No system is completely secure, and we cannot guarantee absolute security. You are responsible for keeping your account credentials and PIN confidential. If you think your account has been accessed without your permission, contact support@huza.app immediately.",
  },
  {
    id: 11,
    title: "Your Rights",
    content:
      "Under Rwandan data protection law you have the right to: access the personal data we hold about you; have inaccurate data corrected; ask for your data to be deleted; object to or ask us to restrict certain processing; withdraw consent you have given (for marketing, showcase, or location); and receive a copy of data you provided to us in a portable format.\nTo exercise any of these, email support@huza.app. We will respond within 30 days. If you are not satisfied with how we handle your request, you may lodge a complaint with the supervisory authority for data protection in Rwanda.",
  },
  {
    id: 12,
    title: "Children",
    content:
      "Huza is only for people aged 18 and over. We do not knowingly collect personal data from anyone under 18. If we learn that an account belongs to someone under 18, we will close it and delete the associated data.",
  },
  {
    id: 13,
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy as our practices, technology, or the law change. If a change is significant, we will notify you through the app or by message before it takes effect, and where the law requires it we will ask you to review and accept the updated policy again. The date the current version took effect is shown at the top of this page.",
  },
  {
    id: 14,
    title: "Contact Us",
    content:
      "For any question about this Privacy Policy or your personal data, contact: Huza.app LTD, Kigali, Rwanda. Email: support@huza.app. Phone: +250788000000.",
  },
];

export const TermsAndConditionsData = [
  {
    id: 1,
    title: "Acceptance of These Terms",
    content:
      "These Terms & Conditions are an agreement between you and Huza.app LTD (Huza). By creating an account or using Huza, you confirm that you have read and accept these Terms and the Privacy Policy. If you do not agree, do not use Huza. If a future version of these Terms changes them significantly, we will ask you to review and accept the new version before you continue using the service.",
  },
  {
    id: 2,
    title: "What Huza Is",
    content:
      "Huza is an online marketplace that helps people who need household and personal services connect with people who provide them. Huza is not an employer, employment agency, or staffing company, and is not a party to any agreement, booking, or payment arranged between users. Any work is contracted directly between the employer and the provider. Huza does not supervise, direct, or guarantee the work.",
  },
  {
    id: 3,
    title: "Eligibility",
    content:
      "You must be at least 18 years old and legally able to enter into contracts to use Huza. Huza is intended for use in Rwanda. You must provide accurate information about yourself and keep it up to date. You are responsible for everything done through your account and for keeping your credentials and PIN confidential.",
  },
  {
    id: 4,
    title: "Employers and Providers",
    content:
      "The same account can be used both to hire (as an employer) and to offer services (as a provider). If you list a service you become a provider and the rules for providers apply to you for that activity.\nAs an employer you agree to describe the work accurately, pay the agreed amount, and treat providers lawfully and with respect.\nAs a provider you agree to offer only services you are competent and lawfully able to perform, to describe them honestly, and to carry out accepted bookings as agreed.",
  },
  {
    id: 5,
    title: "Your Profile, Content, and How It Is Displayed",
    content:
      "You keep ownership of the content you submit (your profile details, photos, service descriptions, job posts, messages, and reviews). You grant Huza a non-exclusive, royalty-free licence to host, store, display, and distribute that content for the purpose of operating the marketplace.\nYou understand and agree that, if you list a service, your provider profile is shown publicly, including to people without a Huza account and potentially through search engines, as described in the Privacy Policy. Huza will only use your identifiable photo, name, or profile in its own social media, advertising, or promotional material if you give separate opt-in consent in your settings, which you can withdraw at any time.\nDo not upload content you do not have the right to use, or content that is false, offensive, or infringes someone else's rights.",
  },
  {
    id: 6,
    title: "Reviews and Ratings",
    content:
      "After a completed booking, each party may review the other. Reviews must be honest and based on a real experience with that booking. Reviews about a provider are published on the provider's public profile and shown with the reviewer's first name and last initial.\nThe person reviewed may post one public reply per review. Huza does not remove honest reviews just because the subject disagrees with them, but may remove or edit reviews that contain personal contact or ID details, hate speech, threats, unlawful content, spam, or that otherwise breach these Terms. Do not offer incentives in exchange for reviews or post fake reviews.",
  },
  {
    id: 7,
    title: "Verification and Background Checks",
    content:
      "Providers must submit a government-issued ID for verification. Huza may carry out additional checks where it considers this necessary for safety. A verification badge means an ID was reviewed; it is not a guarantee of a person's character, skills, or safety. All users remain responsible for deciding whether to proceed with any particular booking.",
  },
  {
    id: 8,
    title: "Bookings, Contact Details, and Payment",
    content:
      "When a booking is made or accepted, Huza shares the name and phone number of each party, and the service location, with the other party so the work can be arranged. When you book a service you agree to pay the amount quoted for it. Payments made through Huza are handled by a third-party payment processor. Cancellations should be made with reasonable notice; late cancellations may incur a fee shown in the booking details. Disputes about price or quality are between the employer and the provider.",
  },
  {
    id: 9,
    title: "No Off-Platform Circumvention",
    content:
      "Huza invests in matching, verification, safety, and support. You agree not to use Huza to find a counterparty and then deliberately move the arrangement off the platform in order to avoid fees, verification, or these Terms. Repeated circumvention may lead to suspension.",
  },
  {
    id: 10,
    title: "Prohibited Conduct",
    content:
      "You agree not to: (1) give false, misleading, or impersonating information; (2) harass, threaten, abuse, or discriminate against anyone; (3) break the law or use Huza to arrange anything unlawful, including trafficking, forced labour, or fraud; (4) post another person's personal data without their consent; (5) share explicit, hateful, or offensive content; (6) attempt to bypass payment, verification, or security systems; (7) scrape, copy, or reuse other users' profile data outside Huza; (8) interfere with or attempt to gain unauthorised access to the platform.",
  },
  {
    id: 11,
    title: "Safety and Assumption of Risk",
    content:
      "You use Huza and meet other users at your own risk. Huza does not guarantee the identity, character, reliability, or safety of any user. We encourage you to communicate through the app until you are comfortable, agree scope and price clearly, tell someone you trust where you will be, and stop if something feels wrong. Report safety concerns to support@huza.app.",
  },
  {
    id: 12,
    title: "Service Quality and Disputes",
    content:
      "Because Huza is only a marketplace, it is not responsible for work that is late, incomplete, poor quality, cancelled, or for any loss, damage, or injury arising from a booking. Users should try to resolve disputes directly. If that fails, contact support@huza.app with evidence such as messages, photos, and booking details. Huza may help mediate but is not obliged to and does not act as an arbitrator.",
  },
  {
    id: 13,
    title: "Huza's Intellectual Property",
    content:
      "The Huza name, logo, software, design, and content created by Huza are owned by or licensed to Huza.app LTD and are protected by law. You may not copy, distribute, modify, or create derivative works from them without our written permission. This does not affect your ownership of your own content described in section 5.",
  },
  {
    id: 14,
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by Rwandan law, Huza and its owners, staff, and partners are not liable for indirect, incidental, or consequential loss, lost profit, lost data, or loss arising from the acts of other users. Nothing in these Terms limits liability that cannot be limited by law. Subject to that, Huza's total liability to you in connection with the service is limited to the total fees you paid to Huza in the 12 months before the claim.",
  },
  {
    id: 15,
    title: "Suspension and Termination",
    content:
      "You may close your account at any time. Huza may suspend or terminate your account if you breach these Terms, if we are required to by law, or to protect users or the platform from harm or fraud. On termination your right to use Huza ends, but any obligations you took on before termination, including payment obligations, continue. Reviews and transaction records may remain as described in the Privacy Policy.",
  },
  {
    id: 16,
    title: "Changes to These Terms",
    content:
      "We may update these Terms from time to time. Minor changes take effect when posted. For significant changes we will give notice in the app or by message and, where the law requires, ask you to accept the new version before continuing. The effective date of the current version is shown at the top of this page.",
  },
  {
    id: 17,
    title: "Governing Law and Jurisdiction",
    content:
      "These Terms are governed by the laws of Rwanda. Disputes that cannot be resolved between us will be subject to the courts of Kigali, Rwanda.",
  },
  {
    id: 18,
    title: "Contact",
    content:
      "For questions about these Terms or to report a violation, contact Huza.app LTD, Kigali, Rwanda. Email: support@huza.app. Phone: +250788000000.",
  },
];
