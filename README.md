# Head to Head: who the engines pick when a buyer asks A or B. October 2026.

From the September 2026 Absence Index deposit (DOI [10.5281/zenodo.22907695](https://doi.org/10.5281/zenodo.22907695); verbatim answers from ChatGPT, Claude, Perplexity, Google AI Overviews and Google AI Mode, three repeats per question), we read every answer to a head to head question ("A vs B") and every answer to an alternatives question ("alternatives to X") across 14 categories. We report how often an answer declares a single winner, who wins, whether the five engines agree, whether the winner is the more-named vendor in the Index, and what the winning answers cite.

The full report, with every table: [HEAD_TO_HEAD_REPORT.pdf](HEAD_TO_HEAD_REPORT.pdf).

DOI of this release (v1.0): [10.5281/zenodo.23202939](https://doi.org/10.5281/zenodo.23202939).

## Findings (every number with its base)

- 75 of 359 scored head to head answers declared a single winner (20.9 percent, 95 percent interval 17.0 to 25.4). The most common verdict was both, a pick for each of two buyer types: 271 of 359.
- All five engines picked the same winner on 1 of 24 head to head questions (each engine's majority over three repeats).
- All three repeats of one question on one engine gave the same verdict on 89 of 119 question and engine pairs, and the same single winner on 13 of 119.
- Where both vendors carry an Index record with different named counts, the winner was the more-named vendor in 46 of 70 winning answers.
- Among answers with a winner, 45 of 75 cited the winner's own site, 31 of 75 the rival's own site and 63 of 75 a third-party page.
- Alternatives answers named the incumbent X beyond restating the question in 524 of 540; the most common first alternative of each question accounted for 384 of 540 answers.

| Engine | Declared a single winner | Rate |
|-|-|-|
| ChatGPT | 23 of 72 | 31.9 percent, 95 percent interval 22.3 to 43.4 |
| Claude | 15 of 72 | 20.8 percent, 95 percent interval 13.1 to 31.6 |
| Perplexity | 21 of 72 | 29.2 percent, 95 percent interval 19.9 to 40.5 |
| Google AI Overviews | 11 of 71 | 15.5 percent, 95 percent interval 8.9 to 25.7 |
| Google AI Mode | 5 of 72 | 6.9 percent, 95 percent interval 3.0 to 15.2 |

Repeats of one question are correlated, so true uncertainty is wider than the intervals shown.

## Question rule

From the deposit's release record: every target question whose text is an "A vs B" comparison (contains " vs " or " versus ") and every target question that asks for alternatives to a named vendor ("alternatives to X"). 24 head to head and 36 alternatives questions in 12 of the 14 categories (CRM and project management have neither kind). 900 answers, 899 scored after the deposit's exclusion records; every count is on scored answers only.

## Coding rule

An answer declares a winner when its own recommendation sentence names one of the two vendors as the better choice for the question as asked. "Depends" with no pick is coded depends; a pick for each of two buyer types is coded both; a refusal or an answer naming neither is coded neither. The first-named vendor is the first of the two to appear in the text. Cited domains are classed as A's own site, B's own site, a third-party page, or none. Every answer was read twice; disagreements between the two reads were resolved by a third read and logged.

How it was applied, with every precedent: [HEAD_TO_HEAD_CODING_RULE.md](HEAD_TO_HEAD_CODING_RULE.md). The reads were made by instances of one AI model (Claude), each pass blind to the other, under that rule and [coding/READER_BRIEF.md](coding/READER_BRIEF.md); they are not human coders, and agreement between passes is not evidence that people would code the same way. The head to head passes disagreed on 11 answers; 22 agreed codes changed at a consistency read under the third-read precedent; 23 alternatives entries went to a third read. Every change is in [coding/disagreements.tsv](coding/disagreements.tsv).

## What the study does not prove

The deposit records answers observed on 22 and 23 September 2026 under method v1.1. A verdict is the answer's wording on that date, not a judgment of product quality. Repeats of one question are correlated, so true uncertainty is wider than the interval shown. A vendor absent from a question's checked set was not measured.

## Dispute route

The Index's own policy: any named vendor may ask for one same-configuration re-run per release at no charge, and both results are published. Write to index@broadcastwell.com.

## Files

- `HEAD_TO_HEAD_QUESTIONS.csv`: the question set (category, question id, text, type, A, B or X, base, excluded answers).
- `HEAD_TO_HEAD_DATA.csv`: one row per answer: category, question id, type, engine, repeat, scored or excluded, A, B, X, verdict or first alternative, first-named vendor, named list in order, X named, cited domain classes, cited domains, cited URLs, capture date, and the pass 1 and pass 2 codes.
- `findings.json`: every number in the report.
- `coding/`: the reader brief, both passes (`hh_pass1*`, `hh_pass2*`, `alt_pass1*`, `alt_pass2*`), the consistency read and the third-read log.
- `tools/`: the scripts that list the questions, print answers for reading, build the data, compute the findings and print the report.

## Reproduce

Download `answers-2026-09.jsonl` and `release-2026-09.json` from https://zenodo.org/records/22907695 into `data/`, check them against the deposit's `SHA256SUMS.txt`, then run `node tools/questions.mjs`, `node tools/build.mjs` and `node tools/findings.mjs` (Node 22 or later). The deposit's files are not copied here.

## Cite

Broadcastwell (2026). Head to Head: who the engines pick when a buyer asks A or B. October 2026. Data derived from the Broadcastwell Absence Index, September 2026 (DOI 10.5281/zenodo.22907695).

## License

CC BY 4.0. See [LICENSE](LICENSE).
