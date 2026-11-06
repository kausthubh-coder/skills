# Evidence behind the rules

Where each rule in SKILL.md comes from, so a rule can be judged, bent or changed on its merits. Researched 2026-10-14. Effect sizes are from the cited meta-analyses; Mayer's are from his own lab and run larger than independent replications.

## Seeing and reading

| Finding | Rule it supports | Source |
|---|---|---|
| A fixation takes in about 3–4 characters left and 14–15 right; words are identified over 7–8 letters | Front-load the first words | Rayner 1998/2009, pmc.ncbi.nlm.nih.gov/articles/PMC3723350 |
| Scanning a list, readers see about the first 2 words (11 characters) of each item | Front-load headings, rows, list items | NN/g, nngroup.com/articles/first-2-words-a-signal-for-scanning |
| The F-pattern is what happens when nothing guides the eye; "layer cake" (read headings, dive under one) is the effective pattern | Headings that state findings | NN/g 2017, nngroup.com/articles/f-shaped-pattern-reading-web-content |
| Silent non-fiction reading averages about 238 wpm | 350-word visible budget | Brysbaert 2019 |
| Users have time to read at most about 28% of a page's words (dwell time, an upper bound) | Fold everything not needed | Nielsen 2008, nngroup.com/articles/how-little-do-users-read |
| Concise text +58%, scannable +47%, objective +27% measured usability (one 1997 study; later work agrees) | Short, scannable, no promotional tone | Morkes & Nielsen 1997 |
| Reading speed falls below a critical print size of about 0.2° x-height; comprehension kept improving up to about 18pt in a 104-person study | Body 16–18px; nothing tiny | Legge & Bigelow 2011; Rello et al., CHI 2016 |
| Dark-on-light beat light-on-dark for acuity and proofreading, more so at small sizes. The astigmatism explanation is weakly supported | Follow the OS scheme, design both well | Piepenbrock et al. 2013; nngroup.com/articles/dark-mode |
| WCAG 4.5:1 compensates for about 20/40 acuity | Muted text also ≥ 4.5:1 | W3C Understanding 1.4.3 |
| About 95–100 characters per line read fastest with no comprehension loss; readers prefer about 55. "45–75" is a comfort figure | 60–75 characters; avoid extremes | Dyson 2004; Shaikh & Chaparro |
| Comprehension on screens is lower than on paper (g = −0.21), worse under time pressure, with more overconfidence | Answer where the skim lands | Delgado et al. 2018 |
| Sentences of 14 words average over 90% understood; 43 words under 10% | Sentences under 25 words | GOV.UK, insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit |

## Attention and memory

| Finding | Rule it supports | Source |
|---|---|---|
| Working memory holds about 4 chunks (3–5); Miller's 7 was partly rhetorical | Lead with 3–4 points | Cowan 2001 |
| Color, size, motion and orientation pop out preattentively; pop-out fails as distinct signals multiply; conjunctions need slow search | One accent, one meaning | Treisman & Gelade 1980; Healey; Haroz & Whitney 2012 |
| Enclosure (common region) overrides proximity and similarity | Space first, box only a real unit, no nesting | Palmer 1992 |
| Readers skip what looks like an ad, including boxed, colored callouts | No banner-styled callouts | NN/g banner blindness |
| People miss large changes across an interruption | State changes in words ("was X, now Y") | Rensink et al. 1997 |
| Readers follow "information scent" from headings and link text | Specific headings; no "Overview" | Pirolli & Card 1999 |

## Learning (Mayer's principles and after)

| Finding | Effect | Source |
|---|---|---|
| Coherence: cutting extraneous material helps; seductive details hurt transfer, more under time limits | d ≈ 0.86; g ≈ −0.3 to −0.8 | Mayer; Rey 2012 |
| Signaling: headings and cues help | d ≈ 0.41 | Schneider et al. 2018 |
| Spatial contiguity: labels beside the thing | d ≈ 0.8, mostly for complex material | Ginns 2006 |
| Expertise reversal: help for novices burdens experts | | Kalyuga et al. 2003 |
| Retrieval practice beats restudying | g ≈ 0.5–0.6 | Rowland 2014; Adesope et al. 2017 |
| Predicting before seeing the answer helps, through surprise when wrong | reliable for the asked material | Pan & Carpenter 2023; Brod et al. |
| Concrete first, then abstract | moderate | Fyfe et al. 2014 |
| Animation helps only for things that actually move; decorative motion is a seductive detail | d ≈ 0.37 overall | Höffler & Leutner 2007 |

## Numbers and trust

| Finding | Rule it supports | Source |
|---|---|---|
| Accuracy ranks position > length > angle > area > color | Bars and sorted columns, no pies | Cleveland & McGill 1984; Heer & Bostock 2010 |
| Tables beat charts for exact lookups; charts for trends | Pick the form from the task | Vessey 1991 |
| "Design look" came up in 46% of credibility comments; appeal judged in 50 ms holds up | The look matters for trust | Fogg 2003; Lindgaard 2006 |
| Concrete statements are judged more likely true; needless long words lower judged intelligence | Real numbers, names, dates; plain words | Hansen & Wänke 2010; Oppenheimer 2006 |

## Myths not to repeat

"Goldfish attention span", "65% are visual learners" (learning styles don't help), "visuals are processed 60,000× faster", "people always read in an F", "people read 20%" as a measured rate.

## Writing practice

- Bottom line first at every level: BLUF; Minto's pyramid; GOV.UK content design.
- Bullets drop causes ("effects without causes, actions without actors"): Tufte, *The Cognitive Style of PowerPoint*; Amazon's narrative memos.
- Goals and non-goals, alternatives considered: Google design docs (industrialempathy.com/posts/design-docs-at-google).
- Claims earn credibility locally with specific evidence: Tufte; Distill's integrity standard (distill.pub/journal).
- "If we can't explain an idea well, that's often a sign we don't understand it": Distill, Research Debt.
- Move between the concrete case and the abstraction: Bret Victor, *Up and Down the Ladder of Abstraction*.
- Confusing-explanation patterns (starting abstract, no examples, made-up examples, too many concepts at once): Julia Evans, jvns.ca/blog/confusing-explanations.

## Other skills this borrowed from

- Anthropic `frontend-design`: the dated list of where generated design clusters (the two "tasteful" palettes, tracked caps eyebrows, the hero number row).
- Anthropic's artifact design guidance: "one detail only this subject would have"; draw the mechanism; draw the difference between options; complete at rest.
- Claude's visualize prompt: count the nouns before drawing; a dense diagram that needs "see details" is too dense.
- Thariq Shihipar, *The Unreasonable Effectiveness of HTML*: plans led by the decisions the reader is most likely to change; a quiz before merging.
- nicobailon/visual-explainer: claims as sentences that can be false, each tagged with its evidence; the plan becomes the receipt.
- pbakaus/impeccable: machine-checkable slop rules (side-tab borders, em-dash overuse, kicker above heading, content hidden at rest); "could this be any other product's page?"
- leonxlnx/taste-skill: every "use this instead" list becomes the next tell, so prescribe procedures, not a look; passing a lint doesn't make a page good.
- Critly: the taste pass (squint, count boxes and edges, one focal point), color roles, type scale, `critly check`.
