// プロフィール README 用の SVG を作るスクリプト。
//   npm ci && node scripts/build.mjs   hero と作品の行を作る。GH_TOKEN があれば year.svg も実データで作る
//   node scripts/build.mjs --sample    year.svg を見た目確認用のダミーデータで作る（コミットしない）
//   node scripts/build.mjs --empty     year.svg をデータなしの状態で作る
//
// 文字は書体（しっぽり明朝 B1、SIL OFL）の輪郭をパスにして埋め込む。
// README の画像は外部フォントを読めないので、こうしないと見る端末ごとに書体が変わる。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const profile = JSON.parse(readFileSync(join(root, "profile.json"), "utf8"));
const outDir = join(root, "assets");
mkdirSync(outDir, { recursive: true });

const INK = "#0a0b0f"; // 夜空
const PAPER = "#f1ede4"; // 文字の白
const DIM = "#a39f95";
const FAINT = "#6d6a63";
const GOLD = "#e3b565";

// ---------------------------------------------------------------- 道具
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n, d = 1) => Number(n.toFixed(d));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fontCache = new Map();
function fontsFor(weight) {
  if (!fontCache.has(weight)) {
    const dir = join(root, "node_modules/@fontsource/shippori-mincho-b1/files");
    fontCache.set(
      weight,
      ["japanese", "latin"].map((sub) => opentype.loadSync(join(dir, `shippori-mincho-b1-${sub}-${weight}-normal.woff`))),
    );
  }
  return fontCache.get(weight);
}

// 文字列を輪郭のパスにする。anchor は start / middle / end
function text(str, x, y, size, { weight = 500, fill = PAPER, spacing = 0, anchor = "start", opacity } = {}) {
  const fonts = fontsFor(weight);
  let cx = 0;
  const items = [];
  for (const ch of str) {
    const font = fonts.find((ft) => ft.charToGlyphIndex(ch) > 0) ?? fonts[0];
    const glyph = font.charToGlyph(ch);
    items.push({ glyph, x: cx });
    cx += (glyph.advanceWidth / font.unitsPerEm) * size + spacing;
  }
  const width = cx - spacing;
  const ox = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
  const d = items.map((it) => it.glyph.getPath(ox + it.x, y, size).toPathData(1)).join("");
  return `<path d="${d}" fill="${fill}"${opacity != null ? ` opacity="${opacity}"` : ""}/>`;
}

// ---------------------------------------------------------------- 花火
// 星は球面に均等に並べて平面へ投影し、空気抵抗で減速しながら重力で垂れる軌道を描く。
// 線は中心から伸びて、そのあと中心側から燃え尽きていく（stroke-dashoffset を 1 → 0 → -1）。
const RISE = 1.1, GROW = 1.9, HOLD = 0.5, BURN = 2.6;
const LIFE = RISE + GROW + HOLD + BURN;

function burstCss(cycle) {
  const p = (t) => f((t / cycle) * 100, 2) + "%";
  const t1 = RISE, t2 = t1 + GROW, t3 = t2 + HOLD, t4 = t3 + BURN;
  return `
.s{fill:none;stroke-linecap:round;stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0;animation:star ${cycle}s linear infinite backwards}
.rise{fill:none;stroke-linecap:round;stroke-dasharray:.07 1;stroke-dashoffset:.07;opacity:0;animation:rise ${cycle}s linear infinite backwards}
.flash{opacity:0;animation:flash ${cycle}s linear infinite backwards}
.fall{animation:fall ${cycle}s linear infinite backwards}
.tip{opacity:0;animation:tip ${cycle}s linear infinite backwards}
.rip{opacity:0;animation:rip ${cycle}s linear infinite backwards}
@keyframes star{0%,${p(t1)}{stroke-dashoffset:1;opacity:0}${p(t1 + 0.02)}{stroke-dashoffset:1;opacity:1;animation-timing-function:cubic-bezier(.08,.62,.25,1)}${p(t2)}{stroke-dashoffset:0;opacity:1}${p(t3)}{stroke-dashoffset:0;opacity:1;animation-timing-function:cubic-bezier(.4,0,.8,.6)}${p(t4)},100%{stroke-dashoffset:-.82;opacity:0}}
@keyframes rise{0%{stroke-dashoffset:.07;opacity:.75;animation-timing-function:cubic-bezier(.2,.6,.4,1)}${p(t1)}{stroke-dashoffset:-.96;opacity:.5}${p(t1 + 0.05)},100%{stroke-dashoffset:-.96;opacity:0}}
@keyframes flash{0%,${p(t1)}{opacity:0;transform:scale(.2)}${p(t1 + 0.12)}{opacity:.85;transform:scale(1)}${p(t2)},100%{opacity:0;transform:scale(1.15)}}
@keyframes fall{0%,${p(t2)}{transform:translateY(0);animation-timing-function:ease-in}${p(t4)},100%{transform:translateY(14px)}}
@keyframes tip{0%,${p(t2 - 0.3)}{opacity:0}${p(t2)}{opacity:1}${p(t2 + 0.5)}{opacity:.2}${p(t2 + 0.9)}{opacity:.9}${p(t2 + 1.4)}{opacity:.15}${p(t2 + 1.9)}{opacity:.7}${p(t4)},100%{opacity:0}}
@keyframes rip{0%,${p(t1)}{opacity:0}${p(t1 + 0.5)}{opacity:.5}${p(t3)}{opacity:.35}${p(t4)},100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
.s,.rise,.flash,.fall,.tip,.rip{animation:none}
.s{stroke-dashoffset:0;opacity:.9}
.rip{opacity:.3}
}`;
}

// b: { id, x, y, R, n, droop, width, stops:[[offset,color]], delay, tips, from }
function burst(b, rand) {
  const delay = `animation-delay:${b.delay}s`;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const spin = rand() * Math.PI * 2;
  let stars = "", tips = "";
  for (let i = 0; i < b.n; i++) {
    const z = 1 - (2 * (i + 0.5)) / b.n;
    const flat = Math.sqrt(1 - z * z); // 手前や奥へ飛ぶ星は短く見える
    const th = i * golden + spin + (rand() - 0.5) * 0.2;
    const reach = b.R * flat * (0.94 + rand() * 0.12);
    if (reach < b.R * 0.12) continue;
    const dx = Math.cos(th), dy = Math.sin(th);
    let d = "", ex = 0, ey = 0;
    for (let k = 0; k <= 9; k++) {
      const s = 0.05 + (0.95 * k) / 9;
      const out = (1 - Math.exp(-3.2 * s)) / (1 - Math.exp(-3.2));
      ex = dx * reach * out;
      ey = dy * reach * out + b.droop * s * s;
      d += `${k ? "L" : "M"}${f(ex)} ${f(ey)}`;
    }
    stars += `<path class="s" pathLength="1" d="${d}" style="${delay}"/>`;
    if (b.tips && i % 2 === 0)
      tips += `<circle class="tip" cx="${f(ex)}" cy="${f(ey)}" r="1.3" style="animation-delay:${f(b.delay + rand() * 0.5, 2)}s"/>`;
  }
  const stops = b.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
  const last = b.stops[b.stops.length - 1][1];
  const defs = `<radialGradient id="g${b.id}" gradientUnits="userSpaceOnUse" cx="0" cy="${f(b.droop * 0.4)}" r="${f(b.R * 1.04)}">${stops}</radialGradient>
<radialGradient id="h${b.id}"><stop offset="0" stop-color="${b.stops[0][1]}" stop-opacity=".5"/><stop offset=".5" stop-color="${last}" stop-opacity=".14"/><stop offset="1" stop-color="${last}" stop-opacity="0"/></radialGradient>`;

  let rise = "";
  if (b.from != null) {
    const h = b.from - b.y, sway = (rand() - 0.5) * 34;
    rise = `<path class="rise" pathLength="1" d="M${f(sway)} ${f(h)}C${f(sway * 0.9)} ${f(h * 0.6)} ${f(sway * 0.2)} ${f(h * 0.3)} 0 0" stroke="${b.stops[0][1]}" stroke-width="1.6" style="${delay}"/>`;
  }
  const body = `<g transform="translate(${b.x} ${b.y})">${rise}
<circle class="flash" r="${f(b.R * 0.75)}" fill="url(#h${b.id})" style="${delay}"/>
<g class="fall" style="${delay}"><g stroke="url(#g${b.id})" stroke-width="${b.width}">${stars}</g><g fill="${b.stops[0][1]}">${tips}</g></g>
</g>`;
  return { defs, body };
}

// 水面に映るゆらぎ。短い横線を不ぞろいに散らす
function ripples(b, top, rand) {
  let out = "";
  const colors = b.stops.map((st) => st[1]);
  for (let i = 0; i < 26; i++) {
    const depth = rand() ** 1.6; // 岸に近いほど多い
    const y = top + 6 + depth * 66;
    const w = (5 + rand() * 30) * (1 - depth * 0.5);
    const x = b.x + (rand() + rand() - 1) * b.R * (0.55 - depth * 0.2);
    const color = colors[Math.floor(rand() * colors.length)];
    out += `<line class="rip" x1="${f(x - w / 2)}" y1="${f(y)}" x2="${f(x + w / 2)}" y2="${f(y)}" stroke="${color}" stroke-width="${f(0.7 + rand() * 0.8)}" stroke-linecap="round" style="animation-delay:${f(b.delay + rand() * 0.5, 2)}s"/>`;
  }
  return out;
}

const KAMURO = [[0, "#fff4d2"], [0.3, "#ffd98a"], [0.72, "#f0a63c"], [1, "#b85a17"]];
const BENI = [[0, "#ffe9b0"], [0.34, "#ffcf7a"], [0.5, "#ff5a47"], [1, "#d81f3a"]];
const GIN = [[0, "#ffffff"], [0.45, "#d3e8ff"], [1, "#6aaeff"]];
const WABI = [[0, "#fff4d2"], [0.5, "#ffb659"], [1, "#f97f2b"]];

// ---------------------------------------------------------------- hero
function hero() {
  const W = 1200, H = 500, HORIZON = 418, CYCLE = 16;
  const rand = rng(7749);
  const bursts = [
    { id: 1, x: 905, y: 176, R: 214, n: 170, droop: 66, width: 1.25, stops: KAMURO, delay: 0, tips: true },
    { id: 2, x: 722, y: 252, R: 104, n: 96, droop: 20, width: 1.4, stops: BENI, delay: 4.6 },
    { id: 3, x: 1096, y: 300, R: 72, n: 64, droop: 12, width: 1.4, stops: GIN, delay: 8.2 },
    { id: 4, x: 1004, y: 128, R: 86, n: 80, droop: 16, width: 1.4, stops: WABI, delay: 11.4 },
  ].map((b) => ({ ...b, from: HORIZON - 6 }));

  let defs = "", sky = "", water = "";
  for (const b of bursts) {
    const r = burst(b, rand);
    defs += r.defs;
    sky += r.body;
    water += ripples(b, HORIZON, rand);
  }

  // 対岸の影。なだらかな土手と町の灯
  let bank = `M0 ${HORIZON + 2}L0 ${HORIZON - 6}`;
  let h = 6, px = 0, py = HORIZON - 6;
  for (let x = 40; x <= W + 40; x += 40) {
    h = Math.max(3, Math.min(11, h + (rand() - 0.5) * 5));
    const y = HORIZON - h;
    bank += `Q${px} ${f(py)} ${(px + x) / 2} ${f((py + y) / 2)}`;
    px = x; py = y;
  }
  bank += `L${W} ${HORIZON + 2}Z`;
  let lights = "";
  for (let i = 0; i < 14; i++) {
    const x = f(30 + rand() * 560 + (rand() < 0.3 ? 560 : 0));
    lights += `<circle cx="${x}" cy="${f(HORIZON - 1 - rand() * 2)}" r="${f(0.6 + rand() * 0.5)}" fill="#ffd9a0" opacity="${f(0.3 + rand() * 0.45, 2)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(profile.name)} / ${esc(profile.handle)} — ${esc(profile.tagline)}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080b"/><stop offset="1" stop-color="#0e0f15"/></linearGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="10"/></clipPath>
${defs}
</defs>
<style>${burstCss(CYCLE)}</style>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${sky}
<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="#06070a"/>
${water}
<path d="${bank}" fill="#040406"/>
${lights}
${text(profile.handle, 72, 214, 21, { fill: DIM, spacing: 1.2 })}
${text(profile.name, 70, 292, 72, { weight: 600, spacing: 0.5 })}
${text(profile.tagline, 72, 346, 28, { fill: GOLD, spacing: 0.6 })}
${text(profile.stack.join("　"), 72, 466, 16, { fill: FAINT, spacing: 0.5 })}
</g>
</svg>
`;
}

// ---------------------------------------------------------------- 作品の行
function keysArt(accent) {
  // 12キー。ときどき2つのキーが入れ替わる（自分でキーを組む）
  const kana = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "小", "わ", "、"];
  const KW = 44, KH = 31, GAP = 5;
  const swap = { 1: "a", 2: "b", 6: "c", 9: "d" };
  let out = "";
  kana.forEach((ch, i) => {
    const c = i % 3, r = Math.floor(i / 3);
    const on = i === 4;
    const inner = `<rect width="${KW}" height="${KH}" rx="5" fill="${on ? accent : "#1b1c21"}"/>${text(ch, KW / 2, KH / 2 + 6, 16, { fill: on ? "#1a1206" : "#cfcbc2", anchor: "middle", weight: 600 })}`;
    out += `<g transform="translate(${c * (KW + GAP)} ${r * (KH + GAP)})">${swap[i] ? `<g class="k k${swap[i]}">${inner}</g>` : inner}</g>`;
  });
  const css = `
.k{animation:10s cubic-bezier(.5,0,.2,1) infinite}
.ka{animation-name:ka}.kb{animation-name:kb}.kc{animation-name:kc}.kd{animation-name:kd}
@keyframes ka{0%,18%,82%,100%{transform:none}26%,74%{transform:translateX(${KW + GAP}px)}}
@keyframes kb{0%,18%,82%,100%{transform:none}26%,74%{transform:translateX(-${KW + GAP}px)}}
@keyframes kc{0%,44%,100%{transform:none}52%,92%{transform:translateY(${KH + GAP}px)}}
@keyframes kd{0%,44%,100%{transform:none}52%,92%{transform:translateY(-${KH + GAP}px)}}
@media (prefers-reduced-motion:reduce){.k{animation:none}}`;
  return { css, defs: "", body: `<g transform="translate(1000 ${(170 - (4 * KH + 3 * GAP)) / 2})">${out}</g>` };
}

function sparkArt(seed) {
  const b = { id: 9, x: 1072, y: 80, R: 62, n: 60, droop: 10, width: 1.3, stops: WABI, delay: 0 };
  const r = burst(b, rng(seed));
  return { css: burstCss(LIFE + 1.4), defs: r.defs, body: r.body };
}

function row(w, index) {
  const W = 1200, H = 170;
  const a = w.art === "keys" ? keysArt(w.accent) : sparkArt(index + 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(w.title)} — ${esc(w.lines.join(""))}">
<defs><clipPath id="frame"><rect width="${W}" height="${H}" rx="10"/></clipPath>${a.defs}</defs>
<style>${a.css}</style>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${INK}"/>
${text(String(index + 1).padStart(2, "0"), 72, 68, 19, { fill: GOLD, spacing: 1 })}
${text(w.title, 150, 74, 46, { weight: 600, spacing: 0.4 })}
${text(w.lines.join(""), 151, 112, 20, { fill: DIM, spacing: 0.6 })}
${text(w.url, 151, 142, 16, { fill: FAINT, spacing: 0.5 })}
${a.body}
</g>
</svg>
`;
}

// ---------------------------------------------------------------- year
// ナイアガラ。張った綱から光の筋が落ちる。筋1本が1日で、長さがその日のコントリビューション数。
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function year(days) {
  const W = 1200, H = 380, X0 = 60, X1 = 1140, WATER = 304, MAXLEN = 206;
  const rand = rng(2026);
  const list = days ? days.slice(-366) : Array.from({ length: 366 }, () => null);
  const max = days ? Math.max(1, ...list.map((d) => d.count)) : 1;
  const total = days ? list.reduce((s, d) => s + d.count, 0) : 0;
  const wireY = (x) => 62 + 13 * (1 - ((x - W / 2) / (W / 2)) ** 2);
  const step = (X1 - X0) / (list.length - 1);

  const groups = Array.from({ length: 6 }, () => "");
  let sparks = "", labels = "";
  list.forEach((d, i) => {
    const x = X0 + step * i, y = wireY(x);
    if (d && d.date.endsWith("-01")) labels += text(MONTHS[Number(d.date.slice(5, 7)) - 1], x, 38, 15, { fill: FAINT, spacing: 0.6 });
    const count = d ? d.count : 0;
    if (count === 0) {
      groups[i % 6] += `<circle cx="${f(x)}" cy="${f(y + 2)}" r=".9" fill="#f0a63c" opacity=".45"/>`;
      return;
    }
    const len = 10 + MAXLEN * Math.sqrt(count / max);
    groups[i % 6] += `<rect x="${f(x - 0.8)}" y="${f(y)}" width="1.6" height="${f(len)}" rx=".8"/>`;
    if (rand() < 0.3) {
      const dur = f(1.1 + rand() * 1.5, 2);
      sparks += `<circle class="dr" cx="${f(x)}" cy="${f(y)}" r="1" style="--l:${f(len * 1.08)}px;animation-duration:${dur}s;animation-delay:-${f(rand() * dur, 2)}s"/>`;
    }
  });
  const falls = groups
    .map((g, i) => `<g class="fl" style="animation-duration:${f(1.3 + i * 0.23, 2)}s;animation-delay:-${f(rand() * 2, 2)}s">${g}</g>`)
    .join("");

  const stats = days
    ? `${text(total.toLocaleString("en-US"), 60, 352, 40, { weight: 600 })}${text("contributions in the last 12 months", 60 + total.toLocaleString("en-US").length * 22 + 14, 352, 18, { fill: DIM, spacing: 0.4 })}`
    : text("contributions in the last 12 months", 60, 352, 18, { fill: DIM, spacing: 0.4 });

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${days ? `${total} contributions in the last 12 months` : "Contributions in the last 12 months"}">
<defs>
<linearGradient id="strand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset=".3" stop-color="#f8c56c"/><stop offset=".75" stop-color="#e8842c" stop-opacity=".7"/><stop offset="1" stop-color="#c2410c" stop-opacity="0"/></linearGradient>
<radialGradient id="haze"><stop offset="0" stop-color="#f0a63c" stop-opacity=".13"/><stop offset="1" stop-color="#f0a63c" stop-opacity="0"/></radialGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="10"/></clipPath>
<clipPath id="below"><rect y="${WATER}" width="${W}" height="${H - WATER}"/></clipPath>
</defs>
<style>
.fl{animation:fl 1.6s ease-in-out infinite alternate}
.dr{fill:#fff6dc;animation:dr 2s cubic-bezier(.5,0,.9,.6) infinite}
@keyframes fl{from{opacity:.62}to{opacity:1}}
@keyframes dr{0%{transform:translateY(0);opacity:0}8%{opacity:1}100%{transform:translateY(var(--l));opacity:0}}
@media (prefers-reduced-motion:reduce){.fl,.dr{animation:none}.dr{opacity:0}}
</style>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${INK}"/>
<ellipse cx="${W / 2}" cy="150" rx="640" ry="170" fill="url(#haze)"/>
<path d="M0 ${f(wireY(0))}Q${W / 2} ${f(wireY(W / 2) * 2 - wireY(0))} ${W} ${f(wireY(W))}" fill="none" stroke="#3a3b42" stroke-width="1"/>
${labels}
<g id="falls" fill="url(#strand)">${falls}</g>
${sparks}
<rect y="${WATER}" width="${W}" height="${H - WATER}" fill="#06070a"/>
<g clip-path="url(#below)" opacity=".16"><use href="#falls" xlink:href="#falls" transform="translate(0 ${WATER * 2}) scale(1 -1)"/></g>
${stats}
${text("one strand, one day", W - 60, 352, 16, { fill: FAINT, spacing: 0.5, anchor: "end" })}
</g>
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
profile.works.forEach((w, i) => write(`work-${w.id}.svg`, row(w, i)));

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (process.argv.includes("--sample")) write("year.svg", year(sampleDays()));
else if (process.argv.includes("--empty")) write("year.svg", year(null));
else if (token) write("year.svg", year(await fetchDays(token)));
else console.log("GH_TOKEN がないので year.svg は作り直していません");
