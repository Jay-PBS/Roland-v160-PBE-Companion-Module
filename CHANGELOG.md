# Changelog

## 1.1.1 — Documentation and formatting

No functional change. No command byte changed — `src/` is untouched.

- Repository folder renamed to `Roland-v160-PBE-Companion-Module`, matching the
  module id and the GitHub repository name.
- README now says the fork is not distributed through the **Bitfocus module
  library** rather than "marketplace", which is the current name for it.
- Every Markdown, YAML and JSON file in the repository run through Prettier, so
  `yarn prettier --check .` is clean alongside `yarn build` and `yarn lint`.
  Cosmetic only: emphasis style, blank lines around fenced blocks, and code
  samples inside the docs wrapped the way Prettier wraps them.

## 1.1.0 — Correctness review & transport hardening

A review pass over the 1.0.0 conversion, checking every feedback, variable,
preset reference and the connection layer against the original JavaScript to
establish which defects were inherited and which were introduced. Patterns for
the fixes were taken from the sibling `Roland-v80-Companion-Module`, which has
hardware-derived evidence for most of them.

### Wire compatibility

No command byte changed. Every action callback was executed against a recording
stub before and after the work and the emitted bytes compared: **all 76
identical**, and `calculateBytes` identical across its range. The one deliberate
change to _traffic_ is the polling cadence described under "Polling load" below —
the per-cycle command set is otherwise byte-identical and in the same order.

### Fixed — verified by reading the code and by test

1. **Incoming TCP data was parsed per chunk, with no reassembly.** This is the
   discrepancy 1.0.0 recorded as preserved-from-the-original, and it was worse
   than "a split report is dropped": the password prompt and the login banner
   were matched by exact string equality against a whole chunk, so if either
   arrived with any other bytes attached, **the module never authenticated and
   sat on "Authenticating" indefinitely**, or never reached `Ok` and so never
   started polling. All three failures were reproduced, then fixed. Data is now
   accumulated in a receive buffer, unterminated text (prompt, banner, lockout
   and error lines) is matched against the raw buffer and cut out where it sits,
   and complete frames are split on `;` or newline. The buffer is discarded with
   a warning past 8 KB rather than sliced through the middle of a value.
2. **The password was re-sent on every prompt.** There was no "already sent"
   guard, so a rejected passcode produced a prompt/answer loop. The switcher
   locks out after repeated attempts and then refuses even a correct password.
   It is now sent exactly once; a second prompt is reported as a rejection, and
   `Wait a moment` (lockout) and `Authentication error` are surfaced distinctly.
   A failed login is not retried automatically, but editing the config clears
   that latch so a corrected passcode reconnects.
3. **Tally "Program" buttons went dark when the source was on PGM and PVW at
   once.** Status `3` satisfied only the "Both" selection, while every Program
   tally preset uses "Program" — so the button unlit precisely when its input was
   on programme. Inherited from the original. `Program` now matches `1` or `3`,
   and `Preview` matches `2` or `3`.
4. **Feedbacks and variables were recomputed on every TCP segment** — hundreds
   of full passes per poll cycle, plus a separate variable write for each of the
   240 memory-name characters. The fan-out is now debounced by 40 ms, so a poll
   cycle produces one pass.
5. **No watchdog.** `TCPHelper` only reconnects on socket `error`/`end`; a link
   that dies without a FIN or RST (cable pull, Wi-Fi drop, switch power-cycle)
   fires neither, so the module reported `Ok` against a dead socket indefinitely.
   A 1 Hz watchdog now nudges after 1.5 s of silence, rebuilds the connection
   after 4 s, gives up on a stalled login after 6 s, and recycles an attempt to
   an unreachable host every 12 s. The nudge reuses an address already in the
   poll set (`0A0003`) so the watchdog cannot put an unfamiliar command on the
   wire, and its silence tiers are skipped when polling is off — where the device
   is expected to be quiet and the original sent nothing.
6. **Device errors were swallowed.** Only the exact string `ERR:0;` was
   recognised; `ERR:4` and `ERR:5` fell through and vanished. All `ERR:` frames
   are now logged as warnings, and unmatched frames are logged under verbose.
7. **`lastmemorynumber` was zero-based** — loading Memory 1 displayed `0`, while
   the dropdowns and the `memoryname_N` variables are 1-based. Now 1-30.
8. **Fourteen variables rendered blank** before the first poll reply (aux and
   output sources, PnP/Key sources) because their lookups returned `undefined`,
   which on a button is indistinguishable from a broken variable reference. They
   now read `Unknown` until the switcher reports, and an unrecognised value falls
   back to the raw value so it stays diagnosable.
9. **An unrecognised PnP/Key source left the previous name in place**,
   misreporting the source. It now reads `Unknown (<value>)`.
10. **Connection state was not reset on a drop.** Teardown is now a single
    idempotent routine — clearing the poll, watchdog, debounce and pending
    press-release timers, destroying the socket inside `try`/`catch`, emptying
    the receive buffer and resetting the auth flags — reused by `destroy()`,
    `configUpdated()` and the watchdog's forced reconnect. Double teardown is safe.

### Security

- **The passcode has moved to Companion's secrets store** (`secret-text`) instead
  of the config store, which is round-tripped to the web UI. An append-only
  upgrade script copies an existing password across and blanks the legacy key,
  and the connection falls back to the legacy value so a connection whose upgrade
  has not yet run still authenticates.

### Polling load — the one deliberate change to traffic

A poll cycle issued **271 requests, 240 of which re-read all eight characters of
all thirty memory names** — values that only change when someone renames a memory
on the panel. With the old 100 ms minimum rate that allowed roughly 2710
commands/second; the sibling V-80HD module measured panel lockup on this family
of switchers at around 244/second.

Memory names are now read once at login and refreshed every 60th cycle, in the
same position in the sequence. The per-cycle set is the old set minus exactly
those 240 requests, in the same order — verified by comparison. The minimum poll
rate is raised to 200 ms and clamped at runtime too, so a stored config or a
hand-edited value cannot go below it. Worst case is now about 155 commands/second.

**This alters how often requests are sent, not their content.** It is the only
change in this release that a hardware test could contradict.

### Still unresolved — needs a V-160HD to settle

- The **USB output assign action** writes address `000110` while the poll reads
  `000010` for the same state. Both are inherited from the original, and the
  original's feedback compared `000010` against a dropdown emitting `000110`, so
  USB feedback never matched there. The feedback now accepts both, but which
  address the _action_ should write is unresolved and wire-affecting. Unchanged.
- **Tally channel coverage.** `TALLY_INPUTS` maps 42 channels, ending at XPT
  1-10, inherited from the original. Roland's _Basic Control Commands_ document
  lists 52 channels with INPUT 1-20 for the V-160HD, but that describes a
  different protocol from the `DTH`/`RQH` scheme this module speaks, so it is not
  evidence here. If the tally push carries more than 42 entries, the extras are
  parsed into state and then dropped for want of a mapping. Resolve with verbose
  logging against a real unit.
- **`pnpkey_hueWidth`** still sends a raw decimal, unlike every sibling parameter
  which uses the 14-bit two-byte encoding. Preserved unchanged (carried from 1.0.0).
- The **tally variables** report `Program` for status 3 (on both buses), matching
  the original's value domain. Left alone deliberately: changing it would break
  any user expression comparing against `"Program"`.

### Verification

No hardware was available, so verification is differential and structural:

- 76/76 action callbacks byte-identical before and after; `calculateBytes`
  identical; poll set identical apart from the documented memory-name change.
- 34 behavioural checks covering the receive splitter (a frame split across three
  chunks, coalesced frames, a frame behind the prompt, a frame before the prompt,
  a banner coalesced with a frame, buffer overflow), the auth state machine
  (single send across repeated prompts, rejection, lockout, auth error, legacy
  password fallback, no duplicate setup on a repeated banner), the debounce,
  teardown, tally semantics and memory numbering.
- Cross-reference audit: 76/76 actions have presets, 11/11 feedbacks are
  referenced, no dangling ids in either direction, and 106/106 variables both
  declared and set with none left `undefined`.
- `yarn build`, `yarn lint` and `yarn package` clean.

What none of this proves: that the watchdog thresholds suit a real network, that
the switcher tolerates the memory-name refresh cadence, or that the login
sequence behaves as modelled against real firmware. Those need the hardware
checklist in `CODE_REVIEW.md`.

## 1.0.0 — Modernization fork (from upstream `roland-v160hd` 2.2.1)

Full rewrite of the original JavaScript module to the modern Companion
TypeScript standard: `@companion-module/base` 2.x with a typed schema,
default-export instance class, ESM, Yarn 4 (Corepack), split tsconfig, flat
ESLint config, and a node22 runtime.

### Wire compatibility

The device protocol (TCP port 8023, `DTH:`/`RQH:` text commands) is preserved
byte-for-byte from the original module, verified by executing every action
callback against a mock socket and comparing the emitted bytes with the
original code's output — including the doubled trailing newline on set
commands, the `VER` request without a terminator, raw-decimal 14-bit MSB/LSB
values, and the identical polling request set.

### New in this fork

- **Complete preset library** (~1600 buttons) organized into categories:
  Program, Preview, Transitions, Layers On-Air, PinP & Key Setup, DSK Setup,
  AUX, Outputs, Inputs, Memory, Freeze, Camera Control, Panel Switches, and
  System & Macros. Every action is covered; feedbacks are wired wherever the
  switcher reports state; memory buttons show live memory names.
- New feedbacks: **Selected Camera** and **Last Loaded Memory**.
- Memory-name variables now decode to readable text (see bug 9 below).
- Upgrade scripts migrate old configs and broken stored option values.
- Automatic reconnection via the framework TCP helper, and honest connection
  status (`Connecting`/`Authenticating` until the switcher accepts the
  password, instead of `Ok` on socket connect).

### Bugs fixed (found during the port)

Behaviour-neutral fixes (no change to what a working setup sends):

1. **Reconnect timer leak** — `destroy()` called
   `clearInterval(this.RECONNECT_INTERVAL)` where `RECONNECT_INTERVAL` held the
   constant `30000`, not a timer handle, so the pending reconnect survived
   module deletion. Reconnection is now handled by the framework TCP helper and
   torn down properly.
2. **`keyOnAir` feedback never worked** — it called `.find()` on a plain object
   (throws) and read a non-existent option (`opt.key` instead of `opt.pinp`).
3. **`outputAssign` feedback never matched** — it compared against
   `DATA.hdmi1source` etc. while the poll stored `hdmi1assign` etc.
4. **`pnpKeySource` feedback broken default** — default `'1B'` was not one of
   its own choice values (`'pnpkey1'`…). Fixed, with an upgrade script for
   stored feedbacks.
5. **Aux feedbacks broken default** — `auxTally`/`auxMute`/`auxLink` defaulted
   to `'11'`, not a valid choice (`'aux1'`…). Fixed, with an upgrade script.
6. **`freeze` variable never defined** — typo `variableI:` instead of
   `variableId:` in the definition list.
7. **Duplicate config/variable identifiers** — duplicate config field ids
   (`info`, `hr1`) and three Aux Link variables all named "Aux Link" are now
   unique.
8. **Pending switch-release timers leaked** — the 200 ms release timers from
   "Press and Release Panel Switch" are now tracked and cleared on destroy.
9. **Memory names garbled** — the per-character reassembly had an off-by-one
   (`substring(index * 2 + 1)` instead of `+ 2`) that dropped half of every
   character, and names were shown as raw hex. Names are now reassembled
   per-character and decoded to ASCII.

Fixes that change what is sent **only where the original was already broken**
(flagged for hardware verification):

10. **`set_wipe_direction` crashed** — the callback read the non-existent
    option `options.type` (the option id is `direction`), so the action threw
    and never sent anything. It now sends `DTH:001803,<direction>`.
11. **`set_transition_time` float garbage** — `time * 10` was converted to hex
    without rounding, so e.g. 2.3 s produced `22.999999...` → an invalid hex
    payload. Now rounded (1.5 s → `0F` exactly as before; only the previously
    garbage cases change).
12. **`aux_mute` / freeze-select invalid defaults** — defaults were the number
    `1`, not a valid choice (`'00'`/`'01'`), so untouched actions sent
    `DTH:...,1;`. Defaults fixed and stored values migrated by upgrade script.
13. **"Use Selected Camera" wrong default address** — the internal selected
    camera defaulted to `'01'`, but camera addresses are `'41'`–`'50'`, so using
    "Use Selected Camera" before running Select Camera sent commands to
    `0201xx` instead of `0241xx`. Default is now `'41'` (Camera 1).

### Known discrepancies preserved as-is (need hardware to resolve)

- The **USB output assign action** sends address `000110` while the poll
  requests `000010` for the same state (both inherited from the original).
  One of them is presumably wrong; both are left unchanged.
- **`pnpkey_hueWidth`** sends its value as a raw decimal (possibly negative),
  unlike every sibling parameter which uses the 14-bit two-byte encoding.
  Preserved unchanged.
- Incoming TCP data is parsed per-chunk without reassembly framing, as in the
  original; a report split across packets is dropped silently.

### Toolchain

- `yarn build`, `yarn lint`, and `yarn package` are all clean.
- CI (GitHub Actions) runs build + lint on Node 22.
