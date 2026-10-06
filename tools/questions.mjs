// G2: the question set from release-2026-09.json. A head to head question contains " vs " or
// " versus " between two vendor names; an alternatives question asks for alternatives to a named
// vendor ("alternatives to <X>"). "Alternatives to a traditional CRM" names no vendor and is out.
import fs from 'node:fs';
const release = JSON.parse(fs.readFileSync('data/release-2026-09.json', 'utf8'));
const rows = [];
for (const c of release.categories) for (const q of c.questions) {
  const t = q.text;
  const hh = /\s(?:vs\.?|versus)\s/i.exec(t);
  const alt = /alternatives? to\s+(.+?)(?:\s+for\s|\s+now\s|\s*[,?]|$)/i.exec(t);
  if (hh) {
    const left = t.slice(0, hh.index).trim();
    const right = t.slice(hh.index + hh[0].length).split(/[,:?]|\s+for\s|\s+which\s/i)[0].trim();
    rows.push({ category: c.id, question_id: q.id, text: t, type: 'head_to_head', a: left, b: right, x: '', base: q.base, excluded_answers: q.excluded_answers });
  } else if (alt && !/^(?:a|an|the)\s/i.test(alt[1])) {
    rows.push({ category: c.id, question_id: q.id, text: t, type: 'alternatives', a: '', b: '', x: alt[1].trim(), base: q.base, excluded_answers: q.excluded_answers });
  }
}
const cell = v => '"' + String(v).replaceAll('"', '""') + '"';
const cols = ['category', 'question_id', 'text', 'type', 'a', 'b', 'x', 'base', 'excluded_answers'];
fs.writeFileSync('HEAD_TO_HEAD_QUESTIONS.csv', [cols.join(','), ...rows.map(r => cols.map(k => cell(r[k])).join(','))].join('\n') + '\n');
fs.writeFileSync('work_questions.json', JSON.stringify(rows, null, 1));
const by = {};
for (const c of release.categories) by[c.id] = { head_to_head: 0, alternatives: 0 };
for (const r of rows) by[r.category][r.type]++;
console.log(JSON.stringify(by));
console.log('head_to_head', rows.filter(r => r.type === 'head_to_head').length, 'alternatives', rows.filter(r => r.type === 'alternatives').length, 'answers in base', rows.reduce((s, r) => s + r.base, 0));
for (const r of rows) console.log(r.category, r.question_id, r.type, '|', r.a || r.x, '|', r.b);
