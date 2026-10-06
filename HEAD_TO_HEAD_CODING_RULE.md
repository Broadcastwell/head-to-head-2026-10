# Head to Head coding rule

Version 1.0, 6 October 2026. Applied to every scored answer to a head to head question ("A vs B") and an alternatives question ("alternatives to X") in the September 2026 Absence Index deposit (DOI 10.5281/zenodo.22907695). Each answer is read twice, in two separate passes; disagreements between the passes are resolved by a third read and logged in coding/disagreements.tsv.

## The rule as published (block 12)

An answer declares a winner when its own recommendation sentence names one of the two vendors as the better choice for the question as asked. "Depends" with no pick is coded depends; a pick for each of two buyer types is coded both; a refusal or an answer naming neither is coded neither. The first-named vendor is the first of the two to appear in the text. Cited domains are classed as A's own site, B's own site, a third-party page, or none. Every answer was read twice; disagreements between the two reads were resolved by a third read and logged.

## How the rule is applied

Head to head verdict (A, B, both, depends, neither):
1. A or B: the answer's own recommendation for the buyer in the question as asked names one vendor as the better choice, including "usually", "generally", "almost always", "my default" or "lean" wording, even when it adds an exception ("unless", "only if").
2. both: the answer assigns each vendor to a different buyer type or situation ("choose A if ..., choose B if ...", or a "best for" line per vendor) and gives no default for the buyer in the question.
3. A default overrides a split: where an answer splits by buyer type but states a default pick for the buyer in the question as asked, the default is the verdict.
4. depends: the answer says the choice depends, or compares the two, without assigning either vendor to any buyer type and without a pick.
5. neither: a refusal, an error or limit message returned as the answer, or an answer that recommends a third product instead of A or B.

First-named vendor: the first of A or B (by name or a published Index alias) to appear in the answer text; computed by the script and checked in reading.

Cited domain classes: each cited address is classed by its host: A's own site (the Index record's canonical domain or a subdomain of it), B's own site, a third-party page, or none when the answer cites nothing. Computed by the script.

Alternatives answers:
- First-named alternative: the first vendor the answer offers as an alternative to X, X itself excluded.
- Named list in order: every vendor the answer offers as an alternative, in order of first appearance, X excluded; a vendor mentioned only in passing (not offered) is left out.
- X named: whether the answer names X itself anywhere.

Base: only scored answers, using the deposit's exclusion records (the deposit flags excluded answers; they are counted out of every base). Repeats of one question are correlated, so intervals are reported per answer and their true width is larger than shown.

Precedents fixed while coding (pass 1):
- "A is usually the better value (or 'for most' buyers); B is worth it only if ..." is coded A: a general default with an exception (rule 1).
- "If you are X choose A; if you are Y choose B", with no general default, is coded both, even when one branch says "only" (rule 2).
- A strengths-only split ("A is better for operations, B for sales tools") with no buyer type or default is coded depends (rule 4).
- A limit or error message returned in place of an answer is coded neither (rule 5) and noted; the deposit scored it.
- A trophy, winner badge or "overall winner" in the answer's own bottom line counts as a pick (rule 1); a per-factor winner table alone does not (rule 4).
- An answer cut off mid-sentence in the deposit is coded from the text present and noted as truncated.

Readers: pass 1 and pass 2 were made by separate reader instances working from the same rule and this precedent list, each blind to the other's codes (coding/READER_BRIEF.md); the run lead made every third read.

Precedent fixed at the third read (applied to every disagreement and, as a consistency read, to every agreed A or B code whose deciding sentence carries a condition):
- A conditional pick is a split, not a default. "A is usually the better choice if your priority is X", "A is the safer default if you need X", or "for [a narrower buyer than the question names], A", set against B for another condition, is coded both (rule 2). A pick is a default (rule 1) only when it holds for the buyer as asked with no further condition the question does not state: "for most [buyers as asked], A", "my default is A", "lean A unless Y", "A; B only if Y". A condition that only restates the question's own buyer ("for a small brokerage" when the question asks about a small broker) is not a further condition.
- A "better for [a dimension]" sentence ("A is better for hospital system management, B for reading speed") followed by a question back to the buyer about which matters more is a strengths split (rule 4, depends).
