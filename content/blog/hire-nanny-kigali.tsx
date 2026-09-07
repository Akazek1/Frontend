import { APP_CONFIG } from "@/constant/app.config";
import type { BlogPost } from "./types";

const APP = APP_CONFIG.appUrl;

export const meta: BlogPost["meta"] = {
  slug: "hire-nanny-kigali",
  locale: "en",
  title: "How to Hire a Safe, Vetted Nanny or Househelp in Kigali",
  description:
    "A practical guide to hiring a trustworthy nanny or house helper in Kigali — what real verification looks like, the questions to ask, and how to avoid the common risks.",
  keywords: [
    "hire a nanny Kigali",
    "vetted domestic workers Rwanda",
    "trusted househelp Kigali",
    "background-checked nanny Rwanda",
    "secure household staffing Kigali",
  ],
  publishedAt: "2026-09-07",
  status: "draft",
  reviewNote:
    "AI first draft. Needs a human editing pass for tone/accuracy and a check that every claim about Huza's verification flow matches what the product actually does before publishing.",
};

export function Body() {
  return (
    <>
      <p>
        Letting a new person into your home — around your children, your keys,
        your daily routine — is one of the most trust-heavy decisions a household
        makes. In Kigali, most families still hire the way they always have: a
        cousin&rsquo;s recommendation, a name passed along a WhatsApp group, a
        person who &ldquo;worked for a friend who moved away.&rdquo; That works
        until it doesn&rsquo;t, and when it doesn&rsquo;t there is usually no
        record, no reference you can actually call, and no way to know whether the
        same issue happened somewhere before.
      </p>
      <p>
        This guide covers what careful hiring looks like, whether you do it
        yourself or through a marketplace.
      </p>

      <h2>Why informal hiring goes wrong</h2>
      <ul>
        <li>
          <strong>No verification.</strong> A recommendation tells you someone
          was satisfied once. It doesn&rsquo;t confirm identity, age, or whether
          there were problems with a different family.
        </li>
        <li>
          <strong>Unclear expectations.</strong> Hours, days off, live-in vs.
          live-out, what &ldquo;cleaning&rdquo; includes, pay dates — if these
          aren&rsquo;t written down, every disagreement becomes your word against
          theirs.
        </li>
        <li>
          <strong>No accountability if they leave.</strong> If a worker
          disappears mid-month or something goes missing, an informal
          arrangement leaves you with nothing to act on.
        </li>
      </ul>

      <h2>What real verification should include</h2>
      <p>
        Whether it&rsquo;s you or a platform doing the checking, look for all
        three of these — not just one:
      </p>
      <ol>
        <li>
          <strong>Identity.</strong> A government ID (National ID) matched to the
          person in front of you, and a phone number that is actually theirs.
        </li>
        <li>
          <strong>Skills and background.</strong> For childcare specifically:
          references from a previous family you can reach by phone, and a
          conversation about first aid, ages they&rsquo;ve cared for, and how
          they handle a sick child or an emergency.
        </li>
        <li>
          <strong>Community trust signals.</strong> Reviews or ratings from other
          households, not a single testimonial. Patterns matter more than any one
          comment.
        </li>
      </ol>

      <h2>Questions worth asking in the interview</h2>
      <ul>
        <li>Why did you leave your last position?</li>
        <li>What hours and days are you looking for? Any commitments we should know about?</li>
        <li>Walk me through a normal day with a 2-year-old and a 6-year-old.</li>
        <li>What would you do if a child had a fever and I couldn&rsquo;t be reached for an hour?</li>
        <li>Can I call your previous employer today?</li>
      </ul>

      <h2>Put the arrangement in writing</h2>
      <p>
        Even a one-page agreement prevents most disputes: start date, hours,
        weekly day(s) off, monthly pay and pay date, live-in or live-out,
        transport allowance if any, notice period on both sides, and exactly
        which tasks are included. Both sides keep a copy.
      </p>

      <h2>How Huza App handles this</h2>
      <p>
        Huza App is Rwanda&rsquo;s on-demand marketplace for home and domestic
        services. Every worker who offers a service goes through identity and
        background checks before their profile is visible, households leave
        ratings after each job so reputation is something you can actually see,
        and all early communication happens in-app so there is a record if
        anything needs to be raised later.
      </p>
      <p>
        <a href={`${APP}/service`}>
          Browse verified nannies and house helpers in Gasabo, Kicukiro and
          Nyarugenge on Huza App
        </a>
        .
      </p>
    </>
  );
}
