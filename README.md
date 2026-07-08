# Roland v160v1 - PBS

A Bitfocus Companion module for the **Roland V-160HD** HD video switcher.

This is a **fork / modernization** of the original MIT-licensed module
[`bitfocus/companion-module-roland-v160hd`](https://github.com/bitfocus/companion-module-roland-v160hd)
by Joseph Adams. The original copyright notice is retained in [LICENSE](LICENSE),
as required by the MIT license. Many thanks to the original author and sponsors.

This fork is a public repository only — it is **not** distributed through the
Bitfocus marketplace.

## What changed in this fork

- Full rewrite to the modern Companion TypeScript module standard
  (`@companion-module/base` 2.x, typed schema, ESM, Yarn 4, flat ESLint config).
- A complete preset library covering every action, organized by category.
- Bug fixes found during the port (see [CHANGELOG.md](CHANGELOG.md)).

The device I/O (TCP port 8023, `DTH:`/`RQH:` text commands) is preserved
byte-for-byte from the original module, except where the original was provably
broken — every wire-affecting change is flagged in the changelog and needs
verification against real hardware before being relied upon.

## Requirements

- Roland V-160HD running firmware 1.04 or higher.
- LAN control enabled with a password/passcode set on the switcher.

## Development

```
corepack enable
yarn install
yarn build      # type-check + emit to dist/
yarn lint       # type-aware lint
yarn package    # build distributable
```

## License

MIT — see [LICENSE](LICENSE).
