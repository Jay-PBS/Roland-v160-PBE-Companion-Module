# Changelog

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
