import { APP_CONFIG } from "@/constant/app.config";
import type { BlogPost } from "./types";

const APP = APP_CONFIG.appUrl;

// Kinyarwanda article — copy reviewed and edited by a native speaker (the site
// owner), 2026-09-07. Keep it native-speaker-only for future edits.
export const meta: BlogPost["meta"] = {
  slug: "huza-abakora-nabashaka-akazi-mu-rwanda",
  locale: "rw",
  title: "Uburyo wabona akazi ko mu rugo cyangwa serivisi kuri Huza App",
  description:
    "Menya uko Huza App ifasha abakozi bo mu Rwanda; abasukura, abateka, abarezi b'abana,abazamu, abashoferi n'abandi. Kubona abakiriya no gutangira akazi mu ntambwe eshatu.",
  keywords: [
    "akazi mu Rwanda",
    "gushaka akazi Kigali",
    "serivisi zo mu rugo",
    "abakozi b'abahanga Rwanda",
  ],
  publishedAt: "2026-09-07",
  status: "published",
  heroImage: "/blog/huza-abakora-nabashaka-akazi-mu-rwanda.jpg",
  heroImageAlt:
    "Abakozi ba serivisi za Huza bari hafi yawe; uteka, umurezi w'abana, umukanishi, usuka n'umushoferi.",
};

export function Body() {
  return (
    <>
      <p>
        Huza.app ni isoko rikorera kuri interineti rihuza ingo zo mu Rwanda
        n&rsquo;abakozi ba serivisi bagenzuwe. Niba ukora isuku, guteka, kurera
        abana, gutwara imodoka cyangwa ubundi bumenyi bukenerwa mu rugo, Huza igufasha
        kubonana n&rsquo;abakiriya bari hafi yawe.
      </p>

      <h2>Serivisi zikenerwa cyane</h2>
      <ul>
        <li>Isuku yo mu rugo</li>
        <li>Guteka no gufasha mu gikoni</li>
        <li>Kurera no kwita ku bana</li>
        <li>Gutwara imodoka</li>
        <li>Kwigisha abana mu rugo</li>
        <li>Kwita ku ubwiza n&rsquo;isuku y&rsquo;umubiri (make-up)</li>
      </ul>

      <h2>Intambwe eshatu zo gutangira</h2>
      <ol>
        <li>
          <strong>Kora umwirondoro.</strong> Fungura porogaramu ya Huza maze
          wandike amakuru yawe n&rsquo;ubumenyi ufite.
        </li>
        <li>
          <strong>Ohereza indangamuntu kugira ngo ugenzurwe.</strong> Ibi
          bituma abakiriya bakwizera kandi bikaguha akamenyetso k&rsquo;uko
          wagenzuwe, kandi biguma ari ibanga.
        </li>
        <li>
          <strong>Tangira kwakira ubusabe bw&rsquo;akazi.</strong> Iyo umukiriya
          agusabye, muvugana muri porogaramu, mwumvikana ku gihe no ku umushahara.
        </li>
      </ol>

      <h2>Kwiyandikisha ni ubuntu</h2>
      <p>
        Kwiyandikisha kuri Huza App nta kiguzi bisaba. Ushobora gukora
        umwirondoro ukanagenzurwa ku ubuntu.
      </p>
      <p>
        <a href={APP}>Fungura Huza App maze utangire</a>.
      </p>
    </>
  );
}
