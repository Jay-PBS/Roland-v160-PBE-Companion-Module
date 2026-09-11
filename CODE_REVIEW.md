# Code review — Roland v160 : Purple Badger Edition

Review of the 1.0.0 TypeScript conversion, carried out 2026-09-11 with no V-160HD
available. Findings are kept here with their evidence and outcome rather than
deleted once actioned, so the same ground is not re-explored later.

**Method.** The conversion was first confirmed to derive from the *current*
upstream JavaScript: the fork base `8023bea` is a real upstream commit and all
nine JS source files there are byte-identical to upstream `HEAD`; upstream has
only Dependabot commits since. Every finding below was then checked against that
JavaScript to establish whether it was **inherited** or **introduced** — which
decides whether fixing it is safe without hardware.

**Constraint.** Wire-neutral: no command byte may change. Verified by executing
all 76 action callbacks against a recording stub before and after and comparing
emitted bytes.

---

## 0. Status

| # | Finding | Severity | Origin | Outcome |
|---|---------|----------|--------|---------|
| P1 | No receive buffering; prompt and banner matched by exact equality on a whole chunk | Critical | Inherited | **Fixed** 1.1.0 |
| P2 | Password re-sent on every prompt → switcher lockout | Critical | Inherited | **Fixed** 1.1.0 |
| P3 | Tally Program button dark when source on PGM+PVW | High | Inherited | **Fixed** 1.1.0 |
| P4 | Feedbacks/variables recomputed per TCP segment | High | Inherited | **Fixed** 1.1.0 |
| P5 | 271 requests/cycle, 240 of them static; 100 ms floor | High | Inherited | **Fixed** 1.1.0 (traffic change) |
| P6 | `lastmemorynumber` zero-based | Medium | Introduced | **Fixed** 1.1.0 |
| P7 | No watchdog; silent link death reads `Ok` forever | High | Inherited | **Fixed** 1.1.0 |
| P8 | `ERR:4`/`ERR:5` silently swallowed | Medium | Inherited | **Fixed** 1.1.0 |
| P9 | Passcode in the plaintext config store | Medium | Inherited | **Fixed** 1.1.0 |
| P10 | Connection state not reset on drop | Medium | Inherited | **Fixed** 1.1.0 |
| P11 | 14 variables render blank before first poll | Low | Introduced | **Fixed** 1.1.0 |
| P12 | Unrecognised PnP/Key source keeps the stale name | Low | Introduced | **Fixed** 1.1.0 |
| H1 | USB output assign writes `000110`, poll reads `000010` | Unknown | Inherited | **Parked** — needs hardware |
| H2 | Tally map covers 42 channels; spec suggests 52 | Unknown | Inherited | **Parked** — needs hardware |
| H3 | `pnpkey_hueWidth` sends raw decimal unlike its siblings | Unknown | Inherited | **Parked** — carried from 1.0.0 |
| D1 | Tally variables collapse status 3 to `Program` | Low | Inherited | **Won't change** — value domain compatibility |

---

## 1. What was already correct

Recording this so it is not re-audited. The mechanical wiring of the 1.0.0
conversion is sound:

- 76/76 actions are referenced by a preset; 11/11 feedbacks are referenced by a
  preset; no preset references an action or feedback that does not exist, in
  either direction.
- Every feedback dropdown default is a valid member of its own `choices` list.
  The original module had several defaults that were not (`pnpKeySource.pinp`
  defaulted to `'1B'` against `'pnpkey1'…` choices; the aux feedbacks defaulted to
  `'11'`), and those really were fixed in 1.0.0 with upgrade scripts.
- 106/106 variables are both declared and set.
- `pressTimers` is correctly tracked and cleared (`actions.ts:1054-1058`,
  `api.ts` teardown) — the original leaked these.
- `calculateBytes` and all command framing — including the doubled trailing
  newline on set commands, the unterminated `VER`, and raw-decimal MSB/LSB pairs —
  are byte-identical to the original.
- `checkAllFeedbacks()` is a genuine `@companion-module/base` 2.x method, not a
  typo for `checkFeedbacks`.
- `tsc` and `eslint` were clean before this review and are clean after. Neither
  catches any finding below, which is the point of the review.

---

## 2. Fixed

### P1 — No receive buffering · `api.ts` (was `:56-58`, `:179-236`)

`socket.on('data')` passed each TCP chunk straight to the parser. TCP is a
stream, and the old poll cycle issued 271 requests, so replies are split and
coalesced as a matter of course. Reproduced against the 1.0.0 build:

| Traffic shape | 1.0.0 result |
|---|---|
| `DTH:001B` + `00,01;` | state unchanged — frame silently lost |
| `Enter password: DTH:001B00,01;` | password **never sent**, status never set |
| `Welcome to V-160HD.\nVER:…;` | **never reached `Ok`**, never started polling |

The second and third are the serious ones: the prompt and banner were compared
with `===` against the whole trimmed chunk, so a single coalesced segment leaves
the module stuck on "Authenticating", or connected but never polling, forever.

Fixed with a receive buffer. Unterminated text is matched against the raw buffer
and excised where it sits (so a frame arriving before *or* after it survives);
complete frames are then split on `;` or newline; leading punctuation left behind
by an excised marker is stripped, since every frame begins with a letter. Past
8 KB with no complete frame the buffer is discarded with a warning rather than
sliced through a value.

### P2 — Password replayed on every prompt · `api.ts`

No "already sent" guard existed. A wrong passcode therefore produced a
prompt/answer loop, and the switcher locks out after repeated attempts and then
rejects even the correct password — so the failure mode is not "login fails" but
"login fails and keeps failing after you fix it". Now sent once, with a second
prompt reported as a rejection and `Wait a moment` / `Authentication error`
handled distinctly. `authFailed` latches and survives teardown so the watchdog
cannot retry into a lockout; `configUpdated` clears it, because editing the
config is an explicit correction.

### P3 — Tally Program feedback · `feedbacks.ts`

Status `3` means "on PGM and PVW at once" but satisfied only `state: 'both'`,
while every Program tally preset is built with `state: 'program'`
(`presets.ts:134`). The button therefore went dark exactly when its input was on
programme. `variables.ts` already treated `1 || 3` as `Program`, so the variable
and the button contradicted each other. Inherited verbatim from
`feedbacks.js:35-45`.

### P4 — Feedback fan-out · `api.ts`

`checkAllFeedbacks()` and `updateVariableValues()` ran on every `data` event, and
`handleReport` additionally wrote a variable for each of the 240 memory-name
characters. Now debounced 40 ms into a single pass, and the per-character write is
gone — the debounced pass publishes the reassembled name.

### P5 — Polling load · `api.ts`, `config.ts`, `constants.ts`

See the changelog for the figures. Note the verification: the new per-cycle set is
the old set **minus exactly the 240 memory-name requests, in the same order**,
checked by comparison rather than asserted. This is the only change in 1.1.0 that
alters what reaches the switcher over time, and the only one a hardware test
could contradict.

### P6-P12

Covered in the changelog. P6 and P11-P12 were introduced by the conversion
rather than inherited; the rest are the original's.

---

## 3. Parked — needs hardware

### H1 — USB output assign address

`constants.ts` gives USB Output the id `000110`, which the action writes to, while
`api.ts` polls `000010` for the same state. Both inherited. The original's
feedback compared against `000010` while its dropdown emitted `000110`, so USB
output feedback never matched in the original at all; 1.0.0 papered over that by
mapping both keys in the feedback callback, which is why the feedback now works
and the discrepancy stayed hidden. One of the two addresses is wrong and only the
device can say which. **Do not guess** — writing to the wrong address could
reassign an output mid-programme.

Test: set USB output to a known bus from the module, then read it back both with
`RQH:000010,000001;` and `RQH:000110,000001;` under verbose logging.

### H2 — Tally channel coverage

`TALLY_INPUTS` (`constants.ts:23-28`) maps 42 channels: HDMI 1-8, SDI 1-8,
STILL 1-16, XPT 1-10. Roland's *LAN/RS-232 Basic Control Commands* document lists
52 tally channels for the V-160HD (HDMI 1-8, SDI 1-8, STILL 1-16, INPUT 1-20).

**That document is not evidence for this module.** It describes the ASCII
`PGM:`/`TLY:`-style *Basic Control Commands* protocol; this module speaks the
SysEx-address `DTH:`/`RQH:` protocol, and the two are unrelated. The channel
count and ordering of the `0C0000` bulk tally push have to be measured, not
inferred. The parser already adapts to the payload length, so extra channels are
stored in state — they simply have no `TALLY_INPUTS` entry, so no variable or
feedback surfaces them.

Test: with verbose logging on, note the payload length of a `DTH:0C0000,…` push.
42 channels is 84 hex characters. If it is longer, extend the map — and note that
renaming the existing `xpt` short labels would break `$(…:tally_xpt1)` references,
so extend rather than rename.

### H3 — `pnpkey_hueWidth` encoding

Carried from the 1.0.0 review: sends a raw decimal, possibly negative, where every
sibling parameter uses the 14-bit two-byte encoding. Preserved unchanged.

---

## 4. Deliberately not changed

### D1 — Tally variables collapse status 3 to `Program`

`variables.ts` reports `Program` for status 1 *or* 3, matching
`variables.js:76-80` exactly. Now that the feedback treats 3 as both Program and
Preview, the variable is arguably imprecise — but it is not wrong (the input *is*
on programme), and changing the value domain would silently break any user
expression comparing against `"Program"`. Documented in `companion/HELP.md`
instead.

---

## 5. Hardware checklist

In risk order. A1 is a gate: if it fails, nothing else is testable.

| # | Test | Watch for |
|---|------|-----------|
| A1 | Connect with the correct passcode | Reaches `Ok`, logs `Authenticated.`, polling starts |
| A2 | Connect with a **wrong** passcode | `Password rejected`, and the passcode is sent **once** — not a loop |
| A3 | Fix the passcode in the config and save | Reconnects and authenticates; the lockout latch clears |
| B1 | Pull the network cable while connected | Status leaves `Ok` within ~4 s and recovers when replugged |
| B2 | Leave connected and idle for 10 minutes | Stays `Ok`; no spurious reconnects from the watchdog |
| B3 | Run with polling at 200 ms for 10 minutes | Panel stays responsive; no lockup (this is the P5 risk) |
| C1 | Put one input on PGM and PVW at once | **Both** the Program and Preview tally buttons light (P3) |
| C2 | Rename a memory on the panel, wait ~60 cycles | `memoryname_N` updates (P5 refresh cadence) |
| C3 | Load a memory from the panel | `lastmemorynumber` matches the panel's number, 1-30 (P6) |
| D1 | Count the `DTH:0C0000` payload length under verbose | Settles H2 |
| D2 | Set USB output assign, read back both addresses | Settles H1 |
| D3 | Exercise every PinP/DSK parameter | Settles H3 and confirms the 14-bit encodings |

Record results as `P` / `F` / `-` not tested / `NA` / `B` blocked. A wrong value
is worth more than a bare `F` — write down what it actually did.
