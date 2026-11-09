# tutor changelog

Sessions record the version they ran under (`tutor:` in each `tutor/sessions/*.md` header in the study repo, from 2.0 on). Before 2.0, match a session to a version by date. Git tags `tutor-v<version>` in this repo mark each release.

## 3.1 (2026-11-08)

Messages as pages, at his request ("the whole message is just an inline html page, so it gets ordered and structured better"). `tutor/kit/messages.md` in the study repo distills clear-output and Critly into a short guide (order: grade, what he got right, the one idea, where he is, his turn last; words; look), and `tutor/kit/message.html` is the page to copy. Status prints the guide; the anchor names it and reprints it every 6 answers.

## 3.0 (2026-11-08)

Rebuilt around `philosophy.md` in the study repo (the goal, the four moves, four principles), after 370.events took 14 answers and he "didn't understand very much". Fable and Astra advised; he chose Fable's design. The skill's Teach section is gone: `philosophy.md` holds how to teach, and status prints it. New context: a card per topic (`tutor.mjs topic <id>`): big picture, ideas with their why, what the exam asks, traps, links; a map, not a ladder. New record: `log` takes `hint` (nudge, gave-away) and marks "?" answers unsure; only clean passes count. Drift in long sessions: `log` prints an anchor after every answer, flags two not-clean answers in a row ("something has to change; you decide what"), and reprints the philosophy every 6 answers. `today.md` removed.

## 2.5 (2026-11-02)

2.4's "explain each idea fully in one message" was read as "the whole topic in one message": the red-black opener put properties, put, both cases, a worked example and a check on one page. Replaced with the goal behind 2.3 and 2.4, momentum: neither thin pieces nor a wall; one step at a time, each complete enough to act on, practiced before the next.

## 2.4 (2026-11-02)

2.3 dropped checking: "ask when my answer would change what you teach next" let a tutor teach a whole unit without once checking I understood. Now: one whole idea per message, then check it before building on it.

## 2.3 (2026-11-02)

"Every message ends on something only I can answer" (from 1.8) was meant to stop the tutor from explaining a little, asking "got it?" and making me wait for the next piece. It was read as "every message needs a question", so on (2,4) trees, a new topic, lessons got shorter and I was asked to do operations before I understood them. Replaced with the intent: teach the whole idea in one message, ask when my answer would change what comes next.

## 2.2 (2026-11-02)

Pages I work in. 2.0 had cut 1.9's "make it interactive" down to "use inline HTML", and even 1.9 only meant steppers, because nothing typed in a T3 page reached the tutor. A test showed a page rendered in a T3 thread can POST to 127.0.0.1. Added `tutor.mjs serve` (serves `tutor/kit/`, takes answers into a local inbox) and `inbox`, and the kit: a tree I build, edit and pick from, a frame stepper, a Send button that falls back to paste text.

## 2.1 (2026-11-02)

From a cold first-turn test of 2.0: the one-writer check is asked inside the first question, so a thread switch costs no extra turn. "Answers I gave" means logged answers, not notes. `tutor.mjs`: `status` prints the open session's last line in full; `evidence` files a line under the topic of the question ids it mentions.

## 2.0 (2026-11-02)

Rewrite after an audit of all 24 study threads on the laptop (Oct 28 to Nov 2). The 1.x rules grew from 49 to 68 lines, one patch per complaint. Most complaints came from missing data (what I'd been shown, the real time, which session was open) or clumsy writes, not from teaching judgment.
- Teaching is now six principles; the model decides how.
- `tutor/tutor.mjs` in the study repo does the data and writes: `status` replaces 4 to 8 start-up reads, and `start/ask/log/note/stop/save` stamp the real time, keep the ledger format and commit and push.
- Per-incident rules (new keys per example, grade on its own line, no countdowns, draw first, no "say when you're done", reading order around renders) moved to `tutor/preferences.md` in the study repo as my preferences. Corrections now go there as data instead of into this skill.
- Dropped: the fixed session shape (50 minutes, 3 to 6 steps, plan line on every message), the parked-questions list, "no new teaching" on practice days, the html_render layout rules.
- Kept as hard limits: main checkout only, one writer, `reserved/` closed until its day, state only from my answers.

## 1.x (2026-10-27 to 2026-11-02)

| Version | Commit | Change |
|---|---|---|
| 1.0 | a9d7eca | First version: sessions from files, one move per turn, ledger |
| 1.1 | 7426b9a | Grade on its own line, broad to specific, draw inline |
| 1.2 | 15fd277 | Save after every answer, never tutor from a worktree |
| 1.3 | fa735ea | Check what an opener leans on, one idea per message |
| 1.4 | c00aee0 | Ask before grading an unclear answer, say what was right first |
| 1.5 | df21568 | No countdowns, check only what was taught, define words, draw first |
| 1.6 | bf814ca | Text and pictures in reading order |
| 1.7 | 64157ec | Text between pictures goes inside the page |
| 1.8 | 6bd782c | End each message on a question, never wait for "done" |
| 1.9 | 0d917fd | Teach-back (Feynman) check |
