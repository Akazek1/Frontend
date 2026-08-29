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

// NOTE: Bundled fallback texts. The authoritative versions are the admin-managed
// LegalDocument rows served from GET /legal/:type; keep the two in sync when
// either changes. This is Version 1 of the Terms & Privacy Policy (the app has
// only had test users so far). The copy describes Huza.app's actual data flows:
// public provider profiles, contact exchange on booking, public reviews, use of
// app screenshots/videos on social media (covered by the content licence in the
// Terms and Huza.app's legitimate interest in promoting the marketplace, not a
// separate opt-in), business-account contact sharing, and the enforcement record
// kept after a ban to prevent re-registration. It is written to align with Rwanda's
// Law No. 058/2021 and is a plain-language draft that should be reviewed by a
// qualified Rwandan lawyer before launch. Contact details are kept to a single
// stable address (support@huza.app); phone and postal address live in the app.
export const PrivacyPolicyData = [
  {
    id: 1,
    title: "Who We Are",
    content:
      "Huza.app is operated by Huza.app LTD, a company registered in Rwanda with its office in Kigali. For the personal data described in this policy, Huza.app LTD is the data controller: we decide why and how your personal data is processed and are responsible for looking after it in line with Rwanda's Law No. 058/2021 relating to the protection of personal data and privacy. You can reach us about any privacy matter at support@huza.app. Our current postal and phone contact details are shown in the app.",
  },
  {
    id: 2,
    title: "Information We Collect",
    content:
      "We collect the following personal data:\n(1) Account information: your name, phone number, and (if you add them) email address, username, profile photo, gender, date of birth, and a short bio.\n(2) Verification information: for people who offer services, a government-issued ID document and its verification status. This is used to confirm identity and is reviewed by our team.\n(3) Service information: for providers, the services you list, pricing, availability, working areas, experience, languages, and similar profile details you choose to publish.\n(4) Job and booking information: jobs you post, and the dates, times, locations, and notes attached to bookings you make or receive.\n(5) Communications: messages you exchange with other users through Huza.app, and messages you send to our support team.\n(6) Reviews and ratings: feedback you give or receive after a booking.\n(7) Payment information: transaction records and, where payments run through a payment processor, limited payment method details held by that processor.\n(8) Device and usage information: IP address, device and browser type, app version, push-notification tokens, and how you use the app, collected to keep the service secure and to improve it.\n(9) Location information: with your permission, approximate location to help match you with nearby services or jobs.\n(10) Business account information: for service companies and staffing agencies, the business name, registration details, office address, and business contact details.",
  },
  {
    id: 3,
    title: "How We Use Your Information and Our Legal Basis",
    content:
      "We use your personal data only where the law allows. Our legal bases are:\n(1) Performance of a contract with you - to create and run your account, show your profile, match employers and providers, process jobs and bookings, exchange the contact details needed to complete a booking, carry messages, and take payments.\n(2) The content licence you grant us in our Terms - when you publish a profile or listing, you give Huza.app permission to display and distribute that content to operate and promote the marketplace, including in app screenshots and videos used in explanatory, educational, and promotional material (see section 7).\n(3) Our legitimate interests - to explain and promote the marketplace and the people on it (see section 7); to verify identity, prevent fraud and abuse, keep users safe, enforce our Terms (including preventing banned users from re-registering), respond to disputes, and analyse and improve the platform. We do this in a way that does not override your rights, and you can object (see sections 7 and 11).\n(4) Your consent - to send you marketing messages and to use your device location. You give this in the app and can withdraw it at any time. Consent is also a further basis for the use described in section 7.\n(5) Legal obligation - to keep records and respond to lawful requests from courts or authorities in Rwanda.",
  },
  {
    id: 4,
    title: "Information That Is Public",
    content:
      "Huza.app is a public marketplace. If you list a service, your provider profile is visible to anyone who uses Huza.app, including people who do not have an account, and it may be found through search engines. Your public provider profile can include: your display name, profile photo, bio, gender (only if you choose to show it), the services you offer, pricing, general working areas, experience and languages, your verification badge, your rating, and reviews written about you.\nThe following are never shown publicly for an individual: your phone number, email address, exact home address, date of birth, government ID document, and payment details.\nBusiness accounts are different: for a service company or staffing agency, the business's own name, office location, and business phone and email may be shown to users and shared through the platform, because these are business rather than personal contact details.\nIf you use Huza.app only to hire, your profile is not listed in the marketplace; the limited details in section 5 are shared only with a provider you actually transact with.",
  },
  {
    id: 5,
    title: "Information Shared Between Users",
    content:
      "To let work actually happen, Huza.app shares some information directly between the two sides of a booking:\n(1) When a booking is made or accepted, we share each party's name and phone number, and the service location, with the other party. For business accounts this may also include the business email and office location. Before a booking, a provider and an employer see only what is on the public profile and what they choose to say in chat.\n(2) A job you post is shown to providers whose services match it, so they can offer to take it. Do not include information in a job post that you do not want providers to see.\n(3) Messages you send in a conversation are visible to the other participants in that conversation.",
  },
  {
    id: 6,
    title: "Reviews and Ratings",
    content:
      "After a completed booking, either party may leave a review of the other. Reviews and ratings about a provider are published on that provider's public profile. Reviews are shown with the reviewer's first name and last initial, not their full contact details.\nThe person reviewed can post a public reply to any review about them. We do not remove honest reviews that are based on a real booking simply because the subject disagrees with them. We will remove or edit a review that contains someone's contact details or ID information, hate speech, threats, clearly unlawful content, or content that breaches our guidelines. To report a review, contact support@huza.app.",
  },
  {
    id: 7,
    title: "App Screenshots, Videos, and Social Media",
    content:
      "To explain how Huza.app works, to create training and educational material, and to promote the service and the people who offer services on it, Huza.app captures screenshots and screen recordings of the app and shares them, including on social media.\nThese may show your public profile as it appears in the app - your photo, name, and listing details. They do not include your phone number, email address, or ID document.\nWe do this on the basis of the licence you grant us in our Terms when you publish a profile or listing, and our legitimate interest in explaining and promoting the marketplace and the people on it - which also gives providers additional exposure. If Huza.app wants to feature you individually - for example a post highlighting you as a provider - we will let you know first.\nYou can object to this use at any time: email support@huza.app. We will avoid featuring you and will remove you from, or blur you in, material we control going forward. Content that has already been published, or that other people have re-shared, may remain.",
  },
  {
    id: 8,
    title: "Sharing With Service Providers and Others",
    content:
      "We do not sell your personal data. We share it only in these cases:\n(1) Processors who run parts of the service for us: hosting and database providers, media/image hosting, the SMS provider that sends verification codes and alerts, the push-notification service, and the payment processor. Some of these providers operate outside Rwanda, so your data may be transferred internationally; where that happens we take steps to ensure it remains protected.\n(2) Authorities and legal process: where we are required by law, or to protect the rights, safety, or property of users or Huza.app.\n(3) Business transfer: if Huza.app is merged with or acquired by another organisation, user data may transfer as part of that transaction, subject to this policy.\n(4) Aggregated or anonymised data that does not identify you may be shared for research or reporting.",
  },
  {
    id: 9,
    title: "How Long We Keep Your Data",
    content:
      "We keep your personal data for as long as your account is open, and for a limited period afterwards so we can resolve disputes, enforce our Terms, and meet legal, tax, and accounting requirements in Rwanda. Transaction and booking records are kept longer than profile content for those reasons. When data is no longer needed we delete it or irreversibly anonymise it.\nEnforcement records: if we suspend or terminate an account for a serious breach of our Terms - for example fraud, abuse, or a safety risk to other users - we keep a limited record even after the account is deleted. This record includes a one-way encrypted (hashed) form of the phone number, email address, and ID number, together with the reason and date. We keep it for as long as needed to enforce that decision and to stop the same person from simply creating a new account. It is used only for that purpose and is accessible only to our safety team.\nYou can ask us to delete your account at any time (see section 11).",
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
      "Under Rwandan data protection law you have the right to: access the personal data we hold about you; have inaccurate data corrected; ask for your data to be deleted; object to or ask us to restrict certain processing, including the use of app content that includes you (section 7); withdraw consent you have given (for marketing messages or location); and receive a copy of data you provided to us in a portable format.\nThe right to deletion is not absolute. We may keep certain information where we need it to comply with a legal obligation, establish or defend legal claims, prevent fraud or abuse, or protect the safety of other users - for example the enforcement record described in section 9. Because provider reputation is linked to verified identity rather than to a single account, if you close your account and later register again with the same identity, your earlier history (including reviews and any safety record) may be connected to the new account.\nTo exercise any of your rights, email support@huza.app. We will respond within 30 days. If you are not satisfied with how we handle your request, you may lodge a complaint with the supervisory authority for data protection in Rwanda.",
  },
  {
    id: 12,
    title: "Children",
    content:
      "Huza.app is only for people aged 18 and over. We do not knowingly collect personal data from anyone under 18. If we learn that an account belongs to someone under 18, we will close it and delete the associated data.",
  },
  {
    id: 13,
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy as our practices, technology, or the law change. We will post the new version and, for significant changes, notify you through the app or by message before it takes effect. If you continue to use Huza.app after the change takes effect, that means you accept the updated policy. The date the current version took effect is shown at the top of this page.",
  },
  {
    id: 14,
    title: "Contact Us",
    content:
      "For any question about this Privacy Policy or your personal data, email support@huza.app. Our current postal and phone contact details are shown in the app.",
  },
];

export const TermsAndConditionsData = [
  {
    id: 1,
    title: "Acceptance of These Terms",
    content:
      "These Terms & Conditions are an agreement between you and Huza.app LTD (Huza.app). By creating an account or using Huza.app, you confirm that you have read and accept these Terms and the Privacy Policy. If you do not agree, do not use Huza.app.\nFrom time to time we may change these Terms. We will post the new version and, for significant changes, notify you in the app or by message. If you keep using Huza.app after a change takes effect, you accept the updated Terms. If you do not agree, you should stop using Huza.app and may close your account.",
  },
  {
    id: 2,
    title: "What Huza.app Is",
    content:
      "Huza.app is an online marketplace that helps people who need household and personal services connect with people who provide them. Huza.app is not an employer, employment agency, or staffing company, and is not a party to any agreement, booking, or payment arranged between users. Any work is contracted directly between the employer and the provider. Huza.app does not supervise, direct, or guarantee the work.",
  },
  {
    id: 3,
    title: "Eligibility",
    content:
      "You must be at least 18 years old and legally able to enter into contracts to use Huza.app. Huza.app is intended for use in Rwanda. You must provide accurate information about yourself and keep it up to date. You are responsible for everything done through your account and for keeping your credentials and PIN confidential.",
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
      "You keep ownership of the content you submit (your profile details, photos, service descriptions, job posts, messages, and reviews). You grant Huza.app a non-exclusive, royalty-free licence to host, store, display, reproduce, and distribute that content for the purpose of operating and promoting the marketplace, including in explanatory, educational, and promotional material such as app screenshots and videos (see section 6).\nYou understand and agree that, if you list a service, your provider profile is shown publicly, including to people without a Huza.app account and potentially through search engines, as described in the Privacy Policy. For a service company or staffing agency, the business's own name, office location, and business phone and email may also be shown to users.\nDo not upload content you do not have the right to use, or content that is false, offensive, or infringes someone else's rights.",
  },
  {
    id: 6,
    title: "App Screenshots, Videos, and Featuring Users",
    content:
      "To show how Huza.app works and to promote the service and the people on it, Huza.app captures screenshots and screen recordings of the app and shares them, including on social media and in training material. These may show your public profile as it appears in the app - your photo, name, and listing details - but never your phone number, email address, or ID document.\nThis use is covered by the licence you grant in section 5 and by Huza.app's legitimate interest in promoting the marketplace, and is explained further in the Privacy Policy. If Huza.app wants to feature you individually, we will let you know first. If you would rather not be included, email support@huza.app and we will avoid featuring you and remove or blur you in material we control going forward; content already shared, including by other people, may remain.",
  },
  {
    id: 7,
    title: "Reviews and Ratings",
    content:
      "After a completed booking, each party may review the other. Reviews must be honest and based on a real experience with that booking. Reviews about a provider are published on the provider's public profile and shown with the reviewer's first name and last initial.\nThe person reviewed may post one public reply per review. Huza.app does not remove honest reviews just because the subject disagrees with them, but may remove or edit reviews that contain personal contact or ID details, hate speech, threats, unlawful content, spam, or that otherwise breach these Terms. Do not offer incentives in exchange for reviews or post fake reviews.",
  },
  {
    id: 8,
    title: "Verification and Background Checks",
    content:
      "Providers must submit a government-issued ID for verification. Huza.app may carry out additional checks where it considers this necessary for safety. A verification badge means an ID was reviewed; it is not a guarantee of a person's character, skills, or safety. All users remain responsible for deciding whether to proceed with any particular booking.",
  },
  {
    id: 9,
    title: "Bookings, Contact Details, and Payment",
    content:
      "When a booking is made or accepted, Huza.app shares the name and phone number of each party, and the service location, with the other party so the work can be arranged. For business accounts this may also include the business email and office location. When you book a service you agree to pay the amount quoted for it. Payments made through Huza.app are handled by a third-party payment processor. Cancellations should be made with reasonable notice; late cancellations may incur a fee shown in the booking details. Disputes about price or quality are between the employer and the provider.",
  },
  {
    id: 10,
    title: "No Off-Platform Circumvention",
    content:
      "Huza.app invests in matching, verification, safety, and support. You agree not to use Huza.app to find a counterparty and then deliberately move the arrangement off the platform in order to avoid fees, verification, or these Terms. Repeated circumvention may lead to suspension.",
  },
  {
    id: 11,
    title: "Prohibited Conduct",
    content:
      "You agree not to: (1) give false, misleading, or impersonating information; (2) harass, threaten, abuse, or discriminate against anyone; (3) break the law or use Huza.app to arrange anything unlawful, including trafficking, forced labour, or fraud; (4) post another person's personal data without their consent; (5) share explicit, hateful, or offensive content; (6) attempt to bypass payment, verification, or security systems; (7) scrape, copy, or reuse other users' profile data outside Huza.app; (8) interfere with or attempt to gain unauthorised access to the platform.",
  },
  {
    id: 12,
    title: "Safety and Assumption of Risk",
    content:
      "You use Huza.app and meet other users at your own risk. Huza.app does not guarantee the identity, character, reliability, or safety of any user. We encourage you to communicate through the app until you are comfortable, agree scope and price clearly, tell someone you trust where you will be, and stop if something feels wrong. Report safety concerns to support@huza.app.",
  },
  {
    id: 13,
    title: "Service Quality and Disputes",
    content:
      "Because Huza.app is only a marketplace, it is not responsible for work that is late, incomplete, poor quality, cancelled, or for any loss, damage, or injury arising from a booking. Users should try to resolve disputes directly. If that fails, contact support@huza.app with evidence such as messages, photos, and booking details. Huza.app may help mediate but is not obliged to and does not act as an arbitrator.",
  },
  {
    id: 14,
    title: "Huza.app's Intellectual Property",
    content:
      "The Huza.app name, logo, software, design, and content created by Huza.app are owned by or licensed to Huza.app LTD and are protected by law. You may not copy, distribute, modify, or create derivative works from them without our written permission. This does not affect your ownership of your own content described in section 5.",
  },
  {
    id: 15,
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by Rwandan law, Huza.app and its owners, staff, and partners are not liable for indirect, incidental, or consequential loss, lost profit, lost data, or loss arising from the acts of other users. Nothing in these Terms limits liability that cannot be limited by law. Subject to that, Huza.app's total liability to you in connection with the service is limited to the total fees you paid to Huza.app in the 12 months before the claim.",
  },
  {
    id: 16,
    title: "Suspension, Termination, and No Ban Evasion",
    content:
      "You may close your account at any time from the app. Huza.app may suspend or terminate your account if you breach these Terms, if we are required to by law, or to protect users or the platform from harm or fraud.\nYou must not create a new account to get around a suspension or ban, or to escape reviews or a safety record. If we believe an account is being used to evade enforcement, we may suspend it. To help prevent this, Huza.app keeps a limited enforcement record after a ban, as described in the Privacy Policy, and links provider reputation to verified identity rather than to a single account.\nOn termination your right to use Huza.app ends, but any obligations you took on before termination, including payment obligations, continue. Reviews and transaction records may remain as described in the Privacy Policy.",
  },
  {
    id: 17,
    title: "Changes to These Terms",
    content:
      "Covered in section 1: we post the new version, give notice of significant changes, and continued use after a change means you accept it.",
  },
  {
    id: 18,
    title: "Governing Law and Jurisdiction",
    content:
      "These Terms are governed by the laws of Rwanda. Disputes that cannot be resolved between us will be subject to the courts of Kigali, Rwanda.",
  },
  {
    id: 19,
    title: "Contact",
    content:
      "For questions about these Terms or to report a violation, email support@huza.app. Our current postal and phone contact details are shown in the app.",
  },
];
