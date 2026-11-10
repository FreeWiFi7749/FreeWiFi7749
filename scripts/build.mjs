// プロフィール README 用の SVG を作るスクリプト。依存パッケージなし。
//   node scripts/build.mjs            hero とカードを作る。GH_TOKEN があれば year.svg も実データで作る
//   node scripts/build.mjs --sample   year.svg を見た目確認用のダミーデータで作る（コミットしない）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const profile = JSON.parse(readFileSync(join(root, "profile.json"), "utf8"));
const outDir = join(root, "assets");
mkdirSync(outDir, { recursive: true });

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue','Hiragino Sans','Noto Sans JP',sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace`;
const COLORS = ["#F99742", "#FFD166", "#FF7EB6", "#7CC8FF"];

// 毎回同じ絵になるように種つきの乱数を使う
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(2));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function stars(rand, w, h, count) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = f(rand() * w);
    const y = f(rand() * h);
    const r = f(0.5 + rand() * 0.9);
    const o = f(0.25 + rand() * 0.5);
    const tw = rand() < 0.35 ? ` class="tw" style="animation-delay:-${f(rand() * 6)}s"` : "";
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"${tw}/>`;
  }
  return out;
}

const SKY = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#060914"/><stop offset=".7" stop-color="#0c1230"/><stop offset="1" stop-color="#141a3c"/>
</linearGradient>`;

// ---------------------------------------------------------------- hero
function hero() {
  const W = 1200, H = 440, HORIZON = 372, CYCLE = 10;
  const rand = rng(7749);
  const bursts = [
    { x: 905, y: 150, r: 128, c: "#F99742", c2: "#FFD166", n: 30, d: 0.6 },
    { x: 1085, y: 232, r: 78, c: "#FF7EB6", c2: "#FFC2DC", n: 22, d: 3.4 },
    { x: 735, y: 218, r: 88, c: "#7CC8FF", c2: "#D6EEFF", n: 24, d: 6.2 },
    { x: 1010, y: 96, r: 58, c: "#FFD166", c2: "#FFF1C2", n: 18, d: 8.1 },
  ];

  let fx = "", glow = "";
  for (const b of bursts) {
    const delay = `animation-delay:${b.d}s`;
    let parts = "";
    for (let i = 0; i < b.n; i++) {
      const a = f((360 / b.n) * i + rand() * 4);
      const r = f(b.r * (0.92 + rand() * 0.16));
      parts += `<g transform="rotate(${a})"><line class="p" x1="0" x2="${r}" pathLength="100" stroke="${b.c}" stroke-width="2.6" style="${delay}"/></g>`;
    }
    const inner = Math.round(b.n * 0.6);
    for (let i = 0; i < inner; i++) {
      const a = f((360 / inner) * i + 180 / inner + rand() * 5);
      const r = f(b.r * (0.5 + rand() * 0.1));
      parts += `<g transform="rotate(${a})"><line class="p" x1="0" x2="${r}" pathLength="100" stroke="${b.c2}" stroke-width="1.8" style="${delay}"/></g>`;
    }
    fx += `<g transform="translate(${b.x} ${b.y})">
<circle class="trail" r="2.2" fill="${b.c2}" style="--h:${HORIZON - b.y}px;${delay}"/>
<circle class="flash" r="${f(b.r * 0.9)}" fill="url(#glow-${b.c.slice(1)})" style="${delay}"/>
<g class="droop" style="${delay}">${parts}</g>
</g>`;
    glow += `<ellipse class="refl" cx="${b.x}" cy="${HORIZON + 26}" rx="${f(b.r * 0.9)}" ry="16" fill="${b.c}" style="${delay}"/>`;
  }
  const grads = bursts
    .map((b) => `<radialGradient id="glow-${b.c.slice(1)}"><stop offset="0" stop-color="${b.c}" stop-opacity=".55"/><stop offset="1" stop-color="${b.c}" stop-opacity="0"/></radialGradient>`)
    .join("");

  let chips = "", cx = 72;
  for (const s of profile.stack) {
    const w = Math.round(s.length * 7.4 + 26);
    chips += `<g transform="translate(${cx} 318)"><rect width="${w}" height="26" rx="13" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".16"/><text x="${w / 2}" y="17.5" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#c9d1ee">${esc(s)}</text></g>`;
    cx += w + 8;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(profile.name)} / ${esc(profile.handle)} — ${esc(profile.tagline)}">
<defs>
${SKY}
<linearGradient id="tag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFD166"/><stop offset=".5" stop-color="#F99742"/><stop offset="1" stop-color="#FF7EB6"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f26"/><stop offset="1" stop-color="#05070f"/></linearGradient>
<filter id="soft" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="14"/></filter>
<clipPath id="card"><rect width="${W}" height="${H}" rx="28"/></clipPath>
${grads}
</defs>
<style>
.p{stroke-linecap:round;stroke-dasharray:30 200;stroke-dashoffset:30;opacity:0;animation:fly ${CYCLE}s cubic-bezier(.12,.7,.25,1) infinite backwards}
.trail{opacity:0;animation:rise ${CYCLE}s ease-out infinite backwards}
.flash{opacity:0;animation:flash ${CYCLE}s ease-out infinite backwards}
.droop{animation:droop ${CYCLE}s ease-in infinite backwards}
.refl{opacity:0;animation:refl ${CYCLE}s ease-out infinite backwards}
.tw{animation:tw 5s ease-in-out infinite}
@keyframes fly{0%,12%{stroke-dashoffset:30;opacity:0}13%{opacity:1}42%{stroke-dashoffset:-70;opacity:1}66%,100%{stroke-dashoffset:-76;stroke-dasharray:14 200;opacity:0}}
@keyframes rise{0%{transform:translateY(var(--h));opacity:0}2%{opacity:.9}12%{transform:translateY(0);opacity:.9}13%,100%{transform:translateY(0);opacity:0}}
@keyframes flash{0%,12%{transform:scale(.1);opacity:0}16%{transform:scale(1);opacity:.9}45%,100%{transform:scale(1.25);opacity:0}}
@keyframes droop{0%,36%{transform:translateY(0)}70%,100%{transform:translateY(16px)}}
@keyframes refl{0%,12%{opacity:0}20%{opacity:.34}66%,100%{opacity:0}}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
@media (prefers-reduced-motion:reduce){
.p,.trail,.flash,.droop,.refl,.tw{animation:none}
.p{opacity:.95;stroke-dashoffset:-70}
.refl{opacity:.28}
}
</style>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(rand, W, HORIZON - 10, 90)}
<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#water)"/>
<g filter="url(#soft)">${glow}</g>
<line x1="0" y1="${HORIZON}" x2="${W}" y2="${HORIZON}" stroke="#fff" stroke-opacity=".1"/>
${fx}
<text x="72" y="118" font-family="${MONO}" font-size="15" letter-spacing="3" fill="#8f9bc7">${esc(profile.handle.toUpperCase())}  /  ${esc(profile.site.toUpperCase())}</text>
<text x="70" y="202" font-family="${FONT}" font-size="76" font-weight="700" letter-spacing="-1.5" fill="#fff">${esc(profile.name)}</text>
<text x="72" y="262" font-family="${FONT}" font-size="34" font-weight="600" fill="url(#tag)">${esc(profile.tagline)}</text>
${chips}
</g>
</svg>
`;
}

// ---------------------------------------------------------------- cards
function art(kind, accent) {
  if (kind === "keys") {
    // 12キーのフリック配列。押しているキーだけ色をつける
    let k = "";
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        const on = r === 1 && c === 1;
        k += `<rect x="${c * 34}" y="${r * 30}" width="29" height="25" rx="6" fill="${on ? accent : "#fff"}" fill-opacity="${on ? 1 : 0.09}"${on ? ' class="press"' : ""}/>`;
      }
    return `<g transform="translate(446 42)">${k}</g>`;
  }
  let rays = "";
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    const r1 = i % 2 ? 16 : 22, r2 = i % 2 ? 34 : 52;
    rays += `<line x1="${f(Math.cos(a) * r1)}" y1="${f(Math.sin(a) * r1)}" x2="${f(Math.cos(a) * r2)}" y2="${f(Math.sin(a) * r2)}" stroke="${accent}" stroke-width="2.4" stroke-linecap="round" opacity="${i % 2 ? 0.55 : 1}"/>`;
  }
  return `<g transform="translate(496 100)"><g class="spin">${rays}</g><circle r="4" fill="#fff"/></g>`;
}

function card(w) {
  const W = 590, H = 200;
  const rand = rng(w.id.length * 97 + w.title.charCodeAt(0));
  const lines = w.lines.map((l, i) => `<text x="36" y="${118 + i * 24}" font-family="${FONT}" font-size="15.5" fill="#c9d1ee">${esc(l)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(w.title)} — ${esc(w.lines.join(""))}">
<defs>${SKY}<clipPath id="c"><rect width="${W}" height="${H}" rx="22"/></clipPath></defs>
<style>
.press{animation:press 3.2s ease-in-out infinite}
.spin{animation:spin 40s linear infinite}
@keyframes press{0%,100%{fill-opacity:1}50%{fill-opacity:.45}}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.press,.spin{animation:none}}
</style>
<g clip-path="url(#c)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(rand, W, H, 26)}
${art(w.art, w.accent)}
<text x="36" y="46" font-family="${MONO}" font-size="12" letter-spacing="2.5" fill="${w.accent}">${esc(w.label)}</text>
<text x="35" y="86" font-family="${FONT}" font-size="32" font-weight="700" fill="#fff">${esc(w.title)}</text>
${lines}
<text x="36" y="174" font-family="${MONO}" font-size="13" fill="#8f9bc7">${esc(w.url)} →</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="21.5" fill="none" stroke="#fff" stroke-opacity=".08"/>
</svg>
`;
}

// ---------------------------------------------------------------- year
// 1か月を1発の花火にする。光の筋1本が1日で、長さがその日のコントリビューション数。
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function groupByMonth(days) {
  const map = new Map();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  return [...map.entries()].slice(-12).map(([key, list]) => {
    const [y, m] = key.split("-").map(Number);
    return { y, m, list, size: new Date(y, m, 0).getDate() };
  });
}

function year(days) {
  const W = 1200, H = 300, CY = 150, CYCLE = 22;
  const rand = rng(2026);
  const months = days ? groupByMonth(days) : null;
  const max = months ? Math.max(1, ...months.flatMap((mo) => mo.list.map((d) => d.count))) : 1;
  const total = months ? months.reduce((s, mo) => s + mo.list.reduce((a, d) => a + d.count, 0), 0) : 0;
  const step = (W - 120) / 12;

  let body = "";
  for (let i = 0; i < 12; i++) {
    const cx = f(60 + step * (i + 0.5));
    const mo = months?.[i];
    const size = mo ? mo.size : 30;
    const color = COLORS[i % COLORS.length];
    let rays = "", sum = 0;
    for (let d = 0; d < size; d++) {
      const day = mo?.list.find((x) => Number(x.date.slice(8)) === d + 1);
      if (mo && !day) continue; // まだ来ていない日は描かない
      const count = day ? day.count : 0;
      sum += count;
      const a = (Math.PI * 2 * d) / size - Math.PI / 2;
      const cos = Math.cos(a), sin = Math.sin(a);
      if (count === 0) {
        rays += `<circle cx="${f(cos * 9)}" cy="${f(sin * 9)}" r="1" fill="#fff" opacity=".28"/>`;
        continue;
      }
      const len = 7 + 33 * Math.sqrt(count / max);
      const o = f(0.55 + 0.45 * Math.sqrt(count / max));
      rays += `<line x1="${f(cos * 8)}" y1="${f(sin * 8)}" x2="${f(cos * (8 + len))}" y2="${f(sin * (8 + len))}" stroke="${color}" stroke-width="1.7" stroke-linecap="round" opacity="${o}"/>`;
      rays += `<circle cx="${f(cos * (8 + len))}" cy="${f(sin * (8 + len))}" r="1.5" fill="#fff" opacity="${o}"/>`;
    }
    const label = mo ? MONTHS[mo.m - 1] : "";
    body += `<g transform="translate(${cx} ${CY})"><g class="bloom" style="animation-delay:${f(i * 0.28)}s">${rays}</g>`;
    if (mo) {
      body += `<text y="76" text-anchor="middle" font-family="${MONO}" font-size="11.5" letter-spacing="2" fill="#8f9bc7">${label}</text>`;
      body += `<text y="94" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#c9d1ee">${sum.toLocaleString("en-US")}</text>`;
    }
    body += `</g>`;
  }

  const head = months
    ? `<tspan fill="#fff" font-weight="700">${total.toLocaleString("en-US")}</tspan> contributions in the last 12 months`
    : `Updates daily`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${months ? `${total} contributions in the last 12 months` : "Contributions"}">
<defs>${SKY}<clipPath id="c"><rect width="${W}" height="${H}" rx="24"/></clipPath></defs>
<style>
.bloom{animation:bloom ${CYCLE}s cubic-bezier(.15,.7,.25,1) infinite backwards}
.tw{animation:tw 5s ease-in-out infinite}
@keyframes bloom{0%{transform:scale(.15);opacity:0}5%{transform:scale(1);opacity:1}90%{transform:scale(1);opacity:1}97%,100%{transform:scale(1.06);opacity:0}}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
@media (prefers-reduced-motion:reduce){.bloom,.tw{animation:none}}
</style>
<g clip-path="url(#c)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars(rand, W, H, 60)}
<text x="60" y="52" font-family="${FONT}" font-size="17" fill="#c9d1ee">${head}</text>
<text x="${W - 60}" y="52" text-anchor="end" font-family="${MONO}" font-size="11.5" letter-spacing="2" fill="#8f9bc7">1 RAY = 1 DAY</text>
${body}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".08"/>
</svg>
`;
}

async function fetchDays(token) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-readme" },
    body: JSON.stringify({ query, variables: { login: profile.login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
}

function sampleDays() {
  const rand = rng(1);
  const days = [];
  const end = new Date();
  for (let i = 370; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400000);
    days.push({ date: d.toISOString().slice(0, 10), count: rand() < 0.2 ? 0 : Math.floor(rand() ** 2.5 * 60) });
  }
  return days;
}

const write = (name, svg) => {
  writeFileSync(join(outDir, name), svg);
  console.log(`assets/${name}  ${(svg.length / 1024).toFixed(1)} KB`);
};

write("hero.svg", hero());
for (const w of profile.works) write(`work-${w.id}.svg`, card(w));

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (process.argv.includes("--sample")) write("year.svg", year(sampleDays()));
else if (process.argv.includes("--empty")) write("year.svg", year(null));
else if (token) write("year.svg", year(await fetchDays(token)));
else console.log("GH_TOKEN がないので year.svg は作り直していません");
