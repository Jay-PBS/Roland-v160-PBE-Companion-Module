# To-do

Status as of 2026-09-11.

## Done

- [x] **Module clashed with the official release, appearing as a version of it.**
      Root cause found: `legacyIds: ["roland-v160hd"]` in the manifest tells
      Companion this module _is_ the renamed official one, so it is presented as a
      version of it rather than as a separate module. Now `[]`.
- [x] **Recreated as Roland V160 PBE**, following the Pixera convention
      (`pixera-purple-badger` / "Pixera Purple Badger" / "Pixera PBE"): - manifest `id`: `roland-v160-pbe` — note **lowercased** from the hand-edited
      `roland-v160-PBE`; Companion ids must be lowercase-hyphenated, and the id
      appears in preset variable references - manifest `name`: `Roland V160 Purple Badger`, `shortname`: `V160 PBE` - `package.json` name and both GitHub URLs realigned to
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
- [x] **Idiot-check of the hand edits** — found and fixed: - `src/presets.ts` still hardcoded the **old**, pre-rename
      module id for preset variable references, so after the manifest
      rename every memory-name and model/version button would have rendered the
      raw `$(...)` text instead of a value. It now derives from a single
      `MODULE_ID` constant tied by comment to the manifest. - manifest `name` was a copy of the `id` rather than a human-readable name - manifest `id` contained uppercase - `package.json` name and repo URLs still pointed at the old repo - `companion/HELP.md` title read "Purple Badger Solution Moderization"
      (missing s, misspelt modernization)
- [x] **Built** — `roland-v160-pbe-1.1.0.tgz`. `build`, `lint`, `prettier` and
      `package` all clean.

- [x] **Version 1.1.0** confirmed (not 1.0.1) — the config schema changed and an
      upgrade script was added, so a patch bump would understate it.
- [x] **Stale 1.0.0 `.tgz` built under the pre-rename module id deleted.**
- [x] **Display name set** to `Roland v160 : Purple Badger Edition` with shortname
      `V160_PBE`. Note how Companion's module list actually renders: the **bold**
      line is `shortname` and the line beneath it is `manufacturer: products` —
      confirmed against the v80hd row (`Roland: V-80HD`) and the Pixera row
      (`Purple Badger Solutions: Pixera`). `name` is not shown in that list.
      `manufacturer` is left as `Roland` and `products` as `["V-160HD"]`, so the
      list line reads `Roland: V-160HD` and the module stays findable by
      manufacturer. If you want that line to read differently, it is those two
      fields to change, not `name`.

- [x] **Pushed to GitHub** — `main` is on
      `Jay-PBS/Roland-v160-PBE-Companion-Module`, full 67-commit history including
      the upstream lineage. This repo was created fresh on 2026-09-11 and is the
      first and only GitHub home for this project; nothing was migrated. The
      pre-rename URL that was sitting in `.git/config` was a guess made when the
      fork was scaffolded and never corresponded to a real repo.
- [x] **CI green** (run on `27cfee7`: install, build and lint all pass).
      The failure was the package rename invalidating the root workspace entry in
      `yarn.lock` — Yarn turns on `--immutable` automatically when `CI` is set, so
      the install refused to update it and exited 1 with no useful message.
      Lockfile regenerated, and `--immutable` is now written out explicitly in the
      workflow so the same drift fails with an obvious message next time.

  - Worth remembering: the first attempt at this fix also bumped
    `actions/checkout` and `actions/setup-node` to v5 and added a
    permissions/concurrency block, none of which was needed. The run then failed
    at `setup-node@v5` instead — one failure swapped for another, with the
    original signal lost. Reverted to v4 and kept only the one-line fix. The
    Node 20 notice is a warning, not an error, and GitHub already force-runs
    those actions on Node 24.

- [x] **Windows folder renamed** — the working copy now lives at
      `D:\GITHUB\Roland-v160-PBE-Companion-Module`, matching the module id and
      the GitHub repo name. Nothing tracked referred to the old path, so git,
      the build and CI were unaffected. The one side effect was handled: Claude
      Code keys its per-project memory off the folder path, and the memory
      (fork decisions, the id/MODULE_ID rule, the no-hardware constraint) was
      carried across to `~/.claude/projects/d--GITHUB-Roland-v160-PBE-Companion-Module/`.
      The old slug has since been deleted.
- [x] **Stale identity swept** — `README.md`, `CODE_REVIEW.md` and `CLAUDE.md`
      carried the old pre-rename project name in their titles, and this file
      still spelled it out in four places as history. All gone: the old name now
      appears nowhere in the repository, and the dead per-project folder it left
      behind under `~/.claude/projects/` has been deleted too.

- [x] **Packaged builds are committed** — the module is not distributed
      anywhere else, so the `.tgz` from `yarn package` lives in the repo root.
      Retention is the three most recent versions; delete the oldest when a
      fourth is added.

- [x] **Repo is public.**

## Open — needs your call

- [ ] **This file ships inside the module.** `companion/` is packaged wholesale,
      so these internal dev notes end up in users' Companion installs alongside
      `HELP.md`. Move it to the repo root if that is not wanted — left where it is
      for now because that is where you have been looking for it.

## Next session with hardware

Work `TESTING-NEXT.md` top to bottom. Section A is a gate: if A1 fails nothing
else is testable. The three open protocol questions (tally channel count, USB
output assign address, `pnpkey_hueWidth` encoding) are in section D.
