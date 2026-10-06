// Computes every number in the report from work_records.json (written by tools/build.mjs).
// Every count carries its base; intervals are 95 percent Wilson intervals on the answer-level base.
import fs from 'node:fs';
const { hh, alt } = JSON.parse(fs.readFileSync('work_records.json', 'utf8'));
const ENGINES = ['ChatGPT', 'Claude', 'Perplexity', 'Google AI Overviews', 'Google AI Mode'];
const wilson = (k, n) => {
  if (!n) return [null, null];
  const z = 1.959964, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.round(1000 * (c - m) / d) / 10, Math.round(1000 * (c + m) / d) / 10];
};
const stat = (k, n) => ({ count: k, base: n, pct: n ? Math.round(1000 * k / n) / 10 : null, ci: wilson(k, n) });
const scoredH = hh.filter(r => !r.excluded), scoredX = alt.filter(r => !r.excluded);
const isWin = r => r.verdict === 'A' || r.verdict === 'B';
const out = {};

// Data and question set.
const cats = [...new Set([...hh, ...alt].map(r => r.category))].sort();
out.questionSet = cats.map(c => ({ category: c, head_to_head_questions: new Set(hh.filter(r => r.category === c).map(r => r.question_id)).size, alternatives_questions: new Set(alt.filter(r => r.category === c).map(r => r.question_id)).size, answers: hh.filter(r => r.category === c).length + alt.filter(r => r.category === c).length, scored: scoredH.filter(r => r.category === c).length + scoredX.filter(r => r.category === c).length }));
out.totals = { head_to_head_questions: new Set(hh.map(r => r.category + r.question_id)).size, alternatives_questions: new Set(alt.map(r => r.category + r.question_id)).size, head_to_head_answers: hh.length, head_to_head_scored: scoredH.length, alternatives_answers: alt.length, alternatives_scored: scoredX.length, capture_dates: [...new Set([...hh, ...alt].map(r => r.captured_on))].sort() };

// Verdict distribution and the winner rate.
const dist = rs => Object.fromEntries(['A', 'B', 'both', 'depends', 'neither'].map(v => [v, rs.filter(r => r.verdict === v).length]));
out.verdicts = { overall: dist(scoredH), byEngine: Object.fromEntries(ENGINES.map(e => [e, dist(scoredH.filter(r => r.engine === e))])) };
out.winnerRate = { overall: stat(scoredH.filter(isWin).length, scoredH.length), byEngine: Object.fromEntries(ENGINES.map(e => { const rs = scoredH.filter(r => r.engine === e); return [e, stat(rs.filter(isWin).length, rs.length)]; })) };
out.splitRate = stat(scoredH.filter(r => r.verdict === 'both').length, scoredH.length);

// Winner table by question.
const hq = [...new Set(hh.map(r => r.category + '|' + r.question_id))];
out.winnerTable = hq.map(k => {
  const rs = scoredH.filter(r => r.category + '|' + r.question_id === k), x = rs[0];
  const a = rs.filter(r => r.verdict === 'A').length, b = rs.filter(r => r.verdict === 'B').length;
  return { category: x.category, question_id: x.question_id, a: x.a, b: x.b, base: rs.length, A: a, B: b, both: rs.filter(r => r.verdict === 'both').length, depends: rs.filter(r => r.verdict === 'depends').length, neither: rs.filter(r => r.verdict === 'neither').length, leader: a > b ? x.a : b > a ? x.b : (a ? 'tie' : 'no winner declared'), a_index: x.a_rec.count, b_index: x.b_rec.count, index_base: x.a_rec.base, both_measured: x.a_rec.measured && x.b_rec.measured };
});

// Agreement across repeats (same code in all three repeats of one question on one engine) and across engines.
const cells = [];
for (const k of hq) for (const e of ENGINES) { const rs = scoredH.filter(r => r.category + '|' + r.question_id === k && r.engine === e); if (rs.length === 3) cells.push(rs); }
out.repeatAgreement = { sameVerdict: stat(cells.filter(rs => rs.every(r => r.verdict === rs[0].verdict)).length, cells.length), sameWinner: stat(cells.filter(rs => isWin(rs[0]) && rs.every(r => r.verdict === rs[0].verdict)).length, cells.length), cellsWithThreeScored: cells.length };
const majority = rs => { const c = {}; for (const r of rs) c[r.verdict] = (c[r.verdict] || 0) + 1; const top = Object.entries(c).sort((x, y) => y[1] - x[1]); return top.length > 1 && top[0][1] === top[1][1] ? 'split' : top[0][0]; };
const perQ = hq.map(k => ({ k, m: ENGINES.map(e => majority(scoredH.filter(r => r.category + '|' + r.question_id === k && r.engine === e))) }));
out.engineAgreement = { allFiveSameWinner: stat(perQ.filter(q => (q.m[0] === 'A' || q.m[0] === 'B') && q.m.every(v => v === q.m[0])).length, perQ.length), allFiveSameVerdict: stat(perQ.filter(q => q.m.every(v => v === q.m[0])).length, perQ.length), anyEngineMajorityWinner: stat(perQ.filter(q => q.m.some(v => v === 'A' || v === 'B')).length, perQ.length), conflicting: stat(perQ.filter(q => q.m.includes('A') && q.m.includes('B')).length, perQ.length), majorities: Object.fromEntries(perQ.map(q => [q.k, q.m])) };

// Winner against the Index named count (only where both vendors carry an Index record).
const winners = scoredH.filter(isWin);
const measured = winners.filter(r => r.a_rec.measured && r.b_rec.measured && r.a_rec.count !== r.b_rec.count);
const higher = r => (r.a_rec.count > r.b_rec.count ? 'A' : 'B');
out.winnerVsIndex = { winnerIsMoreNamed: stat(measured.filter(r => r.verdict === higher(r)).length, measured.length), excludedNotMeasured: winners.filter(r => !(r.a_rec.measured && r.b_rec.measured)).length, excludedTied: winners.filter(r => r.a_rec.measured && r.b_rec.measured && r.a_rec.count === r.b_rec.count).length };

// First-named vendor.
out.firstNamed = { aFirst: stat(scoredH.filter(r => r.first_named === 'A').length, scoredH.length), winnerIsFirstNamed: stat(winners.filter(r => r.verdict === r.first_named).length, winners.length), winnerIsA: stat(winners.filter(r => r.verdict === 'A').length, winners.length) };

// What answers cite, winners first.
const citeClasses = rs => {
  const has = c => rs.filter(r => r.classes.includes(c)).length;
  return { base: rs.length, winnerOwn: stat(rs.filter(r => r.classes.includes(r.verdict + '_own')).length, rs.length), rivalOwn: stat(rs.filter(r => r.classes.includes((r.verdict === 'A' ? 'B' : 'A') + '_own')).length, rs.length), thirdParty: stat(has('third_party'), rs.length), none: stat(rs.filter(r => !r.classes.length).length, rs.length), citations: rs.reduce((s, r) => s + r.classes.length, 0), citationsByClass: { winner_own: rs.reduce((s, r) => s + r.classes.filter(c => c === r.verdict + '_own').length, 0), rival_own: rs.reduce((s, r) => s + r.classes.filter(c => c === (r.verdict === 'A' ? 'B' : 'A') + '_own').length, 0), third_party: rs.reduce((s, r) => s + r.classes.filter(c => c === 'third_party').length, 0) } };
};
out.winnerCites = citeClasses(winners);
out.winnerCitesByEngine = Object.fromEntries(ENGINES.map(e => [e, citeClasses(winners.filter(r => r.engine === e))]));
const third = new Map();
for (const r of winners) for (const h of new Set(r.hosts.filter((h, i) => r.classes[i] === 'third_party'))) third.set(h, (third.get(h) || 0) + 1);
out.topThirdParty = [...third].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 10).map(([domain, answers]) => ({ domain, answers, base: winners.length }));
const allCite = { anyOwnSite: stat(scoredH.filter(r => r.classes.some(c => c !== 'third_party')).length, scoredH.length), none: stat(scoredH.filter(r => !r.classes.length).length, scoredH.length) };
out.allHeadToHeadCites = allCite;

// Alternatives.
const xq = [...new Set(alt.map(r => r.category + '|' + r.question_id))];
out.alternatives = xq.map(k => {
  const rs = scoredX.filter(r => r.category + '|' + r.question_id === k), x = rs[0];
  const c = new Map(); for (const r of rs) c.set(r.first, (c.get(r.first) || 0) + 1);
  const top = [...c].sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0]));
  const anywhere = new Map(); for (const r of rs) for (const v of r.list) anywhere.set(v, (anywhere.get(v) || 0) + 1);
  const topAny = [...anywhere].sort((p, q) => q[1] - p[1] || p[0].localeCompare(q[0]));
  return { category: x.category, question_id: x.question_id, x: x.x, base: rs.length, firstAlternative: top[0][0], firstCount: top[0][1], runnerUp: top[1] ? top[1][0] + ' (' + top[1][1] + ')' : '', distinctFirsts: c.size, xNamed: rs.filter(r => r.x_named === 'yes').length, mostOffered: topAny[0][0], mostOfferedCount: topAny[0][1], meanListLength: Math.round(10 * rs.reduce((s, r) => s + r.list.length, 0) / rs.length) / 10 };
});
out.altTotals = { xNamed: stat(scoredX.filter(r => r.x_named === 'yes').length, scoredX.length), xNamedByEngine: Object.fromEntries(ENGINES.map(e => { const rs = scoredX.filter(r => r.engine === e); return [e, stat(rs.filter(r => r.x_named === 'yes').length, rs.length)]; })), sameFirstAllFifteen: out.alternatives.filter(q => q.firstCount === q.base).length, questions: xq.length, modalFirstShare: stat(out.alternatives.reduce((s, q) => s + q.firstCount, 0), scoredX.length) };

// Reading record.
const log = fs.readFileSync('coding/disagreements.tsv', 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split('\t'));
out.reading = { headToHeadDisagreements: log.filter(l => l[0] === 'head_to_head').length, headToHeadConsistencyChanges: log.filter(l => l[0] === 'head_to_head_consistency').length, alternativesThirdReads: log.filter(l => l[0] === 'alternatives').length };
fs.writeFileSync('findings.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ totals: out.totals, verdicts: out.verdicts.overall, winnerRate: out.winnerRate, repeat: out.repeatAgreement, engines: { ...out.engineAgreement, majorities: undefined }, vsIndex: out.winnerVsIndex, firstNamed: out.firstNamed, cites: out.winnerCites, top: out.topThirdParty, alt: out.altTotals, reading: out.reading }, null, 1));
