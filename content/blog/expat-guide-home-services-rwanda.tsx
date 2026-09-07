import { APP_CONFIG } from "@/constant/app.config";
import type { BlogPost } from "./types";

const APP = APP_CONFIG.appUrl;

export const meta: BlogPost["meta"] = {
  slug: "expat-guide-home-services-rwanda",
  locale: "en",
  title: "The Expat Guide to Hiring Cleaners, Cooks and Drivers in Rwanda",
  description:
    "New to Kigali? A practical guide to hiring home cleaners, cooks and drivers in Rwanda — the roles, what to pay attention to, live-in vs live-out, and setting expectations.",
  keywords: [
    "hire a cleaner Kigali",
    "English-speaking cook Rwanda",
    "reliable drivers Kigali",
    "home services app Rwanda",
    "expat hiring Rwanda",
  ],
  publishedAt: "2026-09-07",
  status: "draft",
  reviewNote:
    "AI first draft. Needs a human pass — especially the cultural/operational notes and any pay-range guidance (left deliberately vague here) — before publishing.",
};

export function Body() {
  return (
    <>
      <p>
        If you have just moved to Kigali, you will hear the same advice from
        every direction: get help for the house. It is normal here, it is
        affordable relative to many countries, and it makes a real difference to
        how quickly you settle in. What newcomers usually lack is a sense of how
        to hire well — so they end up inheriting the previous tenant&rsquo;s
        cleaner with no idea whether that is a good fit.
      </p>

      <h2>Decide which roles you actually need</h2>
      <ul>
        <li>
          <strong>Cleaner / house helper.</strong> The most common hire. Can be a
          few mornings a week or full-time. Agree up front whether laundry,
          ironing, dishes and cooking are included or separate.
        </li>
        <li>
          <strong>Cook.</strong> Sometimes the same person, often not. If you
          want specific cuisines or have dietary needs, say so during the
          interview and do a trial day.
        </li>
        <li>
          <strong>Driver.</strong> Useful if you don&rsquo;t want to drive on
          unfamiliar roads or need school runs covered. Check licence, comfort
          with a manual gearbox if your car is manual, and knowledge of the city.
        </li>
        <li>
          <strong>Nanny / childcare.</strong> Treated in more depth in our
          <a href={`${APP.replace(/\/$/, "")}`}> guide to hiring a vetted nanny in Kigali</a>.
        </li>
      </ul>

      <h2>Language</h2>
      <p>
        Working Kinyarwanda is universal; English varies and French is common
        with older workers. If English is important for your household —
        instructions, phone messages, helping children with homework — filter for
        it and test it in conversation rather than taking it on trust.
      </p>

      <h2>Live-in vs live-out</h2>
      <p>
        Live-out is simpler and increasingly the norm in the city. Live-in
        arrangements need clear boundaries: private space, defined off-hours, a
        weekly day off that is genuinely off. Either way, transport allowance for
        a live-out worker is a normal part of the package.
      </p>

      <h2>Set expectations before day one</h2>
      <p>
        Write down hours, days off, monthly pay and the pay date, the specific
        tasks included, and the notice period on both sides. This protects
        everyone and removes the awkwardness of renegotiating later. A trial week
        is standard and expected.
      </p>

      <h2>Why a vetted marketplace beats inherited contacts</h2>
      <p>
        A handed-down phone number gives you no verification, no references you
        can reach, and no recourse. Huza App runs identity and background checks
        on every worker before their profile goes live, shows ratings from other
        households, lets you filter by skill (for example an English-speaking
        cook), and keeps communication in-app so there is a record.
      </p>
      <p>
        <a href={`${APP}/service`}>
          Browse verified cleaners, cooks and drivers near you on Huza App
        </a>
        .
      </p>
    </>
  );
}
