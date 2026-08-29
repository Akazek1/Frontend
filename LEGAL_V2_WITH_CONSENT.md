# Huza Legal Documents — Version 2.0 (draft, not yet active)

> **Status:** DRAFT. Do **not** publish. These texts assume a consent-recording
> and document-versioning system that does not exist yet (see
> [§7 Implementation dependencies](#7-implementation-dependencies)).
>
> **Supersedes:** the Version 1.1 copy currently in
> [`constant/index.ts`](constant/index.ts) (`PrivacyPolicyData` /
> `TermsAndConditionsData`) and the matching `LegalDocument` CMS rows.
>
> **Takes effect:** only once (a) the `ConsentRecord` table + acceptance gate
> ship, and (b) a qualified Rwandan lawyer has reviewed the wording. Until then
> the Version 1.1 texts remain live.
>
> **Owner:** Huza.app LTD · **Drafted:** 2026-08-29 · **Target version:** 2.0

---

## 1. Why a Version 2

Version 1.1 rewrote the Terms & Privacy Policy to describe how Huza actually
handles data (public provider profiles, contact exchange on booking, public
reviews, a separate marketing opt-in). It is honest about the data flows, but it
still treats consent as a single "tick to accept" event that is **not recorded**
anywhere and **never refreshed** when the documents change.

Version 2.0 assumes the platform can:

1. **Version each legal document** — every `LegalDocument` already carries a
   `version` and `effectiveDate`; V2 makes those meaningful to the user.
2. **Record each acceptance** — who accepted which document at which version,
   when, and from what device, in a `ConsentRecord` table that is kept as an
   audit trail (never overwritten).
3. **Re-prompt on material change** — when a document's version bumps in a way
   that affects users' rights or how their data is used, logged-in users must
   review and accept the new version before continuing.
4. **Hold granular, unbundled consents** — marketing messages, social-media
   showcase, and device location are each their own opt-in, each individually
   recorded and revocable, none of them a precondition for using the
   marketplace.

This is what Rwanda's Law Nº 058/2021 (and GDPR-style regimes generally)
expects: consent that is **specific, informed, unbundled, demonstrable, and as
easy to withdraw as to give.**

---

## 2. The consent model these texts assume

### 2.1 Document acceptance

| Field | Meaning |
|---|---|
| `userId` / `organizationId` | who accepted |
| `docType` | `TERMS` \| `PRIVACY` |
| `docVersion` | the `LegalDocument.version` shown at the time |
| `docLocale` | the locale of the text shown (`en` \| `rw`) |
| `acceptedAt` | server timestamp |
| `ipAddress`, `userAgent` | captured for the audit trail, not for profiling |
| `method` | `SIGNUP` \| `RE_ACCEPTANCE` \| `IMPORT_LEGACY` |

One row per acceptance. Rows are **append-only** — a later acceptance does not
replace an earlier one, so the full history is provable.

Existing users at the time V2 ships get one `IMPORT_LEGACY` row per document,
recording that they accepted Version 1.x on their original signup date (the
best evidence available). They are then re-prompted for V2 like everyone else.

### 2.2 Granular consents (the "consent register")

| Consent key | Covers | Default | Where the user sets it | Legal basis | Revocable |
|---|---|---|---|---|---|
| `terms_of_service` | Being bound by the Terms | — (required to use Huza) | Signup + re-acceptance | Contract | Only by closing the account |
| `privacy_notice` | Acknowledging the Privacy Policy | — (required to use Huza) | Signup + re-acceptance | Not consent — it is notice of processing needed to run the service | n/a |
| `marketing_comms` | Promotional SMS / push / email about features and offers | **OFF** | Settings → Marketing & Social Media | Consent | Yes, anytime |
| `social_showcase` | Huza featuring the user's identifiable photo, name or profile on Huza's own social media, ads and promo material | **OFF** | Settings → Marketing & Social Media | Consent | Yes, anytime |
| `device_location` | Using precise device location to match nearby services / jobs | **OFF** (asked in context) | OS prompt + Settings | Consent | Yes, anytime |

Each consent is stored as `{ userId, key, granted: boolean, noticeVersion,
changedAt }`, **append-only** like acceptances, so both the grant and any later
withdrawal are timestamped and provable.

> `social_showcase` is already implemented as `User.showcaseConsent` /
> `showcaseConsentAt` (branch `feat/showcase-consent`, backend + frontend). V2
> folds it into the same register rather than leaving it as a lone boolean.

### 2.3 Re-acceptance trigger

- **Material change** (rights, data uses, sharing, retention, new processor
  category, change of controller): version bumps, `effectiveDate` moves, and a
  blocking prompt appears on next app open — the user sees a plain-language
  summary of what changed and must accept to continue.
- **Non-material change** (typo, contact detail, clarification that does not
  change meaning): version bumps, a non-blocking notice is shown, continued use
  is acceptance.
- The admin editor gains a "material change — require re-acceptance" checkbox
  on publish; unchecked = non-material.

---

## 3. Terms & Conditions — Version 2.0 (draft text)

> Publish this as the `TERMS` document (locale `en`). Keep section numbering
> stable; the Kinyarwanda translation follows separately via a native speaker.

**Effective date:** _[set on publish]_ · **Version:** 2.0

These Terms & Conditions are an agreement between you and Huza.app LTD (**Huza**),
a company registered in Rwanda with its office in Kigali. They govern your use of
Huza, an online marketplace that connects people who need household and personal
services with people who provide them.

### 1. Acceptance and Versions of These Terms

By creating an account or using Huza you confirm that you have read and accept
these Terms and the Privacy Policy. When you accept, Huza records which version
you accepted, the date, and the device used, so that both you and Huza have a
clear record.

These Terms have a version number and an effective date, shown at the top of this
page. If we make a significant change — one that affects your rights or how your
personal data is used — we will show you a summary of what changed and ask you to
review and accept the new version before you continue using Huza. For minor
changes that do not change the meaning, we will post the new version and let you
know; continuing to use Huza after that is acceptance.

If you do not accept a new version, you may stop using Huza and close your
account. Obligations you already took on (for example payment for a booking
already made) continue to apply.

### 2. What Huza Is

Huza is a marketplace that helps people find and offer services. Huza is **not**
an employer, employment agency, or staffing company, and is not a party to any
agreement, booking, or payment arranged between users. Any work is contracted
directly between the employer and the provider. Huza does not supervise, direct,
or guarantee the work.

### 3. Eligibility

You must be at least 18 years old and legally able to enter into contracts. Huza
is intended for use in Rwanda. You must give accurate information about yourself
and keep it current. You are responsible for everything done through your account
and for keeping your credentials and PIN confidential.

### 4. Employers and Providers

The same account can be used both to hire (as an employer) and to offer services
(as a provider). If you list a service you become a provider and the provider
rules apply to that activity.

As an **employer** you agree to describe the work accurately, pay the agreed
amount, and treat providers lawfully and with respect. As a **provider** you
agree to offer only services you are competent and lawfully able to perform, to
describe them honestly, and to carry out accepted bookings as agreed.

### 5. Your Profile, Content, and How It Is Displayed

You keep ownership of the content you submit (profile details, photos, service
descriptions, job posts, messages, and reviews). You grant Huza a
non-exclusive, royalty-free licence to host, store, display, and distribute that
content **for the purpose of operating the marketplace**.

If you list a service, your provider profile is shown **publicly**, including to
people without a Huza account and potentially through search engines, as
described in the Privacy Policy. This public display is part of providing the
service and is covered by these Terms, not by a separate marketing consent.

Huza will only use your identifiable photo, name, or profile in its **own social
media, advertising, or promotional material** if you have given the separate
`social_showcase` opt-in in your settings. That consent is recorded with a date,
is not required to use Huza, and can be withdrawn at any time. Withdrawal stops
further use by Huza; material already posted or re-shared by other people may
remain.

Do not upload content you do not have the right to use, or content that is
false, offensive, or infringes someone else's rights.

### 6. Consents You Give Separately

Some things always require their own opt-in, separate from accepting these
Terms, and each can be turned on or off at any time in your settings:

- **Marketing messages** — promotional SMS, push, or email about features and
  offers.
- **Social media showcase** — described in section 5.
- **Precise location** — using your device location to match you with nearby
  services or jobs.

Huza records when you turn each of these on or off. Turning any of them off does
not limit your normal use of the marketplace.

### 7. Reviews and Ratings

After a completed booking, each party may review the other. Reviews must be
honest and based on a real experience with that booking. Reviews about a
provider are published on the provider's public profile and shown with the
reviewer's first name and last initial.

The person reviewed may post one public reply per review. Huza does not remove
honest reviews just because the subject disagrees with them, but may remove or
edit reviews that contain personal contact or ID details, hate speech, threats,
unlawful content, spam, or that otherwise breach these Terms. Do not offer
incentives for reviews or post fake reviews.

### 8. Verification and Background Checks

Providers must submit a government-issued ID for verification. Huza may carry out
additional checks where it considers this necessary for safety. A verification
badge means an ID was reviewed; it is not a guarantee of a person's character,
skills, or safety. All users remain responsible for deciding whether to proceed
with any particular booking.

### 9. Bookings, Contact Details, and Payment

When a booking is made or accepted, Huza shares the name and phone number of each
party, and the service location, with the other party so the work can be
arranged. When you book a service you agree to pay the amount quoted for it.
Payments made through Huza are handled by a third-party payment processor.
Cancellations should be made with reasonable notice; late cancellations may
incur a fee shown in the booking details. Disputes about price or quality are
between the employer and the provider.

### 10. No Off-Platform Circumvention

Huza invests in matching, verification, safety, and support. You agree not to
use Huza to find a counterparty and then deliberately move the arrangement off
the platform to avoid fees, verification, or these Terms. Repeated circumvention
may lead to suspension.

### 11. Prohibited Conduct

You agree not to: (1) give false, misleading, or impersonating information;
(2) harass, threaten, abuse, or discriminate against anyone; (3) break the law
or use Huza to arrange anything unlawful, including trafficking, forced labour,
or fraud; (4) post another person's personal data without their consent;
(5) share explicit, hateful, or offensive content; (6) attempt to bypass
payment, verification, or security systems; (7) scrape, copy, or reuse other
users' profile data outside Huza; (8) interfere with or attempt to gain
unauthorised access to the platform.

### 12. Safety and Assumption of Risk

You use Huza and meet other users at your own risk. Huza does not guarantee the
identity, character, reliability, or safety of any user. Communicate through the
app until you are comfortable, agree scope and price clearly, tell someone you
trust where you will be, and stop if something feels wrong. Report safety
concerns to support@huza.app.

### 13. Service Quality and Disputes

Because Huza is only a marketplace, it is not responsible for work that is late,
incomplete, poor quality, cancelled, or for any loss, damage, or injury arising
from a booking. Users should try to resolve disputes directly. If that fails,
contact support@huza.app with evidence such as messages, photos, and booking
details. Huza may help mediate but is not obliged to and does not act as an
arbitrator.

### 14. Huza's Intellectual Property

The Huza name, logo, software, design, and content created by Huza are owned by
or licensed to Huza.app LTD and protected by law. You may not copy, distribute,
modify, or create derivative works from them without our written permission.
This does not affect your ownership of your own content (section 5).

### 15. Limitation of Liability

To the maximum extent permitted by Rwandan law, Huza and its owners, staff, and
partners are not liable for indirect, incidental, or consequential loss, lost
profit, lost data, or loss arising from the acts of other users. Nothing in
these Terms limits liability that cannot be limited by law. Subject to that,
Huza's total liability to you in connection with the service is limited to the
total fees you paid to Huza in the 12 months before the claim.

### 16. Suspension and Termination

You may close your account at any time. Huza may suspend or terminate your
account if you breach these Terms, if required by law, or to protect users or
the platform from harm or fraud. On termination your right to use Huza ends, but
obligations you took on before termination, including payment obligations,
continue. Reviews and transaction records may remain as described in the Privacy
Policy.

### 17. Changes to These Terms

Covered in section 1. In short: significant changes require your acceptance of
the new version before you continue; minor changes take effect when posted.

### 18. Governing Law and Jurisdiction

These Terms are governed by the laws of Rwanda. Disputes that cannot be resolved
between us will be subject to the courts of Kigali, Rwanda.

### 19. Contact

Huza.app LTD, Kigali, Rwanda. Email: support@huza.app. Phone: +250788000000.

---

## 4. Privacy Policy — Version 2.0 (draft text)

> Publish this as the `PRIVACY` document (locale `en`).

**Effective date:** _[set on publish]_ · **Version:** 2.0

### 1. Who We Are

Huza is operated by Huza.app LTD, a company registered in Rwanda with its office
in Kigali. For the personal data described in this policy, Huza.app LTD is the
**data controller** — we decide why and how your personal data is processed and
are responsible for protecting it under Rwanda's Law Nº 058/2021 relating to the
protection of personal data and privacy. Contact us about any privacy matter at
support@huza.app or +250788000000.

### 2. Information We Collect

(1) **Account information** — your name, phone number, and (if you add them)
email address, username, profile photo, gender, date of birth, and a short bio.
(2) **Verification information** — for people who offer services, a
government-issued ID document and its verification status, reviewed by our team.
(3) **Service information** — for providers, the services you list, pricing,
availability, working areas, experience, languages, and similar profile details
you choose to publish.
(4) **Job and booking information** — jobs you post, and the dates, times,
locations, and notes attached to bookings you make or receive.
(5) **Communications** — messages you exchange with other users through Huza,
and messages you send to our support team.
(6) **Reviews and ratings** — feedback you give or receive after a booking.
(7) **Payment information** — transaction records and, where payments run
through a payment processor, limited payment method details held by that
processor.
(8) **Device and usage information** — IP address, device and browser type, app
version, push-notification tokens, and how you use the app, to keep the service
secure and improve it.
(9) **Location information** — with your permission, approximate or precise
location to match you with nearby services or jobs.
(10) **Consent records** — a log of which legal document versions you accepted
and which optional consents you have turned on or off, with dates (see
section 5).

### 3. How We Use Your Information and Our Legal Basis

We use your personal data only where the law allows:

(1) **Performance of a contract with you** — to create and run your account,
show your profile, match employers and providers, process jobs and bookings,
exchange the contact details needed to complete a booking, carry messages, and
take payments.
(2) **Your consent** — for each of the following, given and withdrawn
separately, and each recorded with a date:
&nbsp;&nbsp;&nbsp;&nbsp;(a) sending you marketing messages;
&nbsp;&nbsp;&nbsp;&nbsp;(b) featuring your identifiable photo, name or profile in
Huza's own social media and advertising (see section 7);
&nbsp;&nbsp;&nbsp;&nbsp;(c) using your precise device location.
You can withdraw any of these at any time in your settings without affecting your
normal use of Huza.
(3) **Our legitimate interests** — to verify identity, prevent fraud and abuse,
keep users safe, respond to disputes, and analyse and improve the platform, in a
way that does not override your rights.
(4) **Legal obligation** — to keep records (including consent records) and
respond to lawful requests from courts or authorities in Rwanda.

### 4. Information That Is Public

Huza is a public marketplace. If you list a service, your **provider profile is
visible to anyone**, including people without an account, and may be found
through search engines. Your public provider profile can include your display
name, profile photo, bio, gender (only if you choose to show it), the services
you offer, pricing, general working areas, experience and languages, your
verification badge, your rating, and reviews written about you.

The following are **never shown publicly**: your phone number, email address,
exact home address, date of birth, government ID document, payment details, and
your consent records.

If you use Huza only to hire, your profile is not listed in the marketplace; the
limited details in section 6 are shared only with a provider you actually
transact with.

### 5. How We Record Your Consent

To meet the accountability requirement of Rwandan data protection law, we keep a
record of your consent decisions:

- **Document acceptance** — each time you accept the Terms or the Privacy
  Policy, we store which version you saw, the language, the date and time, and
  the IP address and device type used. We keep every acceptance, not just the
  latest, so the history is complete.
- **Optional consents** — each time you turn marketing messages, the social
  media showcase, or precise location on or off, we store the change and its
  date.

These records are used only to demonstrate that consent was properly obtained
and to show you your own history. You can ask us for a copy of your consent
history at any time, and you can see and change your current choices in your
settings.

### 6. Information Shared Between Users

(1) When a booking is made or accepted, we share each party's name and phone
number, and the service location, with the other party. Before that point, a
provider and an employer see only the public profile and what they choose to say
in chat.
(2) A job you post is shown to providers whose services match it. Do not put
information in a job post that you do not want providers to see.
(3) Messages you send in a conversation are visible to the other participants.

### 7. Marketing and Social Media Showcase

We will only send you marketing messages, and only feature your identifiable
photo, name, or profile on Huza's own social media, advertising, or promotional
material, if you have given us **specific opt-in consent** for that purpose.
Each consent is separate from accepting these documents, is recorded with the
date you gave it, and can be withdrawn at any time in your settings or by
emailing support@huza.app.

Withdrawing consent stops any further such use by us. It may not be possible to
recover material already published or that other people have re-shared. Running
your public provider profile inside the marketplace (section 4) is part of
providing the service and does not depend on this consent.

### 8. Sharing With Service Providers and Others

We do not sell your personal data. We share it only:
(1) with **processors** who run parts of the service for us — hosting and
database providers, media/image hosting, the SMS provider that sends
verification codes and alerts, the push-notification service, and the payment
processor. Some operate outside Rwanda, so your data may be transferred
internationally; where that happens we take steps to keep it protected.
(2) with **authorities** where required by law, or to protect the rights,
safety, or property of users or Huza.
(3) in a **business transfer** — if Huza is merged with or acquired by another
organisation, user data may transfer as part of that transaction, subject to
this policy.
(4) as **aggregated or anonymised data** that does not identify you, for
research or reporting.

### 9. How Long We Keep Your Data

We keep your personal data for as long as your account is open, and for a
limited period afterwards to resolve disputes, enforce our terms, and meet
legal, tax, and accounting requirements in Rwanda. Transaction and booking
records, and consent records, are kept longer than profile content for those
reasons. When data is no longer needed we delete it or irreversibly anonymise
it.

### 10. Data Security

We use appropriate technical and organisational measures — encryption in
transit, access controls, and need-to-know staff access. No system is completely
secure. You are responsible for keeping your credentials and PIN confidential;
if you think your account has been accessed without permission, contact
support@huza.app immediately.

### 11. Your Rights

You have the right to: access the personal data we hold about you; have
inaccurate data corrected; ask for your data to be deleted; object to or
restrict certain processing; **withdraw any consent you have given, and see your
consent history**; and receive a copy of the data you provided in a portable
format.

To exercise any of these, email support@huza.app. We respond within 30 days. If
you are not satisfied, you may complain to the supervisory authority for data
protection in Rwanda.

### 12. Children

Huza is only for people aged 18 and over. We do not knowingly collect data from
anyone under 18. If we learn an account belongs to someone under 18, we will
close it and delete the associated data.

### 13. Changes to This Policy

We may update this policy as our practices, technology, or the law change. If a
change is significant — affecting your rights or how your data is used — we will
show you a summary and ask you to review and accept the updated policy before you
continue using Huza. Minor changes take effect when posted. The effective date
and version of the current policy are shown at the top of this page, and every
version you have accepted is in your consent history.

### 14. Contact Us

Huza.app LTD, Kigali, Rwanda. Email: support@huza.app. Phone: +250788000000.

---

## 5. What changed vs Version 1.1

| Area | V1.1 | V2.0 |
|---|---|---|
| Acceptance | Single tick, not recorded | Recorded per version, with date + device; append-only history |
| Document changes | "Continued use = acceptance" for everything | Material changes require active re-acceptance; minor changes notified |
| Marketing consent | Described as a separate opt-in | Same, **plus** grant/withdrawal timestamped and shown to the user |
| Social showcase | Described; toggle being built | Folded into a named consent register alongside marketing + location |
| Location | "with your permission" | Named consent, revocable, recorded |
| Consent records | Not mentioned | New Privacy §5 "How We Record Your Consent"; listed in data collected; covered by rights + retention |
| Rights | Access, correct, delete, object, portability | + see consent history, withdraw any consent from settings |

No data flow is *newly introduced* by V2 — it makes the existing V1.1 flows
demonstrable and refreshable.

---

## 6. Kinyarwanda

Both texts need a Kinyarwanda (`rw`) translation by a native speaker before the
`rw` locale rows are published (per the project's i18n policy — `rw` is not
AI-translated by default). Until then the CMS falls back `rw → en → bundled`, so
an English-only publish is safe but not ideal for a Rwanda-first product.

---

## 7. Implementation dependencies

V2 cannot be published until these exist:

1. **`ConsentRecord` table** (append-only) — `{ id, userId?, organizationId?,
   docType, docVersion, docLocale, acceptedAt, ipAddress, userAgent, method }`.
   Backfill one `IMPORT_LEGACY` row per existing user/document from their signup
   date.
2. **Consent register** — either extend the pattern started by
   `User.showcaseConsent` / `showcaseConsentAt` (branch `feat/showcase-consent`)
   into a `UserConsent` table `{ userId, key, granted, noticeVersion,
   changedAt }`, or keep per-flag columns + a change log. A table scales better
   to future consent keys.
3. **Acceptance capture on signup** — `completeSignup`, org register, and the
   PIN-set path currently ignore the client-side `termsAccepted` checkbox. They
   must receive `{ acceptedTermsVersion, acceptedPrivacyVersion }` and write
   `ConsentRecord` rows.
4. **Re-acceptance gate** — a blocking client screen shown when the user's
   latest accepted version for a doc is older than the current
   `LegalDocument.version` **and** that publish was flagged material. Needs a
   `materialChange: boolean` on the admin publish action and a
   `GET /legal/pending-acceptance` endpoint.
5. **Settings surface** — Settings → Marketing & Social Media already hosts the
   showcase toggle (branch `feat/showcase-consent`); add marketing-comms and
   location there, plus a read-only "Consent history" view.
6. **Legal review** — see §8.

Related branches: `legal/terms-privacy-rewrite` (V1.1 copy),
`feat/showcase-consent` (backend + frontend, the first consent-register entry).

---

## 8. Lawyer review checklist

Ask counsel specifically:

- Does Law Nº 058/2021 require **explicit registration / notification** of Huza
  as a data controller with the supervisory authority, and is that reflected
  correctly in Privacy §1 and §11?
- Is the **legitimate interests** basis (Privacy §3(3)) available under Rwandan
  law as drafted, or should those uses also run on consent?
- Is bundling **Terms acceptance** and **Privacy acknowledgement** into one
  signup action acceptable, given Privacy acknowledgement is framed as notice
  rather than consent?
- Are the **cross-border transfer** safeguards (Privacy §8) sufficient as
  described, or does each processor country need to be named / a transfer
  mechanism cited?
- **Retention periods** (Privacy §9) — do Rwandan tax/accounting/labour rules
  set specific minimums we should state as numbers?
- **Reviews** — is Huza's position on not removing honest reviews (Terms §7)
  defensible against a defamation claim in Rwanda? Is the right-of-reply enough?
- **Minors / age assurance** — is a self-declared 18+ checkbox enough, or is
  stronger age verification expected?
- **Limitation of liability** (Terms §15) — is the 12-month fee cap enforceable
  under Rwandan consumer law?
- **Governing law / jurisdiction** (Terms §18) — enforceable against consumers,
  or must disputes allow the consumer's local court?
- Does the **consent record** content (IP, user agent) itself need a stated
  purpose and retention limit to avoid being over-collection?
