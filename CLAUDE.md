# CLAUDE.md — Roland v160v1 - PBS

Guidance for any Claude/Fable session in this repository. This is a **modernization
fork** of an existing, third-party, **MIT-licensed** Bitfocus Companion module for
the **Roland V-160HD** video switcher. Read this whole file before starting.

---

## Mission

Take the existing (old, dated) module and bring it fully up to the **modern
TypeScript Companion standard**, fixing bugs along the way, and build the action set
out into a **complete preset library**. Concretely:

1. **Modernize** the codebase to the current Companion TS module standard
   (`@companion-module/base` **2.x**, typed schema — details below).
2. **Fix bugs** encountered during the port; document each one.
3. **Build a full preset set** covering every action, organized and styled.

**You have wide latitude here.** This is a rewrite/modernization of code we don't
maintain — restructure aggressively, rename freely, delete dead code, impose a clean
architecture. This is *not* a careful minimal-diff patch job. The **one** thing you
must preserve (or verify) is **what goes over the wire to the switcher** — that part
already works, so don't change the bytes the device receives unless you can confirm
the change on hardware.

Not for the Bitfocus marketplace — this is a **public repo** only. The manifest must
still be valid enough for Companion to load the module, but marketplace-specific
strictness and the marketplace checks workflow are optional.

---

## License & attribution (non-negotiable)

This is a derivative of MIT-licensed work:

- **Keep the original `LICENSE`** file and its copyright notice intact. Add our own
  copyright line alongside it (do not replace the original).
- In `README.md`, state that this is a fork/modernization of the original module and
  link the original source.
- MIT permits all of this (modify, redistribute) **provided the original copyright +
  license text are retained**. Retaining them is what keeps this clean. Do it first,
  before other work.

---

## Project identity

- Display name: **Roland v160v1 - PBS**
- Manifest `id`: lowercase-hyphenated, no spaces — e.g. **`roland-v160v1-pbs`**.
- Device: **Roland V-160HD** HD video switcher.
- **Transport: identify it from the existing code and preserve it** (V-160HD control
  is LAN-based; confirm the exact scheme — TCP/socket vs HTTP — from the current
  module rather than assuming). Do not swap transports during modernization.

---

## Target standard — what "modern" means here

Match the current upstream template `bitfocus/companion-module-template-ts`
(**2.x, typed-schema generation**). The key shape:

**`src/main.ts` — default-export class + typed schema (no `runEntrypoint`):**
```ts
import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}
export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)
		UpdateActions(this); UpdateFeedbacks(this); UpdatePresets(this); UpdateVariableDefinitions(this)
		// open connection to the switcher; set Ok on success, ConnectionFailure on error
	}
	async destroy(): Promise<void> { /* close socket, clearInterval every timer */ }
	async configUpdated(config: ModuleConfig): Promise<void> { this.config = config; /* reconnect */ }
	getConfigFields(): SomeCompanionConfigField[] { return GetConfigFields() }
}
```

**Definition files export a `*Schema` type + an `Update*(self)` function that calls
`self.setXDefinitions(...)`:**
```ts
// actions.ts
import type ModuleInstance from './main.js'
export type ActionsSchema = { set_input: { options: { input: number } } }
export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		set_input: {
			name: 'Program: Set Input',
			options: [{ id: 'input', type: 'number', label: 'Input', default: 1, min: 1, max: 16 }],
			callback: async (event) => { await self.sendToSwitcher(event.options.input) }, // options typed
		},
	})
}
```
Feedbacks (`UpdateFeedbacks` -> `setFeedbackDefinitions`), variables
(`UpdateVariableDefinitions` -> `setVariableDefinitions`), config (`GetConfigFields`),
and upgrades (`UpgradeScripts` array) follow the same template shapes.

**Modern toolchain (from the template):**
- **Yarn 4 via Corepack**, `node-modules` linker (`.yarnrc.yml`).
- `package.json` pins `packageManager: yarn@4.x`, `engines.node ^22`,
  `@companion-module/base` 2.x, `@companion-module/tools` 3.x, ESM (`"type":"module"`).
- **Two tsconfigs**: `tsconfig.build.json` (extends the tools' `node22/recommended-esm`
  base, emits to `dist/`) and `tsconfig.json` (editor/typecheck).
- **ESLint flat config** wrapping the tools preset:
  `export default generateEslintConfig({ enableTypescript: true })`.
- `companion/manifest.json` with `runtime: { type: "node22", api: "nodejs-ipc",
  entrypoint: "../dist/main.js" }`.

---

## File structure (target)

```
src/{main,config,actions,feedbacks,variables,presets,upgrades}.ts
companion/{manifest.json,HELP.md}
eslint.config.mjs  tsconfig.json  tsconfig.build.json  package.json  .yarnrc.yml
.github/workflows/node.yaml   LICENSE   README.md
```

---

## Build, lint & package

```
corepack enable && yarn install
yarn build      # tsc -> dist/ (type-check + emit)
yarn lint       # eslint . (type-aware; catches what tsc doesn't)
yarn package    # build + companion-module-build -> distributable
```

**`yarn build` is not enough** — it does not run the type-aware lint rules. Both
`build` and `lint` must be clean before anything is "done". Run `yarn lint --fix`
for mechanical fixes.

---

## Gotchas — bake these in

- **Build-green != lint-green.** `tsc` passes things lint rejects:
  `await-thenable` (don't `await` sync calls like `saveConfig`),
  `no-misused-promises` (wrap `setInterval(async ...)` as
  `setInterval(() => { void (async () => {...})() }, ms)`),
  `no-unnecessary-type-assertion` (drop redundant `as X`; removing one can orphan an
  import — delete it), `no-base-to-string` (`JSON.stringify` objects, don't
  interpolate them), `promise-function-async` (add `async`).
- **ESLint flat-config ignores:** to exclude paths, add a config object whose **only**
  key is `ignores` (global ignore); wrap the preset in an array to do so. A missing
  final newline on `eslint.config.mjs` itself trips `prettier/prettier`.
- **Version lives in two files** — `package.json` **and** `companion/manifest.json`;
  keep them equal.
- **Preset variable references use the module id** (`$(module-id:var)`); Companion
  substitutes the connection label at render time. Don't hardcode a label.
- **Advanced vs boolean feedback:** dynamic text/colour -> `advanced` (return a style,
  always with a fallback so buttons don't blank); on/off style -> `boolean`.
- **Clean teardown:** every `setInterval`/socket opened in `init` must be closed in
  `destroy`, or you leak zombie connections.
- **Status honesty:** `Connecting` while dialing, `ConnectionFailure`/`Disconnected`
  on drop, `Ok` when healthy.

---

## Recommended order of work

1. **Audit the existing module.** Map: transport + connection lifecycle, every
   action and the exact command each sends, any polling/state parsing, config fields,
   feedbacks/variables. Note bugs as you find them.
2. **Attribution first** (LICENSE + README, per above).
3. **Scaffold the modern structure** from the current template; wire the empty
   `Update*`/lifecycle skeleton and get `yarn build`/`yarn lint` green on the shell.
4. **Port config + connection** into `init`/`configUpdated`/`destroy`. Reproduce the
   device I/O faithfully. Add **reconnect** + status handling if the original lacked
   it (common in old modules).
5. **Port actions** into typed `setActionDefinitions`, one functional group at a
   time. Fix bugs during the port; keep a running list of what changed.
6. **Add variables + feedbacks** for any switcher state the device reports back
   (e.g. current PGM/PVW input, tally, transition/AUX state) — these power the preset
   feedbacks.
7. **Build the preset library** (next section).
8. **Upgrade scripts** if you renamed/reshaped any action or config key, so anyone
   using the old module keeps working buttons. Append-only.
9. **Final `yarn build` + `yarn lint` clean; `yarn package`.**

---

## Preset library — a primary deliverable

Turn the full action set into a complete, usable preset library:

- **Every action gets at least one preset button.** Where an action takes a small
  fixed set of values (input 1..N, bus, transition type), generate **one button per
  value** via loops — not a single parameterised button.
- **Organize into categories** by function (e.g. *Program*, *Preview*, *Transitions*,
  *AUX/Outputs*, *Audio*, *Macros/System*). Categories are how users find buttons.
- **Consistent styling from one place.** Define a small colour palette / role scheme
  once (e.g. program = red, preview = green, transition = amber, system = blue) and
  reuse it — don't scatter raw hex. Keep `size` and `show_topbar` consistent.
- **Wire feedbacks onto presets** wherever state exists: the current PGM input button
  should light via a `boolean` feedback; dynamic labels (input names, if the device
  exposes them) via `advanced` feedback with a numeric fallback.
- Preset variable references use the module id (see gotchas).

Aim for a preset set someone could build a working V-160HD surface from without ever
opening the raw action list.

---

## Bug-fixing

Fix what you find during the port; for each fix, note *what was wrong* and *what
changed* (for the README/changelog). Usual suspects in old modules: no reconnect /
no status updates, unhandled connection errors, races between polls and commands,
brittle response parsing, missing timeouts (add `AbortSignal.timeout(...)` or socket
timeouts), overlapping in-flight polls, off-by-one on input/bus indexing, and hard-
coded assumptions about model/config.

---

## Validation

- **If a V-160HD (or the switcher) is available:** verify actions actually drive it
  and feedbacks reflect real state. That's the real test.
- **If not:** make the modernization **behaviour-neutral on the wire** — the ported
  code must send the device the *same* commands the original did. Confirm this by
  comparing against the old code, get `build` + `lint` fully clean, and clearly flag
  anything that *changes* what's sent (new reconnect logic, altered command strings)
  as needing human/hardware verification before release.

---

## Definition of done

1. Modern 2.x structure — typed schema, `Update*(self)`, default-export class, ESM,
   yarn 4 toolchain, flat ESLint config, split tsconfig.
2. `yarn build` and `yarn lint` both clean (0 errors); `yarn package` succeeds.
3. Full preset library: every action covered, categorized, consistently styled, with
   feedbacks wired where state allows.
4. Bugs fixed and documented.
5. **Original MIT `LICENSE`/copyright retained**, our copyright added, fork noted in
   `README.md`.
6. `version` set and equal in `package.json` + `companion/manifest.json`; manifest
   `id` is lowercase-hyphenated.
7. Upgrade scripts for any renamed/reshaped actions or config keys (append-only).
8. A README/changelog summarizing the modernization and the bug fixes.
