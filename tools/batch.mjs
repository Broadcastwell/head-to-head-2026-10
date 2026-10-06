// Prints a batch of study answers for reading: node tools/batch.mjs <type> <from> <count>
// type is head_to_head or alternatives. Answers are ordered by category, question, engine, repeat.
// Links are shortened to their domain so the text reads as the buyer saw it; nothing else changes.
import fs from 'node:fs';
const [type, from = '0', count = '10'] = process.argv.slice(2);
const questions = JSON.parse(fs.readFileSync('work_questions.json', 'utf8')).filter(q => q.type === type);
const key = q => q.category + '|' + q.question_id;
const wanted = new Map(questions.map(q => [key(q), q]));
const engines = ['ChatGPT', 'Claude', 'Perplexity', 'Google AI Overviews', 'Google AI Mode'];
const rows = fs.readFileSync('data/answers-2026-09.jsonl', 'utf8').trim().split('\n').map(JSON.parse)
  .filter(r => wanted.has(r.category_id + '|' + r.question_id))
  .sort((a, b) => a.category_id.localeCompare(b.category_id) || Number(a.question_id.slice(1)) - Number(b.question_id.slice(1)) || engines.indexOf(a.engine) - engines.indexOf(b.engine) || a.repeat_index - b.repeat_index);
if (from === 'count') { console.log(rows.length, 'answers,', rows.filter(r => r.excluded).length, 'excluded'); process.exit(0); }
const shorten = t => t.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (m, label, url) => label + ' <' + new URL(url).hostname.replace(/^www\./, '') + '>').replace(/https?:\/\/\S+/g, u => { try { return '<' + new URL(u).hostname + '>'; } catch { return u; } });
for (const [i, r] of rows.slice(Number(from), Number(from) + Number(count)).entries()) {
  const q = wanted.get(r.category_id + '|' + r.question_id);
  const id = r.category_id + '|' + r.question_id + '|' + r.engine + '|' + r.repeat_index;
  console.log('=== #' + (Number(from) + i) + ' ' + id + (r.excluded ? ' EXCLUDED: ' + r.exclusion_reason : ''));
  console.log('Q: ' + q.text + (type === 'head_to_head' ? '  [A=' + q.a + ' B=' + q.b + ']' : '  [X=' + q.x + ']'));
  if (!r.excluded) console.log(shorten(r.answer_text).replace(/\n{2,}/g, '\n'));
  console.log('CITED: ' + (r.cited_urls || []).map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }).join(', '));
}
