# Bitfocus Companion Modules — Structure, Assembly & Build

A generic reference for how a TypeScript Companion module is laid out, how its
pieces fit together, and how it is built, packaged, and CI-checked. Written to be
(a) a scaffold reference for new modules and (b) source material for per-project
`CLAUDE.md` files. It is deliberately module-agnostic — no device- or
product-specific logic — and grounded in the upstream template
`bitfocus/companion-module-template-ts`.

---

## 0. Two API generations (read this first)

There are two live generations of the module API, and any given repo is on one of
them. Detect which before assuming a pattern:

| Signal                    | **2.x (current template)**                                                                | **1.x (most existing modules)**                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@companion-module/base`  | `2.x`                                                                                     | `1.x`                                                                                  |
| `@companion-module/tools` | `3.x`                                                                                     | `2.x`                                                                                  |
| Entry in `main.ts`        | `export default class … extends InstanceBase<ModuleSchema>` + `export { UpgradeScripts }` | `runEntrypoint(Instance, UpgradeScripts)`                                              |
| Definition files          | `Update*(self)` calling `self.setXDefinitions(...)`, plus exported `*Schema` types        | `Get*(self)` **returning** a definitions object, passed to `self.setXDefinitions(...)` |
| Typing                    | Typed schema (`ModuleSchema`, `ActionsSchema`, …); options typed on `event.options`       | Untyped; options read as `event.options['id'] as T`                                    |
| Presets                   | `setPresetDefinitions(structure, presets)` with `CompanionPresetSection[]`                | `setPresetDefinitions(presets)` — flat object keyed by preset id                       |
| `tsconfig.build` base     | `@companion-module/tools/tsconfig/node22/recommended-esm.json`                            | `.../node22/recommended`                                                               |

Everything else in this document — file layout, toolchain, build/package flow, CI,
manifest, and the gotchas — is **the same across both**. Where a building block
differs, both forms are shown.

Migrating 1.x → 2.x is mostly: retype every definition into the schema types, swap
`Get*` return-objects for `Update*(self)` bodies, and replace `runEntrypoint` with
the default-export class. It is mechanical but large; treat it as its own isolated
change, never bundled with feature work.

---

## 1. What a Companion module is

Companion loads each module as a **separate Node process** and talks to it over IPC.
The module's job is to translate between Companion's model (buttons, actions,
feedbacks, variables, presets) and whatever the target device/software speaks
(TCP, HTTP/REST, WebSocket, OSC, serial, a vendor SDK, …).

The `@companion-module/base` package provides `InstanceBase`, which the module
subclasses. The base class gives you the methods you call _out_ to Companion
(`setActionDefinitions`, `setVariableValues`, `checkFeedbacks`, `updateStatus`,
`log`, `saveConfig`, …) and the lifecycle hooks Companion calls _in_
(`init`, `configUpdated`, `destroy`, `getConfigFields`).

A module is **one connection type**. One instance = one configured connection to one
device. Users can create many instances; each gets its own process, config, and
label.

---

## 2. Canonical repository structure

```
.
├── src/
│   ├── main.ts          # Instance class + lifecycle; wires everything together
│   ├── config.ts        # Config field schema + ModuleConfig type
│   ├── actions.ts       # Action definitions (things buttons DO)
│   ├── feedbacks.ts     # Feedback definitions (button state → style/text)
│   ├── variables.ts     # Variable definitions (+ any value/format helpers)
│   ├── presets.ts       # Preset button definitions (ready-made buttons)
│   └── upgrades.ts      # Config/action/feedback migration scripts
├── companion/
│   ├── manifest.json    # Module metadata Companion reads to load the module
│   └── HELP.md          # User-facing help shown in the Companion UI
├── .github/
│   ├── workflows/
│   │   ├── node.yaml                       # Lint + build (types) CI gate
│   │   └── companion-module-checks.yaml    # Bitfocus reusable module checks
│   └── ISSUE_TEMPLATE/…
├── eslint.config.mjs    # Flat ESLint config (wraps the tools preset)
├── tsconfig.json        # Editor/typecheck config
├── tsconfig.build.json  # Build config (emits to dist/)
├── package.json         # Deps, scripts, packageManager, prettier ref
├── .yarnrc.yml          # Yarn 4 settings (node-modules linker, security gates)
├── .prettierignore
├── .gitignore
├── .husky/pre-commit    # Runs lint-staged
├── LICENSE
└── README.md
```

`dist/` (compiled output) and `pkg/` / `*.tgz` (packaged module) are build
artifacts and are git-ignored.

---

## 3. The instance class & lifecycle (`main.ts`)

`main.ts` defines the instance class and wires the building blocks together. It is
the only file that talks to Companion's lifecycle directly.

**2.x (typed, default-export):**

```ts
import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // assigned in init()

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdatePresets(this)
		UpdateVariableDefinitions(this)
		// open connections / start polling here
	}

	async destroy(): Promise<void> {
		// tear down connections, clear timers
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		// reconnect / re-init as needed
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}
}
```

**1.x (untyped, `runEntrypoint`):** identical lifecycle, but the class is registered
at the bottom of the file and definitions are set from returned objects:

```ts
runEntrypoint(ModuleInstance, UpgradeScripts)
// inside init():
this.setActionDefinitions(GetActions(this))
this.setFeedbackDefinitions(GetFeedbackDefinitions(this))
this.setPresetDefinitions(GetPresets(this))
this.setVariableDefinitions(GetVariableDefinitions())
```

**Lifecycle contract:**

- `init(config)` — called once when the connection starts (and on reload). Assign
  config, register all definitions, open transport, start any polling. Set status
  via `updateStatus(InstanceStatus.Ok | Connecting | ConnectionFailure | …)`.
- `configUpdated(config)` — user changed settings. Re-apply and reconnect. Don't
  assume anything survives; re-read from `config`.
- `destroy()` — clean up: close sockets, `clearInterval` every timer. Leaks here
  cause zombie connections.
- `getConfigFields()` — returns the config UI schema (see §4).

**Status** is UI-visible; keep it honest (`Connecting` while dialing,
`ConnectionFailure` on error, `Ok` when healthy). It's the user's first diagnostic.

---

## 4. Config (`config.ts`)

Defines both the **shape** of persisted config and the **form** shown in the UI.

```ts
import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	port: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{ type: 'textinput', id: 'host', label: 'Target IP', width: 8, regex: Regex.IP },
		{ type: 'number', id: 'port', label: 'Target Port', width: 4, min: 1, max: 65535, default: 8000 },
	]
}
```

Field `id`s must match `ModuleConfig` keys. Widths are a 12-column grid. Common
field types: `textinput`, `number`, `checkbox`, `dropdown`, `colorpicker`, and
`static-text` (for help/section headers).

**Persistence constraint:** config values are `string | number | boolean`
(top level). To store structured data (arrays/objects), serialize to a JSON string
field and (de)serialize through helpers. Persist changes with `this.saveConfig(this.config)`.

---

## 5. Building blocks

For each block: what it is, then the skeleton. 2.x form shown as primary; 1.x noted.

### 5.1 Actions (`actions.ts`) — things a button _does_

```ts
// 2.x
export type ActionsSchema = {
	sample_action: { options: { num: number } }
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		sample_action: {
			name: 'My First Action',
			options: [{ id: 'num', type: 'number', label: 'Test', default: 5, min: 0, max: 100 }],
			callback: async (event) => {
				// event.options.num is typed in 2.x
				await self.doSomething(event.options.num)
			},
		},
	})
}
```

- 1.x: `export function GetActions(self): CompanionActionDefinitions { return { … } }`
  and read options as `event.options['num'] as number`.
- Callbacks may be async; they run on button press. Side effects (network writes)
  go here.
- For simultaneous fire-and-forget writes, `Promise.all([...])` is appropriate in
  live/performance contexts; avoid confirmation prompts on the hot path.

### 5.2 Feedbacks (`feedbacks.ts`) — state → button appearance

Two kinds:

- **`boolean`** — returns `true/false`; Companion applies `defaultStyle` (or the
  button's overrides) when true. Use for on/off indicators (connected, bypassed,
  active).
- **`advanced`** — returns a partial style object (`{ text, bgcolor, color, … }`).
  Use when the button's **text or colour is computed** (dynamic names, live values,
  formatted readouts).

```ts
// 2.x boolean
export type FeedbacksSchema = {
	sample_feedback: { type: 'boolean'; options: { num: number } }
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		sample_feedback: {
			name: 'Example Feedback',
			type: 'boolean',
			defaultStyle: { bgcolor: 0xff0000, color: 0x000000 },
			options: [{ id: 'num', type: 'number', label: 'Test', default: 5, min: 0, max: 10, clampValues: true }],
			callback: (feedback) => feedback.options.num > 5,
		},
	})
}
```

Advanced feedback returns text/style instead of a boolean:

```ts
callback: (feedback) => {
	const name = lookupName(self.state, feedback.options.id)
	return { text: name ?? `#${feedback.options.id}` } // fallback keeps buttons non-blank
}
```

- Feedbacks re-evaluate when you call `self.checkFeedbacks('feedback_id', …)`.
  Call it wherever the underlying state changes (after a poll, after an action that
  mutates local state). `checkFeedbacks(id)` re-runs **every** button instance of
  that feedback.
- Advanced feedback text **overrides** the button's base `text`. Always provide a
  fallback so a missing value shows a sensible default rather than blank.
- 1.x: `GetFeedbackDefinitions(self)` returning the object; callbacks typed loosely.

### 5.3 Variables (`variables.ts`) — named values usable in button text

```ts
// 2.x
export type VariablesSchema = {
	connection_state: string
	value_1: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		connection_state: { name: 'Connection State' },
		value_1: { name: 'Some Value' },
	})
}
```

- Set values at runtime with `self.setVariableValues({ value_1: '…' })`. Values are
  strings; format numbers/times yourself (keep formatting helpers in this file).
- Users reference them in button text as `$(connection-label:variable_id)`.
- **Definitions** (the list) are static; **values** update as often as you like.
- 1.x: `GetVariableDefinitions()` returning `CompanionVariableDefinition[]`.

### 5.4 Presets (`presets.ts`) — ready-made buttons users drag in

**2.x** groups presets into sections and passes both structure and definitions:

```ts
export function UpdatePresets(self: ModuleInstance): void {
	const structure: CompanionPresetSection[] = [
		{
			id: 'section1',
			name: 'Section One',
			definitions: [{ id: 'group1', name: 'Group One', type: 'simple', presets: ['mylabel'] }],
		},
	]
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	presets['mylabel'] = {
		type: 'simple',
		name: 'Name',
		style: { text: 'Label', size: 'auto', color: 0xffffff, bgcolor: 0x000000, show_topbar: false },
		steps: [{ down: [{ actionId: 'sample_action', options: { num: 5 } }], up: [] }],
		feedbacks: [{ feedbackId: 'sample_feedback', options: { num: 6 } }],
	}
	self.setPresetDefinitions(structure, presets)
}
```

**1.x** is a flat object keyed by preset id, with a `category` string per preset,
passed as `setPresetDefinitions(presets)`. Preset generation loops (per
layer/channel/etc.) are common and keep the file compact.

Key points, both generations:

- A preset bundles: a `style` (text/colour), `steps` (which actions fire on
  press/release), and `feedbacks` (which feedbacks style the button).
- **Preset variable references use the module id**, e.g.
  `$(your-module-id:variable_id)` — Companion substitutes the id for the user's
  actual connection label at render time. This is the documented pattern; do **not**
  hardcode a specific connection label.
- For button text that must reflect the **live instance label** at build time, use
  `self.label` when generating the preset (normalize it in a pass before
  `setPresetDefinitions`).
- Preset button `style.text` is static at drag time; dynamic text comes from
  advanced feedbacks or variables, not from rewriting presets.

### 5.5 Upgrade scripts (`upgrades.ts`) — migrate old configs forward

```ts
export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	// (context, props) => ({ updatedConfig, updatedActions: [], updatedFeedbacks: [] })
]
```

- Each script migrates configs/actions/feedbacks saved by an older version.
- **Append-only and permanent:** once shipped, a script can never be removed or
  reordered — users may upgrade across any version gap, so the whole chain must
  keep running. Add new scripts to the end.
- Return `updatedConfig: null` (and empty arrays) when nothing changed.

---

## 6. The manifest (`companion/manifest.json`)

Metadata Companion reads to discover and load the module. It does **not** run code;
it points at the built entrypoint.

```json
{
	"$schema": "../node_modules/@companion-module/base/assets/manifest.schema.json",
	"type": "connection",
	"id": "your-module-name",
	"name": "your-module-name",
	"shortname": "module-shortname",
	"description": "One-line description",
	"version": "0.0.0",
	"license": "MIT",
	"repository": "git+https://github.com/<org>/companion-module-your-module-name.git",
	"bugs": "https://github.com/<org>/companion-module-your-module-name/issues",
	"maintainers": [{ "name": "…", "email": "…" }],
	"runtime": { "type": "node22", "api": "nodejs-ipc", "apiVersion": "0.0.0", "entrypoint": "../dist/main.js" },
	"legacyIds": [],
	"manufacturer": "…",
	"products": ["…"],
	"keywords": []
}
```

- `id` is the stable module identifier (and the id used in preset variable refs).
- `entrypoint` points at the **compiled** `dist/main.js`, not the source.
- `runtime.type` must match the Node version you build/lint against (see CI).
- **`version` lives here AND in `package.json`.** Both must be bumped together on
  release — see gotchas.

---

## 7. Toolchain & config files

**Package manager: Yarn 4 via Corepack.** `package.json` pins it:

```json
{ "packageManager": "yarn@4.x", "engines": { "node": "^22.x", "yarn": "^4" } }
```

`.yarnrc.yml` uses the node-modules linker (not PnP) and, in current templates, adds
supply-chain gates:

```yaml
nodeLinker: node-modules
enableScripts: false
npmMinimalAgeGate: 3d
npmPreapprovedPackages:
  - '@companion-module/*'
```

**`package.json` scripts** (2.x template; `run` is Yarn's script runner —
equivalent to calling the named script):

```json
{
	"postinstall": "husky",
	"format": "prettier -w .",
	"build:main": "tsc -p tsconfig.build.json",
	"build": "rimraf dist && run build:main",
	"dev": "tsc -p tsconfig.build.json --watch",
	"lint:raw": "eslint",
	"lint": "run lint:raw .",
	"package": "run build && companion-module-build"
}
```

(1.x templates call `yarn build` / `yarn lint:raw` instead of `run …`.)

**TypeScript** is split in two:

- `tsconfig.build.json` — extends the tools' recommended base, `include: src/**/*.ts`,
  emits to `dist/`. This is what `tsc` compiles for the build.
- `tsconfig.json` — extends the build config, used by the editor/typecheck; adds
  `types` and can widen `include`.

**ESLint** is a thin wrapper over the tools' shared flat config:

```js
import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'
export default generateEslintConfig({ enableTypescript: true })
```

The tools preset is **type-aware** — it runs rules that need the TypeScript program,
so lint can fail on things `tsc` alone accepts (see gotchas). **Prettier** config is
referenced from the tools package (`"prettier": "@companion-module/tools/.prettierrc.json"`),
and **husky + lint-staged** run `eslint --fix` / `prettier` on staged files
pre-commit.

---

## 8. Build & package flow

```
corepack enable                 # activate the pinned Yarn 4
yarn install                    # install deps (generates lockfile if absent)
yarn build                      # rimraf dist + tsc -p tsconfig.build.json  → dist/
yarn package                    # build + companion-module-build            → pkg / *.tgz
```

- `yarn build` **only type-checks and emits**; it does **not** run the type-aware
  lint rules. A green build is necessary but not sufficient — CI also runs lint.
- `companion-module-build` (from `@companion-module/tools`) bundles `dist/` +
  `companion/` into the distributable package for install/marketplace.
- **Passing build + lint locally is still not sufficient** — the real validator is
  the module loaded into Companion against the live target. Spec/docs behaviour and
  device runtime behaviour diverge; verify on real hardware.

---

## 9. Continuous integration

Two workflows ship with the template:

**`node.yaml` — the gate you'll hit most.** On every push/PR/tag it:
`corepack enable` → `yarn install` → **`yarn build`** (types) → **`yarn lint`**.
Both build and lint must pass. Node version in `setup-node` must match
`manifest.json` `runtime.type`.

**`companion-module-checks.yaml`** — calls Bitfocus's reusable
`module-checks.yaml` to validate the package/manifest against marketplace rules.
(Modules distributed outside the marketplace may drop this; keep `node.yaml`.)

---

## 10. Gotchas & hard-won rules

These are the things that pass local checks or "look right" and still break. They
are the highest-value content to bake into a project `CLAUDE.md`.

**Build-green ≠ lint-green.** `tsc` does not run the type-aware ESLint rules. CI
runs both, so these only surface in CI (or `yarn lint`):

- `@typescript-eslint/await-thenable` — `await` on a non-Promise (e.g. `await
this.saveConfig(...)`; `saveConfig` is synchronous). Remove the `await`.
- `@typescript-eslint/no-misused-promises` — an async callback passed where a
  `void` return is expected, typically `setInterval(async () => {…})`. Wrap it:
  `setInterval(() => { void (async () => {…})() }, ms)`.
- `@typescript-eslint/no-unnecessary-type-assertion` — a redundant `as X` (often
  `as any` on an already-`any` value). Remove it. Removing an assertion can orphan
  an import — delete that too.
- `@typescript-eslint/no-base-to-string` — interpolating an object that stringifies
  to `[object Object]`. `JSON.stringify(x)` or narrow the type.
- `@typescript-eslint/promise-function-async` — a function returning a Promise
  isn't declared `async`. Add `async` (auto-fixable).

Most are auto-fixable: run `yarn lint --fix`, then hand-fix the residue
(`await-thenable`, `no-misused-promises` especially — they sit on async/poll paths,
so read them rather than blindly silencing).

**ESLint flat-config ignores.** To exclude paths (e.g. archived versions), add a
config object whose **only** key is `ignores` — that makes it a _global_ ignore:

```js
export default [{ ignores: ['old-versions/**'] }, ...baseConfig]
```

If you spread the tools preset directly (`export default generateEslintConfig(...)`)
you must wrap it in an array to add the ignore object. Also: a **missing final
newline** on `eslint.config.mjs` itself trips `prettier/prettier` — the config file
is linted too.

**Version lives in two files.** `package.json` **and** `companion/manifest.json`.
Bump both on every release or the installed version disagrees with the package.

**`repository` / `bugs` must match the real repo.** Mismatched URLs cause CI
failures (git exit-128 in some steps). Keep them aligned with the actual GitHub repo
name.

**`saveConfig` is synchronous** — don't `await` it (triggers `await-thenable`).

**Preset variable refs use the module id**, not a connection label — Companion
substitutes it. For live-label-dependent text, use `self.label` at generation time.

**Advanced vs boolean feedback:** dynamic _text/colour_ → advanced (return a style);
on/off _style_ → boolean. Always give advanced feedbacks a fallback so buttons never
render blank.

**Poll model & state cache.** A common pattern is a periodic poll (e.g. full state
at a slow interval, a hot value faster) storing the last response in a state object;
feedbacks/variables read from that cache. Grid/positional lookups are safe against
a slightly stale cache (positions are stable), but _selection/liveness_ flags in the
cache can lag — read those from a live GET when correctness matters. Swallow poll
errors quietly, but add logging when chasing intermittent/environment-specific bugs.

**Change isolation.** One logical change per version; certify on the live target
before the next. Never combine a framework migration (e.g. 1.x→2.x) with feature
work — compounding change sources make failures ambiguous. When a baseline goes
unstable, rebuild forward from the last certified version rather than patching
forward.

**Spec ≠ runtime.** Vendor API specs/swagger and live device behaviour diverge
(enum spellings, value units, fields that are read-only on write, response shapes).
Confirm against the live device/console, not spec inference. Choice/enum parameters
in particular may accept a _value string_ but ignore an _index_ on write, or vice
versa — verify which.

---

## 11. New-module assembly checklist

1. Start from `bitfocus/companion-module-template-ts` (current, 2.x) — or an
   existing 1.x module if matching a legacy codebase.
2. Set identity: `manifest.json` (`id`, `name`, `shortname`, `manufacturer`,
   `products`, `repository`, `bugs`), and `package.json` (`name`, `repository`).
   Keep repo URLs consistent.
3. Define `ModuleConfig` + `GetConfigFields` for the connection settings.
4. Implement `init` / `configUpdated` / `destroy`: open transport, register
   definitions, start polling, tear down cleanly.
5. Build out actions → feedbacks → variables → presets, one block at a time.
6. `corepack enable && yarn install`, then iterate with `yarn dev` (watch).
7. Gate every change on **`yarn build` + `yarn lint`** locally before pushing.
8. **Verify in a running Companion against the real target** — the definitive test.
9. Bump `version` in **both** `package.json` and `manifest.json`; `yarn package`.
10. Add upgrade scripts whenever a config/action/feedback shape changes
    (append-only).

---

## 12. What is (and isn't) the value

The module _structure_ — file layout, lifecycle wiring, the definition blocks,
toolchain, CI — is boilerplate and portable; this document captures it so it never
has to be re-derived. The durable value of any given module is the **domain logic**:
the state model, the control/queue/preset engine, the formatting and mapping between
Companion and the device. When deriving a project `CLAUDE.md` from this file, keep
the structural rules generic and layer the project's domain logic separately — don't
bake proprietary engine logic into a reusable scaffold.

---

### Reference

- Upstream template: `github.com/bitfocus/companion-module-template-ts`
- API surface: `@companion-module/base` (`InstanceBase` + definition types)
- Tooling: `@companion-module/tools` (eslint preset, tsconfig bases,
  `companion-module-build`, prettier config)
