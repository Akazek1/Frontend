import { APP_CONFIG } from "@/constant/app.config";
import type { BlogPost } from "./types";

const APP = APP_CONFIG.appUrl;

// ⚠️  KINYARWANDA — AI FIRST DRAFT. Must be reviewed and rewritten by a native
// Kinyarwanda speaker before `status` is changed to "published" (see the i18n
// translation policy: rw copy is native-speaker-only by default). Fix in place;
// do not regenerate.
export const meta: BlogPost["meta"] = {
  slug: "akazi-mu-rwanda-huza",
  locale: "rw",
  title: "Uburyo wabona akazi ko mu rugo cyangwa serivisi kuri Huza App",
  description:
    "Menya uko Huza App ifasha abakozi bo mu Rwanda — abasukura, abateka, abarezi b'abana, abashoferi n'abandi — kubona abakiriya no gutangira akazi mu ntambwe eshatu.",
  keywords: [
    "akazi mu Rwanda",
    "gushaka akazi Kigali",
    "serivisi zo mu rugo",
    "abakozi b'abahanga Rwanda",
  ],
  publishedAt: "2026-09-07",
  status: "draft",
  reviewNote:
    "Kinyarwanda AI draft — needs full native-speaker review and rewrite before publishing. Do not translate mechanically.",
};

export function Body() {
  return (
    <>
      <p>
        Huza App ni isoko rikorera kuri interineti rihuza ingo zo mu Rwanda
        n&rsquo;abakozi ba serivisi bagenzuwe. Niba ukora isuku, guteka, kurera
        abana, gutwara imodoka cyangwa ubundi bumenyi bwo mu rugo, Huza igufasha
        kubonana n&rsquo;abakiriya bari hafi yawe.
      </p>

      <h2>Serivisi zikenerwa cyane</h2>
      <ul>
        <li>Isuku yo mu rugo</li>
        <li>Guteka no gufasha mu gikoni</li>
        <li>Kurera no kwita ku bana</li>
        <li>Gutwara imodoka</li>
        <li>Kwigisha abana mu rugo</li>
        <li>Kwiyubaka no kwita ku isuku y&rsquo;umubiri (make-up)</li>
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
          wagenzuwe.
        </li>
        <li>
          <strong>Tangira kwakira ubusabe bw&rsquo;akazi.</strong> Iyo umukiriya
          agusabye, muvugana muri porogaramu, mwumvikana ku gihe no ku mushahara.
        </li>
      </ol>

      <h2>Kwiyandikisha ni ubuntu</h2>
      <p>
        Kwiyandikisha kuri Huza App nta kiguzi bisaba. Ushobora gukora
        umwirondoro ukanagenzurwa ku buntu.
      </p>
      <p>
        <a href={APP}>Fungura Huza App maze utangire</a>.
      </p>
    </>
  );
}
