# Universal One Quantum commands

On Quantum Atlas, Universal One accepts typed questions, reviewed dictation and live voice commands. The existing Quantum form owns the research session, request identifier, saved study and progress polling.

Examples:

- “Draft a question about OXTR occupancy and the saved controls.”
- “Run the question in the Quantum form.”
- “What is the progress of my study?”
- “Show my results.”

General research discussion goes to the existing research assistant. A bounded Astra Low command interpreter selects an action; it does not perform the scientific study. A run uses the existing Astra Max / Gemini High service and its current budgets. New paid quantum and GPU submissions remain disabled. A repeated run command reuses the active study, and a repeated identical completed question opens the existing result. Drafting only fills the form. Interrupting voice stops the conversational response; a submitted durable study keeps its existing state.

The original spoken transcript is preserved for action interpretation. A voice model's rewritten research query cannot independently authorize a study. Results and progress use authenticated reads of the current browser's study. The public MCP and A2A interfaces retain their existing scope.

First page entry leaves focus in the document. Keyboard menu entry, arrow navigation and Escape restoration retain visible focus. WebKit checks disable all playback; Chromium voice checks require process-level `--mute-audio` and synthetic microphone input.

Local checks: command validation and incomplete responses; transcribed voice handoff and duplicate tool calls; one form submission across repeated commands; saved status and results; draft-only behavior; ordinary research fallback; Chromium/WebKit initial focus and keyboard menus at desktop and mobile widths. Live staging checks and their provider receipts are recorded separately.

Staging verification passed on 9 November 2026. Typed commands retrieved saved progress and findings, drafted without submitting, and reused a completed study. Synthetic dictation and live voice both retrieved saved-study progress through OpenAI and the authenticated study service. One new OXTR study launched through the text conversation completed with Astra Max and Gemini High design/final approvals, using 23,571 Astra tokens and 238,840 Gemini micro-USD. The report appeared in the interface; JSON matched the delivered report and all 4,642 CSV fields were equivalent. No new paid quantum or GPU job was submitted.

The final deployment covers all eleven chapter entry pages so direct and in-site navigation load the same conversation scripts. Thirty-one changed assets matched staging. Twelve Chromium/WebKit desktop/mobile focus checks passed; WebKit playback was disabled and Chromium audio was disabled at process launch. Production remains unchanged.
