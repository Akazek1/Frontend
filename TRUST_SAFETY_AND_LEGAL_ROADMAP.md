# Huza.app — Trust & Safety and Legal Roadmap

> **Status:** planning doc. Nothing here is built yet.
>
> **Context:** Version 1 of the Terms & Privacy Policy is shipping on branch
> `legal/terms-privacy-rewrite`. That copy already *describes* the behaviour in
> this document (an enforcement record kept after a ban; reputation linked to
> verified identity). This doc is the engineering + future-legal backlog that
> makes those promises real.
>
> **Owner:** Huza.app LTD · **Drafted:** 2026-08-29

---

## 1. Problem: account deletion as a reputation / ban reset

Two abuse cases:

1. **Ban evasion** — a user is suspended or banned for a serious breach (fraud,
   abuse, safety), deletes the account (or it is terminated), then signs up
   again with the same phone or a new SIM and carries on.
2. **Reputation laundering** — a provider accumulates bad reviews or substantiated
   reports, deletes the account, and re-registers with a clean slate.

Right now Huza.app has nothing to stop either: deletion removes the data, a new
phone number is cheap, and reputation lives on the account row, not the person.

## 2. How comparable platforms handle it

The standard technique is a **suppression list** (a.k.a. blocklist /
"do-not-onboard" list): on ban, keep a *minimal, one-way-hashed* set of
identifiers so the platform can recognise a returning banned user even after the
profile is gone.

Commonly retained (hashed, not readable):

- phone number, email
- **government ID number** — the strongest signal; a person can get a new SIM but
  not a new national ID. Huza.app already collects ID from providers at
  verification.
- device fingerprint; payment-instrument fingerprint
- sometimes a face embedding from the ID selfie (Uber, Bumble)

Plus non-identifying context: ban reason, date, linked report/evidence IDs.

At signup (and at ID verification) the incoming identifiers are hashed and
checked against the list. A hit → block registration, or silently flag for
manual review so the evader can't tell which signal caught them.

| Platform | Approach |
|---|---|
| Uber / Lyft | Identity tied to verified ID + face; permanent-deactivation records retained; same-identity re-onboarding detected |
| Airbnb | Privacy policy explicitly retains info after account closure "for safety, security and fraud prevention" |
| Bumble / Tinder / Hinge | Hashed identifiers + photo/face matching, specifically because ban evasion is constant |
| eBay / Etsy / Amazon | Seller suppression lists keyed on name, address, email, bank account, device |
| Reddit / Discord / Meta | Retain banned-account signals; ban evasion is itself a policy violation |

## 3. Is retaining this lawful despite a deletion request?

Yes, with limits. Rwanda's Law Nº 058/2021 (like GDPR Art. 17(3)) allows
refusing or partly refusing erasure where retention is necessary for:

- compliance with a legal obligation,
- establishment, exercise or defence of legal claims,
- **preventing fraud / abuse and protecting the rights and safety of others**.

Trust & Safety blocklists sit under the last one. What keeps it lawful:

1. **Minimise** — store hashes + reason + date. Not the profile, photos, or
   message history beyond a defined dispute window.
2. **Purpose-lock** — the list is used *only* to enforce the ban. Never
   marketing, analytics, ranking, anything else.
3. **Time-box where possible** — duration of the ban; permanent only for serious
   safety cases (violence, fraud, safeguarding).
4. **Disclose** — the privacy policy states that terminated accounts leave a
   retained enforcement record, and the deletion-rights section states the
   exception. (Done in V1: Privacy §9 and §11.)
5. **Access control** — only the safety team can read it.

## 4. Recommended implementation (V1)

### 4.1 `SuppressionEntry` table

| Field | Notes |
|---|---|
| `id` | |
| `phoneHash` | HMAC-SHA-256 of the normalised E.164 phone, keyed with a server secret |
| `emailHash` | same, nullable |
| `idNumberHash` | same, nullable — only present once the account had a verified ID |
| `deviceHashes` | string[], best-effort |
| `reason` | enum: `FRAUD` \| `ABUSE` \| `SAFETY` \| `SPAM` \| `OTHER` |
| `severity` | `PERMANENT` \| `TIME_LIMITED` |
| `expiresAt` | nullable; set for `TIME_LIMITED` |
| `sourceUserId` | the account that was banned (kept for the safety team; itself purged on schedule) |
| `evidenceRef` | link to the report / audit record |
| `createdAt`, `createdByAdminId` | |

Use HMAC with a secret, not a plain hash — a bare SHA-256 of a phone number is
trivially brute-forced (there are only ~10^9 Rwandan numbers).

### 4.2 Hooks

- **On ban** (`AdminService.banUser` / equivalent): write the `SuppressionEntry`,
  notify the user, then schedule account anonymisation after the dispute window
  (e.g. 90 days) rather than immediate hard delete.
- **On self-service deletion** (`DELETE /users/:id` or the user-initiated path):
  anonymise PII, but retain (a) transaction/booking rows for accounting/legal
  retention, (b) any open reports or unresolved safety flags, (c) a
  `SuppressionEntry` **only if** a ban was active/pending or there were
  substantiated reports. A clean account leaves nothing.
- **On registration** (`AuthService.completeSignup`, org register): hash the
  incoming phone/email, check the list. Match on a `PERMANENT` entry → block with
  a generic message. Match on `TIME_LIMITED` and not expired → block until
  `expiresAt`. Otherwise allow.
- **On ID verification** (when `governmentIdStatus` moves to approved): hash the
  ID number, check the list, and also **link to any past account with the same
  `idNumberHash`** so the safety team sees the history. This is where reputation
  laundering is actually caught.

### 4.3 Reputation ↔ identity

- Add `identityKey` on `User` = `idNumberHash` once verified (nullable before).
- When a provider re-registers and verifies with the same `identityKey`, surface
  the prior account(s) and their review history to admins. Do **not** silently
  republish old reviews onto the new profile — that has its own fairness and
  legal questions — but let T&S decide (re-ban, warn, or clear).

### 4.4 Admin surface

- Suppression list view (search by hash-match of a typed phone/email/ID), with
  reason, date, evidence link, and an "add" / "lift" action.
- On a flagged registration, a review queue item.

### 4.5 Open questions for the team

- Dispute-window length before anonymisation (90 days?).
- Whether `TIME_LIMITED` bans are worth the complexity for V1 or everything is
  `PERMANENT` until manually lifted.
- Retention cap on `SuppressionEntry` for non-safety reasons (spam) — e.g. auto-
  expire after 2 years.
- Whether to store a face embedding from the ID selfie now or defer (higher
  sensitivity, needs its own DPIA).

## 5. Legal review checklist (V1 copy + this design)

Ask Rwandan counsel:

- Does Law Nº 058/2021 require Huza.app to **register / notify** as a data
  controller with the supervisory authority, and is Privacy §1 / §11 correct?
- Is the **legitimate-interests** basis (Privacy §3(3)) available as drafted for
  fraud prevention and ban-evasion suppression, or must some of it run on
  another basis?
- Is the **suppression record** (hashed phone / email / ID + reason + date)
  proportionate, and is the disclosure in Privacy §9 sufficient?
- Is bundling **acceptance of the Terms** and **the social-media/app-content
  use** (Privacy §7 / Terms §6) into signup acceptable, given it is framed as a
  condition of the free service and users can ask not to be individually
  featured? Would counsel prefer an unbundled tick for the media use?
- Are the **cross-border transfer** safeguards (Privacy §8) sufficient, or does
  each processor country / mechanism need naming?
- **Retention periods** (Privacy §9) — do Rwandan tax / accounting / labour rules
  set specific minimums to state as numbers?
- **Reviews** (Terms §7) — is "we don't remove honest reviews" defensible
  against a defamation claim in Rwanda? Is the right of reply enough?
- **Age assurance** — is a self-declared 18+ checkbox enough?
- **Limitation of liability** (Terms §15) — is the 12-month fee cap enforceable
  under Rwandan consumer law?
- **Governing law / jurisdiction** (Terms §18) — enforceable against consumers,
  or must disputes allow the consumer's local court?

## 6. Later: recorded & versioned consent

Not needed for V1 (test users only, and the media use is bundled into signup by
design). Worth doing before scale:

- **`ConsentRecord`** (append-only) — `{ userId?, organizationId?, docType,
  docVersion, docLocale, acceptedAt, ipAddress, userAgent, method }`. Backfill
  one `IMPORT_LEGACY` row per existing user/doc from their signup date.
- **Acceptance capture at signup** — `completeSignup`, org register, and the
  PIN-set path currently discard the client-side `termsAccepted` checkbox. Pass
  `{ acceptedTermsVersion, acceptedPrivacyVersion }` and write a `ConsentRecord`.
- **Re-acceptance gate** — a blocking screen when the user's latest accepted
  version is older than the current `LegalDocument.version` *and* that publish
  was flagged material. Needs a `materialChange` flag on the admin publish action
  and a `GET /legal/pending-acceptance` endpoint.
- **Consent history view** in settings so a user can see what they accepted and
  when.

If/when this ships, the "Changes to this document" sections in the V1 Terms &
Privacy Policy should be tightened from "continued use = acceptance" back to
"material changes require active re-acceptance".

## 7. Related branches

| Branch | Repo | What |
|---|---|---|
| `legal/terms-privacy-rewrite` | Frontend | Version 1 Terms & Privacy copy (this doc describes work it references) |
| `feat/showcase-consent` | Backend + Frontend | **Superseded** — a per-user social-media opt-in toggle. Not proceeding; V1 bundles this consent into signup. Branches left unmerged. |
