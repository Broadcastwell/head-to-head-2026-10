// Writes HEAD_TO_HEAD_REPORT.html and prints it to HEAD_TO_HEAD_REPORT.pdf through headless Chrome with a
// throwaway profile. Every number comes from findings.json. Usage: node tools/report.mjs [doi]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const f = JSON.parse(fs.readFileSync('findings.json', 'utf8'));
const doi = process.argv[2] || '';
const ENGINES = ['ChatGPT', 'Claude', 'Perplexity', 'Google AI Overviews', 'Google AI Mode'];
const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pc = s => s.pct == null ? 'n/a' : s.pct.toFixed(1) + ' percent';
const st = s => `${s.count} of ${s.base} (${pc(s)}; 95 percent interval ${s.ci[0].toFixed(1)} to ${s.ci[1].toFixed(1)})`;
const short = s => `${s.count} of ${s.base}`;
const CAT = { 'construction-project-management': 'Construction project management', 'dealership-management-systems': 'Dealership management systems', 'dental-practice-management': 'Dental practice management', 'field-service-management': 'Field service management', 'hotel-property-management': 'Hotel property management', 'insurance-agency-management': 'Insurance agency management', 'legal-practice-management': 'Legal practice management', 'loan-origination-software': 'Loan origination software', 'radiology-medical-imaging': 'Radiology and medical imaging', 'residential-property-management': 'Residential property management', 'transportation-management-systems': 'Transportation management systems', 'veterinary-practice-management': 'Veterinary practice management' };
const t = f.totals, v = f.verdicts.overall;
const fontDir = 'C:/Users/saira/Documents/bw-client-data/.claude/worktrees/broadcastwell-what-ai-said-8dbfba/public/assets/fonts/';
const font = n => 'data:font/woff2;base64,' + fs.readFileSync(fontDir + n).toString('base64');

const winnerRows = f.winnerTable.map(r => `<tr><td>${e(CAT[r.category])}</td><td>${e(r.a)} vs ${e(r.b)}</td><td>${r.A}</td><td>${r.B}</td><td>${r.both}</td><td>${r.depends}</td><td>${r.neither}</td><td>${r.base}</td><td>${e(r.leader)}</td><td>${r.both_measured ? `${r.a_index} / ${r.b_index} of ${r.index_base}` : 'not both measured'}</td></tr>`).join('');
const engineRows = ENGINES.map(n => { const w = f.winnerRate.byEngine[n], d = f.verdicts.byEngine[n]; return `<tr><td>${n}</td><td>${st(w)}</td><td>${d.A + d.B}</td><td>${d.both}</td><td>${d.depends}</td><td>${d.neither}</td></tr>`; }).join('');
const citeRows = ENGINES.map(n => { const c = f.winnerCitesByEngine[n]; return `<tr><td>${n}</td><td>${c.base}</td><td>${short(c.winnerOwn)}</td><td>${short(c.rivalOwn)}</td><td>${short(c.thirdParty)}</td><td>${short(c.none)}</td></tr>`; }).join('');
const topRows = f.topThirdParty.map(r => `<tr><td>${e(r.domain)}</td><td>${r.answers} of ${r.base}</td></tr>`).join('');
const altRows = f.alternatives.map(r => `<tr><td>${e(CAT[r.category])}</td><td>${e(r.x)}</td><td>${e(r.firstAlternative)} (${r.firstCount} of ${r.base})</td><td>${e(r.runnerUp)}</td><td>${r.distinctFirsts}</td><td>${e(r.mostOffered)} (${r.mostOfferedCount} of ${r.base})</td><td>${r.xNamed} of ${r.base}</td></tr>`).join('');
const xRows = ENGINES.map(n => `<tr><td>${n}</td><td>${st(f.altTotals.xNamedByEngine[n])}</td></tr>`).join('');
const qsRows = f.questionSet.map(r => `<tr><td>${e(CAT[r.category])}</td><td>${r.head_to_head_questions}</td><td>${r.alternatives_questions}</td><td>${r.answers}</td><td>${r.scored}</td></tr>`).join('');
const ag = f.engineAgreement, ra = f.repeatAgreement, wi = f.winnerVsIndex, fn = f.firstNamed, wc = f.winnerCites, rd = f.reading;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Head to Head, October 2026</title><style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${font('inter-latin-var.woff2')}) format('woff2')}
@page{size:Letter;margin:16mm 15mm 18mm}
body{font-family:Inter,Arial,sans-serif;color:#172033;font-size:10pt;line-height:1.5;margin:0}
.cover{border-top:6px solid #3B82F6;padding-top:14px;margin-bottom:14px}
.cover p.brand{color:#1D4ED8;font-weight:700;margin:0 0 6px}
h1{font-size:19pt;color:#101828;margin:0 0 10px;line-height:1.25}
h2{font-size:13pt;color:#1D4ED8;border-top:2px solid #3B82F6;padding-top:8px;margin:20px 0 8px;break-after:avoid}
h3{font-size:11pt;margin:12px 0 6px;break-after:avoid}
.abstract{background:#EFF4FF;border-left:4px solid #3B82F6;padding:10px 12px;margin:10px 0}
.key{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.key div{border:1px solid #cdd8ea;border-radius:6px;padding:8px 10px;break-inside:avoid}
.key b{display:block;color:#1D4ED8;font-size:12pt}
table{border-collapse:collapse;width:100%;margin:8px 0 12px;font-size:8.5pt}
th,td{border:1px solid #cdd8ea;padding:4px 5px;text-align:left;vertical-align:top;overflow-wrap:break-word}
thead th{background:#EFF4FF}
tr{break-inside:avoid}
a{color:#1D4ED8}
.note{color:#475467;font-size:8.5pt}
.foot{margin-top:22px;color:#475467;font-size:8.5pt;border-top:1px solid #cdd8ea;padding-top:6px}
</style></head><body>
<div class="cover"><p class="brand">Broadcastwell Research</p>
<h1>Head to Head: who the engines pick when a buyer asks A or B. October 2026.</h1>
<p class="note">Data: the September 2026 Absence Index deposit, DOI <a href="https://doi.org/10.5281/zenodo.22907695">10.5281/zenodo.22907695</a>. The answers read here were captured on ${t.capture_dates.map(d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })).join(' and ')}. ${doi ? `This study: DOI <a href="https://doi.org/${e(doi)}">${e(doi)}</a>.` : 'This study: DOI assigned at release.'} License CC BY 4.0.</p></div>
<div class="abstract">From the September 2026 Absence Index deposit (DOI 10.5281/zenodo.22907695; verbatim answers from ChatGPT, Claude, Perplexity, Google AI Overviews and Google AI Mode, three repeats per question), we read every answer to a head to head question ("A vs B") and every answer to an alternatives question ("alternatives to X") across 14 categories. We report how often an answer declares a single winner, who wins, whether the five engines agree, whether the winner is the more-named vendor in the Index, and what the winning answers cite.</div>
<div class="key">
<div><b>${short(f.winnerRate.overall)}</b>head to head answers declared a single winner (${pc(f.winnerRate.overall)}).</div>
<div><b>${short(f.splitRate)}</b>gave each vendor to a different kind of buyer instead (${pc(f.splitRate)}).</div>
<div><b>${short(ag.allFiveSameWinner)}</b>head to head questions had all five engines pick the same winner.</div>
<div><b>${short(f.altTotals.xNamed)}</b>alternatives answers named the incumbent beyond restating the question.</div>
</div>

<h2>Data and question set</h2>
<p>The question rule: from the deposit's release record, every target question whose text is an "A vs B" comparison (it contains " vs " or " versus ") and every target question that asks for alternatives to a named vendor ("alternatives to X"). That gives ${t.head_to_head_questions} head to head questions and ${t.alternatives_questions} alternatives questions in 12 of the deposit's 14 categories; the two remaining categories (CRM and project management) have no question of either kind. Each question was asked of five engines three times, so ${t.head_to_head_answers} head to head answers and ${t.alternatives_answers} alternatives answers. The deposit's exclusion records leave ${t.head_to_head_scored} and ${t.alternatives_scored} scored answers; every count below is on scored answers only. The one excluded answer is a Google AI Overviews repeat where no overview was returned.</p>
<table><thead><tr><th>Category</th><th>Head to head questions</th><th>Alternatives questions</th><th>Answers</th><th>Scored</th></tr></thead><tbody>${qsRows}</tbody></table>

<h2>How the answers were read</h2>
<p>The coding rule: An answer declares a winner when its own recommendation sentence names one of the two vendors as the better choice for the question as asked. "Depends" with no pick is coded depends; a pick for each of two buyer types is coded both; a refusal or an answer naming neither is coded neither. The first-named vendor is the first of the two to appear in the text. Cited domains are classed as A's own site, B's own site, a third-party page, or none. Every answer was read twice; disagreements between the two reads were resolved by a third read and logged.</p>
<p>Two passes read every answer in full, each blind to the other. Both passes, the third reads and a consistency read were made by instances of the same AI model (Claude) working from one written rule and a precedent list, not by human coders, so agreement between the passes is not evidence that people would code the same way. The two head to head passes disagreed on ${rd.headToHeadDisagreements} of ${t.head_to_head_answers} answers; each was settled by a third read. One precedent was fixed at that read: a pick tied to a condition the question does not state ("A is usually better if your priority is X") is a split, coded both. Because the passes had read that wording both ways, every agreed A or B code whose deciding sentence carried a condition was read a third time under it, and ${rd.headToHeadConsistencyChanges} codes changed to both. The alternatives passes named the same set of vendors in most answers once spellings were folded together; ${rd.alternativesThirdReads} alternatives entries went to a third read. The first-named vendor and the cited domain classes are computed by script; vendor names follow the Index record and its published aliases. The full rule, the precedents, both passes and the third-read log are in the data files.</p>

<h2>The winner rate per engine and overall</h2>
<p>Overall, ${st(f.winnerRate.overall)} scored head to head answers named one vendor as the better choice for the buyer as asked. The most common verdict was both: ${short(f.splitRate)} answers gave each vendor to a different buyer or situation. Depends: ${v.depends}. Neither: ${v.neither} (a request-limit message returned as the answer).</p>
<table><thead><tr><th>Engine</th><th>Declared a single winner</th><th>A or B</th><th>Both</th><th>Depends</th><th>Neither</th></tr></thead><tbody>${engineRows}</tbody></table>
<p class="note">Base per engine: 72 scored answers (71 for Google AI Overviews). Repeats of one question are correlated, so true uncertainty is wider than the interval shown.</p>

<h2>The winner table by category</h2>
<p>Counts per question, out of its scored answers. Leader: the vendor named the winner more often (tie or no winner declared otherwise). Index named count: how many of the category's Index answers named each vendor in the September release (A / B, of the base shown).</p>
<table><thead><tr><th>Category</th><th>Question</th><th>A wins</th><th>B wins</th><th>Both</th><th>Depends</th><th>Neither</th><th>Base</th><th>Leader</th><th>Index named count</th></tr></thead><tbody>${winnerRows}</tbody></table>

<h2>Agreement</h2>
<p>Across repeats: on ${st(ra.sameVerdict)} question and engine pairs, all three repeats gave the same verdict; on ${short(ra.sameWinner)} pairs, all three named the same single winner (base: pairs with three scored repeats).</p>
<p>Across engines: taking each engine's majority verdict over its three repeats, all five engines picked the same winner on ${short(ag.allFiveSameWinner)} head to head questions, and gave the same verdict of any kind on ${short(ag.allFiveSameVerdict)}. At least one engine's majority named a single winner on ${short(ag.anyEngineMajorityWinner)} questions, and on ${short(ag.conflicting)} questions one engine's majority named A while another's named B.</p>

<h2>Winner against the Index named count</h2>
<p>Where an answer declared a winner and both vendors carry an Index record with different named counts, the winner was the vendor the Index found named more often in ${st(wi.winnerIsMoreNamed)} answers. ${wi.excludedNotMeasured} winning answers are left out because one vendor is outside the Index's checked set for that category (it was not measured), and ${wi.excludedTied} because the two counts are equal.</p>
<p>First-named vendor: the answer named the question's first vendor (A) before B in ${st(fn.aFirst)} scored answers. Among answers with a winner, the winner was the first-named vendor in ${short(fn.winnerIsFirstNamed)}, and the winner was A in ${short(fn.winnerIsA)}.</p>

<h2>What winning answers cite</h2>
<p>Among the ${wc.base} answers that declared a winner: ${short(wc.winnerOwn)} cited the winner's own site, ${short(wc.rivalOwn)} cited the rival's own site, ${short(wc.thirdParty)} cited at least one third-party page, and ${short(wc.none)} cited nothing. By citation: ${wc.citationsByClass.winner_own} links to the winner's site, ${wc.citationsByClass.rival_own} to the rival's, ${wc.citationsByClass.third_party} to third-party pages (${wc.citations} in all). Own site means the vendor's canonical domain in the Index record or a subdomain of it.</p>
<table><thead><tr><th>Engine</th><th>Winning answers</th><th>Cite winner's site</th><th>Cite rival's site</th><th>Cite a third party</th><th>Cite nothing</th></tr></thead><tbody>${citeRows}</tbody></table>
<h3>The ten most-cited third-party domains in winning answers</h3>
<table><thead><tr><th>Domain</th><th>Winning answers citing it</th></tr></thead><tbody>${topRows}</tbody></table>

<h2>Alternatives: first-named alternatives and incumbents</h2>
<p>For each "alternatives to X" question: the alternative named first most often, the runner-up, how many different vendors were named first, the vendor offered most often anywhere in the list, and how often X itself was named beyond a restatement of the question. Overall, the most common first alternative of its question accounted for ${short(f.altTotals.modalFirstShare)} scored answers; on ${f.altTotals.sameFirstAllFifteen} of ${f.altTotals.questions} questions every answer led with the same alternative.</p>
<table><thead><tr><th>Category</th><th>X</th><th>Named first most often</th><th>Runner-up</th><th>Different firsts</th><th>Offered most often</th><th>X named</th></tr></thead><tbody>${altRows}</tbody></table>
<table><thead><tr><th>Engine</th><th>Alternatives answers naming X beyond the question</th></tr></thead><tbody>${xRows}</tbody></table>

<h2>What the study does not prove</h2>
<p>The deposit records answers observed on 22 and 23 September 2026 under method v1.1. A verdict is the answer's wording on that date, not a judgment of product quality. Repeats of one question are correlated, so true uncertainty is wider than the interval shown. A vendor absent from a question's checked set was not measured.</p>
<p>The reads were made by AI model instances under a written rule, not by human coders; the rule, every code and every third read are published so anyone can re-read an answer and disagree. The questions are the Index's own wording, one or two per category, so they stand for those questions only, not for every way a buyer might ask.</p>

<h2>Dispute route</h2>
<p>The Index's own policy applies: any named vendor may ask for one same-configuration re-run per release at no charge, and both results are published. Write to index@broadcastwell.com.</p>

<h2>Files and DOI</h2>
<p>HEAD_TO_HEAD_QUESTIONS.csv (the question set), HEAD_TO_HEAD_DATA.csv (one row per answer: category, question, type, engine, repeat, scored or excluded, verdict or first alternative, first-named vendor, named list in order, X named, cited domain classes, cited domains and addresses, capture date, both passes), HEAD_TO_HEAD_CODING_RULE.md, the reader brief, both passes and the third-read log, under CC BY 4.0. ${doi ? `Repository release DOI: <a href="https://doi.org/${e(doi)}">${e(doi)}</a>.` : 'Repository release DOI: assigned at release.'} Source deposit: DOI 10.5281/zenodo.22907695.</p>
<p class="foot">Broadcastwell LLC, 517 E Kirkwood Ave, Bloomington, IN 47408. hello@broadcastwell.com. Cite as: Broadcastwell (2026). Head to Head: who the engines pick when a buyer asks A or B. October 2026.</p>
</body></html>`;
fs.writeFileSync('HEAD_TO_HEAD_REPORT.html', html);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bwh2h-'));
const src = path.join(tmp, 'report.html');
fs.writeFileSync(src, html);
execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(tmp, 'profile'), '--no-pdf-header-footer', '--print-to-pdf=' + path.resolve('HEAD_TO_HEAD_REPORT.pdf'), 'file:///' + src.replaceAll('\\', '/')], { stdio: 'ignore', timeout: 120000 });
console.log('HEAD_TO_HEAD_REPORT.pdf', fs.statSync('HEAD_TO_HEAD_REPORT.pdf').size);
