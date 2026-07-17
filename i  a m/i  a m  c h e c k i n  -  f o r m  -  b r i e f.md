# I Am Check-In — Interaction Specification v1

Implement the interaction flow for the existing I Am check-in component.

Do not redesign any visual elements.

Ben will attach seven reference images. These images define the exact visual treatment. This document defines the visible text, triggers, state order, and behaviour.

# Core Principle

Start with the least invasive interaction that can deliver meaningful value.

For this version, the first interaction is text.

Do not request camera access.

Do not request microphone access.

The user should feel they are completing a private sentence, not filling in a form.

# Fixed Form Language

The check-in is built around this sentence:

> I am...

The words **I am** are the core identity of the portal and should remain central to the interaction.

The user completes the sentence in their own words.

# State 1 — Idle

Visible text:

> I am...

Trigger:

Page load, or reset after the completed interaction.

Behaviour:

This is the default resting state of the check-in box.

The red circular button / dot gently pulses or breathes.

The user should understand that they can click or tap to begin.

No explanatory copy is required.

Do not auto-advance from this state.

# State 2 — Focus Prompt

Visible text:

> How are you feeling?

Trigger:

The user clicks or taps inside the check-in box.

Behaviour:

State 2 appears only after click / tap focus.

Do not trigger State 2 on hover.

Do not rotate State 2 with State 3.

Do not cycle through alternate prompts.

Use only this one prompt:

> How are you feeling?

The text may typewriter animate on screen.

State 2 remains visible until the first keystroke.

If the user clicks away or taps away without typing, gently fade back to State 1.

# State 3 — Typing

Visible text structure:

> I am [citizen response]

Trigger:

The user enters the first character.

Behaviour:

As soon as the first character is typed, the State 2 prompt disappears.

The input becomes active.

The fixed prefix remains:

> I am

The citizen types the completion of the sentence only.

Example:

If the citizen types:

> grateful

The full interpreted phrase is:

> I am grateful.

State 3 remains active until the user presses Return / Enter.

# State 4 — Confirmation

Visible text:

> ✓ Thank you.

Trigger:

The citizen presses Return / Enter after entering a valid response.

Behaviour:

The form accepts the response.

The check-in box transforms into the confirmation state.

This moment should feel warm and restrained.

No confetti.

No celebration animation.

Suggested duration:

Approximately 500–700 milliseconds.

# State 5 — Processing / Joining

Visible text:

> Joining the global check in...

Trigger:

Automatically follows State 4.

Behaviour:

This state communicates that the citizen's check-in is being received and gently integrated.

It should not feel like a generic loading state.

Do not use a spinner.

Do not use technical copy such as “processing request” or “submitting form”.

During this state, the globe may begin a subtle response animation:

- soft pulse
- gentle glow
- new node preparing to appear
- slight globe emphasis

This is also the state where the secure GPT inference request should be sent, if the GPT inference endpoint is active.

Suggested duration:

Approximately 1 second, or until the GPT response returns if inference is active.

# State 6 — Reflection / Hero Message

Visible text:

The citizen's completed phrase appears as large, elegant cinematic typography.

Example:

> I am grateful.

Trigger:

Automatically follows State 5 once the check-in has been accepted and, if active, the GPT inference response has returned.

Behaviour:

This is the emotional payoff of the interaction.

The user's sentence should appear as part of the visual world, not as a form result.

The message should fade in, hold briefly, then dissolve.

If the supplied reference artwork includes the Universal Mind flower beside the phrase, preserve that treatment.

Suggested duration:

Approximately 2 seconds.

# State 7 — Integration Into Globe

Visible text format:

A stylised globe node / lightbox using the citizen's check-in language.

Example:

> I am present

> Shanghai

Trigger:

Automatically follows State 6.

Behaviour:

The completed check-in visually integrates into the living globe as a glowing node, label, lightbox, or equivalent globe moment.

For this prototype, the integration may be stylised, anonymised or symbolic.

After the integration animation completes, return the check-in field to State 1.

# Full State Machine

State 1 — Idle

↓ Click / Tap

State 2 — How are you feeling?

↓ First Keystroke

State 3 — I am [response]

↓ Return / Enter

State 4 — ✓ Thank you.

↓ Automatic

State 5 — Joining the global check in...

↓ GPT Response / automatic continuation

State 6 — I am [completed phrase]

↓ Automatic

State 7 — Globe integration

↓ Automatic

State 1 — Idle / ready again

# Trigger Rules

## Do

- Use click / tap to activate State 2.
- Use first keystroke to activate State 3.
- Use Return / Enter to activate State 4.
- Run States 4 → 5 → 6 → 7 sequentially after submission.
- Return to State 1 if the user abandons the field before typing.
- Preserve the supplied visual artwork.

## Do Not

- Do not trigger State 2 on hover.
- Do not rotate State 2 and State 3.
- Do not cycle through multiple prompts.
- Do not make the field feel like a chatbot.
- Do not make it feel like a conventional web form.
- Do not request camera access.
- Do not request microphone access.
- Do not add new copy that is not specified here unless Ben asks.

# GPT Integration

The check-in form is the front-end entry point for GPT-powered interpretation.

Architecture:

**Citizen enters “I am...” → secure GPT inference → structured JSON → Citizen Needs / globe animation**

The form must be designed so that the submitted text can be passed to a secure GPT inference endpoint later on this week, in a future build phase.

The GPT model should later return exactly four relevant Citizen Needs highlights for the radar.

Do not use a local keyword dictionary as the core inference method.

Do not fake GPT inference.

If GPT is unavailable, show a graceful fallback or continue the visual integration without claiming inference.

# Privacy + Trust

This interaction must feel private first.

The user should not feel that their raw check-in is instantly being broadcast publicly.

The visual integration into the globe should feel symbolic unless explicit consent is added later.

The goal is:

> I am part of something larger.

not:

> My private words are now public.

# Red Button / Dot Behaviour

The red circular button / dot is part of the I Am interaction identity.

It may gently pulse in State 1 and State 2.

The pulse should feel like heartbeat, presence or readiness.

It should not flash aggressively.

It should not imply that camera or microphone recording has begun.

# Text Animation

Text may typewriter animate where appropriate, especially in State 2.

Use restraint.

The typewriter effect should feel cinematic and deliberate.

If it slows the interaction down or feels gimmicky, reduce it.

Clarity is more important than novelty.

# Visual Source Of Truth

Ben's seven supplied state images define:

- exact layout
- typography
- opacity
- spacing
- casing
- button treatment
- globe treatment
- flower treatment
- scale
- visual hierarchy

This written specification defines:

- visible copy
- trigger logic
- state order
- state behaviour
- privacy rules
- GPT relationship

Both the images and this document should be followed.

# Success Criteria

The user understands the interaction without instructions.

The interaction feels calm, private, cinematic, intuitive, emotionally safe, premium, and human.

The user journey should feel like:

They click.

They are gently asked how they are feeling.

They complete the sentence.

They press Return.

The system receives the check-in.

Their words become part of the living globe.

The interface returns to calm.