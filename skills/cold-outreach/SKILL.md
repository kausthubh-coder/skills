---
name: cold-outreach
description: Write my cold emails and DMs to people I don't know yet (founders, builders, investors, anyone I want advice from or to work with). Use when I ask you to reach out to someone, draft an email or DM to a person, or work on my outreach list in ~/dev/outreach.
---

# Cold outreach

Short, personal messages to one person at a time, written the way I'd write them. The model is the email Ty Chen sent at 16 that got him a 30-minute call with a founder he'd never met:

> **Subject:** Hi I'm A 16 Year Old HK Young Man Trying To Seek Some Advice
>
> Hi William, I hope this email finds you well! My name is Ty, and I'm a 16-year-old from Hong Kong with a huge interest in entrepreneurship. I came across your incredible story about founding DealsDash at just 15. Two Words. Holy Cow! I'm always eager to learn, and I would love to chat with you about your journey and more about you. Sincerely, Ty

The same Ty sent a templated pitch to 128 billionaires and got zero replies. The difference: William was one step ahead of him, the message named one real thing William did, and it read like a 16-year-old wrote it.

## What a message looks like

- **Short.** 40 to 70 words. A DM can be 2 to 4 sentences. If it scrolls, cut it.
- **Who I am in one line**, naming real things I've made: "I'm Kausthubh, 19, and I've shipped four apps of my own (kausthubh.dev)", or for open-source people "I build open-source dev tools like Critly and Kriyan". Never "I build AI agents": I don't like it. Check kausthubh.dev for what's live now. Add my situation only when it's why I'm writing to them: I'm on an H-4 that ends when I turn 21 and I'm going for an O-1A.
- **One specific thing they did**, from their own post, video or site, said the way I'd say it to a friend ("That's honestly insane", "which is wild"). Never a generic compliment.
- **One ask.** A single question they can answer in a reply, or a 15-minute call. Not both, unless the question is the warm-up for the call.
- **Sounds like a 19-year-old.** Contractions, "Hey" on DMs, exclamation marks are fine. No "I hope this email finds you well" rewrites, no corporate words, no list of my projects, no paragraph about my plan. Run `unslop` on it.
- **Subject line** says who I am and what I want, plainly: "19 and trying to get an O-1 like you did".

For an advice email to a fellow or founder (Thiel, Z Fellows, Emergent Ventures and similar), start from my template in `~/dev/outreach/drafts/_template-advice.md`. It's longer, about 110 words, because the story is the point: 18 and in college, two projects plus kausthubh.dev, an immigrant on an H-4 who's lived here 12 years with almost none of the rights my friends have, college feels pointless and I want to go build, then "any advice, or open to a 15-minute chat?". Only the name and the line about them change.

Leave out: my university (never name NC State), the school email, attachments and videos, anything I haven't confirmed about them. If a fact about them is shaky (a name, a round, an age), drop it rather than guess.

## Pick the person and the channel

- Best fits are people one step ahead whose story matches mine: raised a pre-seed or did YC and then got an O-1, or got an O-1 young from open source. Same-school links and generic indie builders didn't work.
- Use the channel they're active on and invite: email if it's on their own site, otherwise X, Instagram or LinkedIn DM. LinkedIn connection notes max out at 300 characters.
- Never guess an email address. It has to come from their own page.

## Sending

I send everything myself; never send for me. Show each finished draft inline in the chat as plain text with the link to the person's profile, so I can copy it.

- Emails go from kausthubh2007@gmail.com. Two claude.ai Gmail connectors are attached: the one whose instructions say "Account label: personal" is that inbox; the other is my school account, never use it. Put the email in my personal inbox as a draft with that connector's `create_draft` and give me the draft link; I press Send. If only the school connector is there, give me a prefilled compose link instead: `https://mail.google.com/mail/?authuser=kausthubh2007@gmail.com&view=cm&fs=1&to=...&su=...&body=...`, URL-encoded.
- 3 to 5 messages a day, each one written for that person.
- One follow-up after about 5 days with no reply, one or two lines. Then stop.

## The list

`~/dev/outreach` holds everyone (see its `AGENTS.md`): `people/<slug>.json`, drafts in `drafts/<slug>.md`, and `python3 list.py` to print and update it. When I say I sent one, run `python3 list.py set <slug> status sent` and note the date and the follow-up date with `set <slug> notes`. Commit the change.
