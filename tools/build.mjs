// Builds HEAD_TO_HEAD_DATA.csv and findings.json from the deposit, the two reading passes and the
// third reads logged in coding/disagreements.tsv. Run from the study folder: node tools/build.mjs
import fs from 'node:fs';

const ENGINES = ['ChatGPT', 'Claude', 'Perplexity', 'Google AI Overviews', 'Google AI Mode'];
const release = JSON.parse(fs.readFileSync('data/release-2026-09.json', 'utf8'));
const questions = JSON.parse(fs.readFileSync('work_questions.json', 'utf8'));
const answers = fs.readFileSync('data/answers-2026-09.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
const qkey = (c, q) => c + '|' + q;
const qmap = new Map(questions.map(q => [qkey(q.category, q.question_id), q]));

// Same order as tools/batch.mjs, so reader numbers line up.
const ordered = type => answers.filter(r => qmap.get(qkey(r.category_id, r.question_id))?.type === type)
  .sort((a, b) => a.category_id.localeCompare(b.category_id) || Number(a.question_id.slice(1)) - Number(b.question_id.slice(1)) || ENGINES.indexOf(a.engine) - ENGINES.indexOf(b.engine) || a.repeat_index - b.repeat_index);
const H = ordered('head_to_head'), X = ordered('alternatives');

// Index records for the compared vendors; names the Index does not carry get their own site by hand.
const OFF_INDEX = { 'e-Builder': { domain: 'e-builder.net', names: ['e-Builder', 'eBuilder', 'Trimble Unity Construct'] }, 'Truckbase': { domain: 'truckbase.com', names: ['Truckbase'] }, 'Azibo': { domain: 'azibo.com', names: ['Azibo'] } };
const INDEX_NAME = { 'Visage': 'Visage Imaging', 'Philips IntelliSpace PACS': 'Philips (HealthSuite Imaging)', 'McLeod': 'McLeod Software', 'IDEXX Cornerstone': 'IDEXX (Cornerstone, Neo)', 'Cornerstone': 'IDEXX (Cornerstone, Neo)', 'Sectra': 'Sectra' };
function vendor(category, name) {
  const cat = release.categories.find(c => c.id === category);
  const want = (INDEX_NAME[name] || name).toLowerCase();
  const v = cat.vendors.find(v => v.name.toLowerCase() === want || (v.aliases || []).some(a => a.toLowerCase() === want))
    || cat.vendors.find(v => v.name.toLowerCase().startsWith(want));
  if (v) return { name: v.name, domain: v.canonical_domain, count: v.mention_rate?.count ?? null, base: v.mention_rate?.base ?? null, names: [name, v.name.replace(/\s*\(.*\)$/, ''), ...(v.aliases || [])], measured: true };
  const o = OFF_INDEX[name];
  if (!o) throw new Error('no vendor record for ' + name + ' in ' + category);
  return { name, domain: o.domain, count: null, base: null, names: o.names, measured: false };
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function firstIndex(text, names) {
  let best = -1;
  for (const n of names) {
    if (!n || n.length < 3) continue;
    const m = new RegExp('(^|[^A-Za-z0-9])' + esc(n) + '(?![A-Za-z0-9])', n.length < 4 || n === n.toUpperCase() ? '' : 'i').exec(text);
    if (m && (best < 0 || m.index < best)) best = m.index;
  }
  return best;
}
const host = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };
const owns = (h, d) => !!h && !!d && (h === d || h.endsWith('.' + d));

// Passes and third reads.
function loadPass(prefix) {
  const map = new Map();
  for (const f of fs.readdirSync('coding').filter(f => f.startsWith(prefix) && f.endsWith('.tsv')))
    for (const line of fs.readFileSync('coding/' + f, 'utf8').split(/\r?\n/).filter(Boolean)) map.set(Number(line.split('\t')[0]), line.split('\t'));
  return map;
}
const third = fs.readFileSync('coding/disagreements.tsv', 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split('\t'));
const hhThird = new Map(third.filter(t => t[0].startsWith('head_to_head')).map(t => [Number(t[1]), t[4]]));
const hh1 = loadPass('hh_pass1'), hh2 = loadPass('hh_pass2');
const al1 = loadPass('alt_pass1'), al2 = loadPass('alt_pass2');

// Vendor names as written by the readers, folded to one name per product (spelling, suffixes, owner prefixes).
const CANON = [
  [/^agency revolution/i, 'Agency Revolution'], [/^agencybloc/i, 'AgencyBloc'], [/^agfa/i, 'Agfa HealthCare Enterprise Imaging'], [/^agilysys/i, 'Agilysys'],
  [/^aloan/i, 'Aloan'], [/^appfolio/i, 'AppFolio'], [/^arive$/i, 'ARIVE'], [/^autodesk/i, 'Autodesk Construction Cloud'], [/^(covetrus )?avimark$/i, 'AVImark'],
  [/^baker hill/i, 'Baker Hill'], [/^blue sage/i, 'Blue Sage'], [/^blue yonder/i, 'Blue Yonder'], [/^bluebeam/i, 'Bluebeam'], [/^bntouch/i, 'BNTouch'],
  [/^calyx/i, 'Calyx'], [/^cdk/i, 'CDK Global'], [/^clio/i, 'Clio'], [/^(idexx )?cornerstone/i, 'IDEXX Cornerstone'], [/^dat (load board|one|broker tms)$/i, 'DAT'],
  [/^dealersocket$/i, 'DealerSocket'], [/^dealertrack/i, 'Dealertrack'], [/^descartes/i, 'Descartes'], [/^3gtms$/i, 'Descartes'], [/^dominion/i, 'Dominion'], [/^e2open/i, 'e2open'],
  [/^encompass/i, 'Encompass'], [/^ice mortgage technology$/i, 'Encompass'], [/^ezlynx/i, 'EZLynx'], [/^finastra/i, 'Finastra'], [/^frazer/i, 'Frazer'], [/^fujifilm/i, 'Fujifilm Synapse'],
  [/^ge (healthcare )?(centricity|true)/i, 'GE HealthCare'], [/^ge healthcare$/i, 'GE HealthCare'], [/^hubspot/i, 'HubSpot'], [/^impromed$/i, 'Impromed'], [/^infios/i, 'Infios'],
  [/^instinct/i, 'Instinct'], [/^intelerad/i, 'Intelerad'], [/^jack henry/i, 'Jack Henry'], [/^jenesis/i, 'Jenesis Software'], [/^konica minolta/i, 'Konica Minolta Exa'],
  [/^kuebix/i, 'Kuebix'], [/^leap( legal)?$/i, 'LEAP'], [/^macaw/i, 'Macaw'], [/^maestro/i, 'Maestro'], [/^manhattan/i, 'Manhattan Associates'], [/^mcleod/i, 'McLeod Software'],
  [/^merge/i, 'Merge'], [/^meridianlink/i, 'MeridianLink'], [/^(momentum|nowcerts)/i, 'NowCerts'], [/^moss/i, 'MOSS'], [/^ncino/i, 'nCino'], [/^(idexx )?neo( software)?$/i, 'IDEXX Neo'],
  [/^onepacs$/i, 'OnePACS'], [/^oracle (aconex|primavera|construction)/i, 'Oracle Aconex and Primavera'], [/^oracle (hospitality )?opera/i, 'Oracle OPERA Cloud'],
  [/^oracle (transportation|otm)/i, 'Oracle Transportation Management'], [/^oryx/i, 'Oryx'], [/^pbs/i, 'PBS Systems'], [/^pcs/i, 'PCS Software'], [/^philips intellispace/i, 'Philips IntelliSpace PACS'],
  [/^project44$/i, 'project44'], [/^provet/i, 'Provet Cloud'], [/^q2/i, 'Q2'], [/^ramsoft/i, 'RamSoft'], [/^redteam/i, 'RedTeam'], [/^reynolds/i, 'Reynolds and Reynolds'], [/^rms( cloud)?$/i, 'RMS Cloud'],
  [/^roommaster$/i, 'roommaster'], [/^salesforce/i, 'Salesforce'], [/^sap (tm|transport)/i, 'SAP Transportation Management'], [/^sectra/i, 'Sectra'], [/^shape/i, 'Shape'], [/^shepherd/i, 'Shepherd'],
  [/^shiji/i, 'Shiji Daylight'], [/^siemens/i, 'Siemens Healthineers'], [/^simpro$/i, 'Simpro'], [/^stayntouch/i, 'Stayntouch'], [/^tab32$/i, 'tab32'], [/^tai( software| tms)?$/i, 'Tai TMS'],
  [/^trimble (projectsight|connect|construction)/i, 'Trimble Construction'], [/^trimble (tms|transportation)/i, 'Trimble TMS'], [/^truckstop/i, 'Truckstop'], [/^uber freight/i, 'Uber Freight'],
  [/^vertafore ams360$/i, 'AMS360'], [/^vertafore qqcatalyst$/i, 'QQCatalyst'], [/^vertafore sagitta$/i, 'Sagitta'], [/^vetport$/i, 'VETport'], [/^vinsolutions/i, 'VinSolutions'],
  [/^visage/i, 'Visage Imaging'], [/^vtiger/i, 'Vtiger'],
];
function canon(name, category) {
  const n = name.trim().replace(/\s+/g, ' ');
  if (/^trimble$/i.test(n)) return category === 'transportation-management-systems' ? 'Trimble TMS' : 'Trimble Construction';
  for (const [re, to] of CANON) if (re.test(n)) return to;
  return n;
}
const X_SELF = { 'Opera PMS': 'Oracle OPERA Cloud', 'Sectra PACS': 'Sectra', 'IDEXX Cornerstone': 'IDEXX Cornerstone', 'Philips IntelliSpace PACS': 'Philips IntelliSpace PACS', 'McLeod': 'McLeod Software', 'CDK Global': 'CDK Global', 'Reynolds and Reynolds': 'Reynolds and Reynolds', 'Dealertrack DMS': 'Dealertrack', 'Maestro PMS': 'Maestro', 'Encompass': 'Encompass', 'MeridianLink': 'MeridianLink', 'nCino': 'nCino', 'Intelerad': 'Intelerad', 'AppFolio': 'AppFolio', 'Clio': 'Clio', 'EZLynx': 'EZLynx', 'Covetrus Pulse': 'Covetrus Pulse' };

// Alternatives third reads: which pass's list stands, or order by first appearance.
const ALT_USE_PASS2 = new Set([340, 378, 379, 380, 393, 458]);
const ALT_ORDER_BY_TEXT = new Set([93, 94, 95, 123, 124, 125, 208, 336, 337, 410]);
const X_NAMED_THIRD = new Map([[459, 'yes']]);

const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [];
const hhOut = [];
H.forEach((r, n) => {
  const q = qmap.get(qkey(r.category_id, r.question_id));
  const a = vendor(r.category_id, q.a), b = vendor(r.category_id, q.b);
  const p1 = hh1.get(n)[1].trim(), p2 = hh2.get(n)[1].trim();
  const verdict = hhThird.get(n) || (p1 === p2 ? p1 : null);
  if (!verdict) throw new Error('unresolved head to head ' + n);
  if ((verdict === 'excluded') !== !!r.excluded) throw new Error('exclusion mismatch at ' + n);
  const text = r.answer_text || '';
  const ia = firstIndex(text, a.names), ib = firstIndex(text, b.names);
  const firstNamed = ia < 0 && ib < 0 ? 'none' : ib < 0 || (ia >= 0 && ia < ib) ? 'A' : 'B';
  const hosts = (r.cited_urls || []).map(host).filter(Boolean);
  const classes = hosts.map(h => owns(h, a.domain) ? 'A_own' : owns(h, b.domain) ? 'B_own' : 'third_party');
  const rec = { n, category: r.category_id, question_id: r.question_id, type: 'head_to_head', engine: r.engine, repeat: r.repeat_index, excluded: !!r.excluded, exclusion_reason: r.exclusion_reason || '', a: q.a, b: q.b, verdict, pass1: p1, pass2: p2, first_named: firstNamed, hosts, classes, cited_urls: r.cited_urls || [], captured_on: r.captured_at.slice(0, 10), a_rec: a, b_rec: b };
  hhOut.push(rec);
  rows.push([r.category_id, r.question_id, 'head_to_head', r.engine, r.repeat_index, r.excluded ? 'excluded' : 'scored', q.a, q.b, '', verdict, firstNamed, '', '', [...new Set(classes)].join(';') || (r.excluded ? '' : 'none'), hosts.join(';'), (r.cited_urls || []).join(' '), rec.captured_on, p1, p2]);
});

const altOut = [];
X.forEach((r, n) => {
  const q = qmap.get(qkey(r.category_id, r.question_id));
  const l1 = al1.get(n), l2 = al2.get(n);
  const pick = ALT_USE_PASS2.has(n) ? l2 : l1;
  const self = X_SELF[q.x] || q.x;
  let list = [];
  for (const v of pick[2].split(';').map(s => s.trim()).filter(s => s && s !== 'none')) { const c = canon(v, r.category_id); if (c !== self && !list.includes(c)) list.push(c); }
  const text = r.answer_text || '';
  if (ALT_ORDER_BY_TEXT.has(n)) {
    const written = new Map();
    for (const l of [l1, l2]) for (const v of l[2].split(';').map(s => s.trim()).filter(Boolean)) { const c = canon(v, r.category_id); if (!written.has(c)) written.set(c, []); written.get(c).push(v); }
    const pos = c => { const i = firstIndex(text, [c, ...(written.get(c) || [])]); return i < 0 ? Infinity : i; };
    list = list.map((c, i) => [c, pos(c), i]).sort((x, y) => x[1] - y[1] || x[2] - y[2]).map(x => x[0]);
  }
  const f1 = canon(l1[1], r.category_id), f2 = canon(l2[1], r.category_id);
  const first = ALT_USE_PASS2.has(n) ? f2 : f1;
  const x1 = l1[3].trim(), x2 = l2[3].trim();
  const xNamed = X_NAMED_THIRD.get(n) || (x1 === x2 ? x1 : null);
  if (!xNamed) throw new Error('unresolved x_named ' + n);
  if (f1 !== f2 && !ALT_USE_PASS2.has(n)) throw new Error('unresolved first alternative ' + n + ': ' + f1 + ' / ' + f2);
  const hosts = (r.cited_urls || []).map(host).filter(Boolean);
  const rec = { n, category: r.category_id, question_id: r.question_id, engine: r.engine, repeat: r.repeat_index, excluded: !!r.excluded, x: q.x, first, list, x_named: xNamed, hosts, captured_on: r.captured_at.slice(0, 10) };
  altOut.push(rec);
  rows.push([r.category_id, r.question_id, 'alternatives', r.engine, r.repeat_index, r.excluded ? 'excluded' : 'scored', '', '', q.x, first, '', list.join(';'), xNamed, '', hosts.join(';'), (r.cited_urls || []).join(' '), rec.captured_on, l1[1], l2[1]]);
});

const header = ['category', 'question_id', 'type', 'engine', 'repeat', 'status', 'a', 'b', 'x', 'verdict_or_first_alternative', 'first_named_vendor', 'named_list_in_order', 'x_named', 'cited_domain_classes', 'cited_domains', 'cited_urls', 'capture_date', 'pass1', 'pass2'];
fs.writeFileSync('HEAD_TO_HEAD_DATA.csv', [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n') + '\n');
fs.writeFileSync('work_records.json', JSON.stringify({ hh: hhOut, alt: altOut }, null, 1));
console.log('rows', rows.length, 'head_to_head', hhOut.length, 'alternatives', altOut.length);
