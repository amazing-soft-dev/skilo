# Pass: score (site, once)

1. Read all `findings/*.md` (only now, all together).
2. Merge duplicates across passes (an empty band that is also a hierarchy problem is one finding with both categories), keep the highest severity.
3. Score the 14 categories in `rubric.md` with the lens weights from `findings/lens.md`. Look at the key screenshots again for the judgment categories (hierarchy, harmony, imagery, audience fit).
4. Compute the grade, then the projected grade after Blocker and High fixes.
5. Pick the top 5 changes by impact for the audience (not by count).

Write `findings/score.md` (category scores with one line of reasoning each, weights used, grade, projection, top 5). Mark done.
