# Testing queue — next access to hardware

Open test queue for the next session with a real V-160HD. Nothing in this module
has been verified against hardware yet, so this sheet is the whole validation
story, not a regression top-up.

**Before starting:** confirm the version string in Companion matches the build you
intend to test. Companion caches modules by version number, so installing a
rebuilt package with an unchanged version silently keeps the old code.

**Result codes:** `P` pass · `F` fail · `-` not tested · `NA` not applicable ·
`B` blocked. A wrong value is worth far more than a bare `F` — write down what it
actually did.

---

## A. Connection gate

If A1 fails, nothing else on this sheet is testable.

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| A1 | Connect with the correct passcode | Status reaches `Ok`; log shows `Authenticated.`; polling starts | | |
| A2 | Connect with a **wrong** passcode | Status `Password rejected`. Critically: the passcode is sent **once** — confirm in verbose log there is no prompt/answer loop | | |
| A3 | After A2, correct the passcode and save | Reconnects and authenticates; the failed-login latch clears | | |
| A4 | Connect with no passcode set on the switcher | Behaviour recorded (the module waits for a prompt and does not send unprompted) | | |
| A5 | Deliberately trigger the switcher's login lockout | Status `Switcher is refusing logins`; module stops rather than retrying | | |

## B. Resilience

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| B1 | Pull the network cable while connected | Status leaves `Ok` within ~4 s, recovers on replug | | |
| B2 | Power-cycle the switcher while connected | Recovers without a Companion restart | | |
| B3 | Idle, connected, 10 minutes | Stays `Ok`; **no spurious reconnects** in the log (watchdog thresholds sane) | | |
| B4 | Polling at the 200 ms minimum for 10 minutes | Switcher's own panel stays responsive — **no lockup**. This is the main P5 risk | | |
| B5 | Polling disabled, idle 10 minutes | Stays `Ok`; watchdog does not force reconnects when silence is expected | | |
| B6 | Wrong IP / switcher powered off | Recycles the attempt rather than hanging; status honest | | |

## C. Fixes that need confirming

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| C1 | Put one input on PGM **and** PVW simultaneously | **Both** the Program and the Preview tally buttons light (this was the inherited bug) | | |
| C2 | Change sources from the switcher's own panel | Feedbacks follow — proves polling and parsing are alive, not just that Companion can send | | |
| C3 | Rename a memory on the panel, wait ~60 poll cycles | `memoryname_N` catches up | | |
| C4 | Load a memory from the panel | `lastmemorynumber` shows the panel's number, 1-30 (not 0-29) | | |
| C5 | Watch variables immediately after connecting | Read `Unknown`, never blank, until the first poll reply | | |
| C6 | Upgrade an existing connection from 1.0.0 | Passcode still works; it has moved to the secrets store and the config field is empty | | |

## D. Open protocol questions

These cannot be settled by reading code. See `CODE_REVIEW.md` §3.

| # | Question | How to settle | Result | Notes |
|---|----------|---------------|--------|-------|
| D1 | **Tally channel count.** Map covers 42 (ends XPT 1-10); is it really 52 with INPUT 1-20? | Verbose log, measure the payload length of a `DTH:0C0000,…` push. 42 channels = 84 hex chars | | |
| D2 | **USB output assign address.** Action writes `000110`, poll reads `000010` | Set USB output from the module, then read back both `RQH:000010,000001;` and `RQH:000110,000001;` | | |
| D3 | **`pnpkey_hueWidth` encoding.** Sends raw decimal where siblings send 14-bit two-byte | Set a known hue width, read it back, compare against a sibling parameter | | |
| D4 | Does the device echo panel presses? | Press panel buttons with verbose on and watch for frames. On the V-80HD it does **not** — if the same holds, address discovery needs Roland RCS traffic | | |
| D5 | Does the device answer batched writes? | Do **not** batch without testing. The V-80HD silently ignored batched writes for four releases | | |

## E. Coverage sweep

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| E1 | Every preset category, one button each | Correct switcher response | | |
| E2 | All PinP/DSK numeric parameters | Values land correctly (confirms the 14-bit encodings) | | |
| E3 | Camera control incl. "Use Selected Camera" | Targets the camera chosen by Select Camera | | |
| E4 | Panel switch press / press-and-release / release | Single press/release pair on the wire, not doubled | | |
| E5 | Macros 1-100 | Correct macro runs (off-by-one check: the action sends macro-1) | | |

---

## Dispositions

When a row closes, record it as Fixed / Closed / Parked / Carried with a date, and
move anything still open into a fresh copy of this file rather than blanking this
one — the record is the evidence.
