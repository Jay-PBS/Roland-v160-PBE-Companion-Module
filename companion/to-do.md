# To-do

Status as of 2026-09-11.

## Done

- [x] **Module clashed with the official release, appearing as a version of it.**
      Root cause found: `legacyIds: ["roland-v160hd"]` in the manifest tells
      Companion this module *is* the renamed official one, so it is presented as a
      version of it rather than as a separate module. Now `[]`.
- [x] **Recreated as Roland V160 PBE**, following the Pixera convention
      (`pixera-purple-badger` / "Pixera Purple Badger" / "Pixera PBE"):
      - manifest `id`: `roland-v160-pbe` — note **lowercased** from the hand-edited
        `roland-v160-PBE`; Companion ids must be lowercase-hyphenated, and the id
        appears in preset variable references
      - manifest `name`: `Roland V160 Purple Badger`, `shortname`: `V160 PBE`
      - `package.json` name and both GitHub URLs realigned to
        `Roland-v160-PBE-Companion-Module`
- [x] **Built the hardware testing list** — `TESTING-NEXT.md`, ordered by risk with
      a connection gate first, plus the open protocol questions.
- [x] **README updated** with the live-development warning and the
      testing-welcome / issues-open note.
- [x] **V-80HD colour scheme carried across** to the v160 presets: the same
      deep/bright hue-preserving pairs at ~4:1 contrast, and active states now use
      **black** text (white fails contrast on every bright colour). Two extra pairs
      derived the same way for roles the V-80HD does not have.
- [x] **Code review rolled in** — see `CODE_REVIEW.md` and the 1.1.0 changelog.
      12 defects fixed, 3 parked as needing hardware, 1 deliberately unchanged.
      Proven byte-neutral on the wire: all 76 action callbacks emit identical bytes.
- [x] **Idiot-check of the hand edits** — found and fixed:
      - `src/presets.ts` still hardcoded the **old** module id
        (`roland-v160v1-pbs`) for preset variable references, so after the manifest
        rename every memory-name and model/version button would have rendered the
        raw `$(...)` text instead of a value. It now derives from a single
        `MODULE_ID` constant tied by comment to the manifest.
      - manifest `name` was a copy of the `id` rather than a human-readable name
      - manifest `id` contained uppercase
      - `package.json` name and repo URLs still pointed at the old repo
      - `companion/HELP.md` title read "Purple Badger Solution Moderization"
        (missing s, misspelt modernization)
- [x] **Built** — `roland-v160-pbe-1.1.0.tgz`. `build`, `lint`, `prettier` and
      `package` all clean.

## Open — needs your call

- [ ] **Version number.** The list said bump to 1.0.1; this is tagged **1.1.0**
      instead, because the config schema changed (passcode moved to the secrets
      store) and an append-only upgrade script was added — a patch bump would
      understate that. Say the word and it goes to 1.0.1.
- [ ] **Push to GitHub and make public.** Not done — pushing and changing
      visibility are outward-facing and irreversible in effect, so they need an
      explicit go-ahead. Note the working tree is still on `main`.
- [ ] **Stale artefact:** `roland-v160v1-pbs-1.0.0.tgz` is still in the repo root
      under the old name. Delete it, or keep it as a record?
- [ ] **`manufacturer` is `"Roland"`** in the manifest, where the Pixera module
      uses `"Purple Badger Solutions"`. Left as Roland since that is the device's
      actual maker and is how users browse by manufacturer — change if you want
      strict consistency with the other modules.

## Next session with hardware

Work `TESTING-NEXT.md` top to bottom. Section A is a gate: if A1 fails nothing
else is testable. The three open protocol questions (tally channel count, USB
output assign address, `pnpkey_hueWidth` encoding) are in section D.
