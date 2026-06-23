# Prompt Engineering Techniques — Full Reference

Detailed catalog backing the summary in SKILL.md. Consult before engineering any non-trivial prompt.

## Contents
1. General techniques (all current models)
2. Newest-model guidance (Claude Fable 5 / Mythos 5 / Opus 4.8 era)
3. Cross-vendor portability (GPT-5.x, Gemini)
4. Pitfalls to engineer OUT of prompts
5. Engineered-prompt skeleton

---

## 1. General techniques (all current models)

**Be clear and direct.** Treat the model like a brilliant new hire with no context. Golden rule: if a colleague with minimal context would be confused by the prompt, so will the model. Explicitly request "above and beyond" behavior rather than expecting it to be inferred.

**Give the reason.** Explaining *why* the user wants something helps the model generalize to the goal rather than pattern-matching the literal words.

**Examples (multishot).** 3–5 relevant, diverse, consistently formatted examples are one of the most reliable steering mechanisms. Wrap in `<example>` / `<examples>` tags. If the user hasn't supplied examples but format matters, insert labeled `[PLACEHOLDER: add 2–3 examples of X here]` slots.

**XML structure.** Claude is specifically trained on XML-style tags. Use descriptive, consistent names (`<instructions>`, `<context>`, `<input>`, `<constraints>`, `<output_format>`); nest hierarchically. One structural convention per prompt — don't mix Markdown-heading delimiting with XML delimiting for the same job.

**Role prompting.** A one-line persona in the system position sharpens tone, vocabulary, and domain accuracy. Don't over-elaborate the persona; one or two sentences is usually enough.

**Chain-of-thought / thinking.** For analytical tasks, instruct "think through the problem carefully before answering" or use `<thinking>` / `<answer>` separation on models without native extended thinking. Prefer general thinking instructions over prescriptive numbered reasoning steps on frontier models.

**Long context.** Put long documents at the TOP of the prompt, above instructions and the query — queries at the end can improve response quality substantially on multi-document inputs. Wrap each document:

```xml
<documents>
  <document>
    <source>filename or description</source>
    <document_content>...</document_content>
  </document>
</documents>
```

Ask the model to first extract relevant quotes, then answer grounded in those quotes.

**Output contract.** Specify format, structure, length, and constraints precisely; positive framing ("respond in flowing prose") beats negative ("don't use bullets"). Add a one-line success criterion: "A successful response is X."

## 2. Newest-model guidance (Claude Fable 5 / Mythos 5 / Opus 4.8 era)

- **Instruction-following is strong.** Short, high-level instructions work as well as exhaustive rule lists. Over-prompting ("CRITICAL: you MUST...") causes over-triggering and brittle behavior. Dial back aggressive language; state things once, plainly.
- **State boundaries explicitly.** Newest models can take initiative; define what the model should and should not do (e.g., "draft the email but do not send it").
- **Adaptive thinking via `effort`.** Manual `budget_tokens` is replaced by an `effort` parameter (`low`/`medium`/`high`/`xhigh`). If the engineered prompt is for API use, recommend `high` as default, `xhigh` for capability-critical work, `medium`/`low` for routine work.
- **Prefill is unsupported.** Prefilling assistant messages returns a 400 error on Claude Fable 5, Mythos 5, Opus 4.8/4.7/4.6, and Sonnet 4.6. Never engineer a prompt that depends on prefill; achieve format control via explicit output contracts and examples instead.
- **Never request chain-of-thought transcription.** Instructions like "show your full reasoning verbatim" can trigger a `reasoning_extraction` refusal on Fable 5. Instead: "explain the key decisions behind your answer."

## 3. Cross-vendor portability (GPT-5.x, Gemini)

All three vendors now recommend: clarity, explicit delimiters, few-shot examples, role assignment, explicit output contracts. XML-style tags work everywhere.

**GPT-5.x specifics:** put critical rules first in the prompt; specify execution order when actions have side effects; define what "done" looks like explicitly; reasoning-effort selection matters for agentic tasks.

**Gemini specifics:** terse by default — explicitly control verbosity; pick ONE delimiter convention per prompt; few-shot examples must share identical formatting or quality drops.

## 4. Pitfalls to engineer OUT of prompts

When rewriting a user's rough prompt, actively remove:

- Vague quality words with no operational meaning ("make it good", "be professional") → replace with concrete attributes.
- Negative-only instructions → reframe positively.
- Buried questions under long context → move query to the end.
- Mixed concerns in one blob → separate into tagged sections.
- "MUST/CRITICAL/NEVER" stacking → state once, calmly.
- Requests for verbatim hidden reasoning → ask for decision explanations.
- Prefill dependence → output contract + examples.
- Missing audience/length/format → add them (ask the user if genuinely ambiguous).

## 5. Engineered-prompt skeleton

A typical engineered prompt produced by this skill looks like:

```
[One-line role/persona.]

<context>
[Why this task exists; audience; what success looks like.]
</context>

<instructions>
[Clear, positive, high-level task statement. Boundaries: what to do / not do.]
[For complex tasks: "Think through the problem carefully before answering."]
</instructions>

<input>
[PLACEHOLDER: the user's actual input/data — or <documents> block at TOP if long]
</input>

<examples>
<example>...</example>
</examples>

<output_format>
[Exact structure, length, format. One-line success criterion.]
</output_format>
```

Adapt freely — not every prompt needs every section. A two-line task may only need role + instruction + output contract. Match the engineering effort to the task's complexity.
