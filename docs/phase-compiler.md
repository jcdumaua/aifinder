# AiFinder Phase Compiler

The Phase Compiler is deterministic, static governance tooling. It converts an authored phase specification and a separately collected repository snapshot into a fixed, phase-prefixed review bundle. It does not invent scope or authority, and it never executes compiled phase commands.

## Architecture

The compiler keeps authority-bearing inputs separate from derived evidence:

- `phase-spec.schema.json`, `repository-snapshot.schema.json`, `canonical.mjs`, `schema-validator.mjs`, and `phase-spec.mjs` strictly parse, normalize, bound, and deep-freeze authored inputs.
- `repository-snapshot-adapter.mjs` is the only repository/Git adapter. It reads only declared tracked paths and bounded Git status metadata, rejects unsafe links and traversal, and writes a new mode-0600 snapshot outside the repository.
- `command-dependency-validator.mjs`, `semantic-validator.mjs`, `governance-validator.mjs`, and `operation-contract-validator.mjs` form the pure validation core. All authority-critical failures are fatal.
- `deterministic-renderer.mjs` renders only fixed artifact functions. There are no arbitrary templates, plugins, autonomous planning steps, or executable render hooks.
- `external-bundle-writer.mjs` and `compiled-bundle-verifier.mjs` define the external publication and verification boundary. The CLI delegates to those components without running any phase command.

Authored input contains intent and authority. Counts, inventories, identities, commitments, token text, output names, and other derived values are rejected when authored and computed only after validation.

## CLI

The exact commands are:

```text
node testing/phase-compiler/cli.mjs validate <phase-spec.json> <repository-snapshot.json>
node testing/phase-compiler/cli.mjs compile <phase-spec.json> <repository-snapshot.json> --out <new-external-directory> [--zip]
node testing/phase-compiler/cli.mjs verify <compiled-directory>
node testing/phase-compiler/cli.mjs explain <error-code>
```

`validate` and `compile` consume an authored spec plus an independently collected snapshot. `verify` checks an already compiled directory. `explain` returns a stable diagnostic description. None of these commands executes a command declared by the phase.

Snapshot collection is intentionally separate:

```text
node testing/phase-compiler/repository-snapshot-adapter.mjs collect <phase-spec.json> --repo <absolute-repo> --out <new-external-snapshot.json>
```

The operator authors the spec first, then collects the bounded snapshot, validates, compiles to a new external directory, and verifies the result before review. Snapshot evidence is sanitized: canonical outputs bind approved identities and projections, not repository source text or an absolute repository root.

Repository inspection runs every Git command through a fixed `/usr/bin/python3 -I -S` bridge that changes directory with the retained repository descriptor, closes that descriptor before `execve`, and executes fixed `/usr/bin/git` with bounded output, fixed arguments and environment, fsmonitor suppression, and no shell. Repository-snapshot publication uses a separate fixed Python bridge. The adapter retains a no-follow descriptor for the snapshot output's parent directory, creates the new snapshot exclusively with descriptor-relative operations, and verifies its mode, link count, bytes, hash, and descriptor/path identity before reporting success. If `/usr/bin/python3` or either required helper capability is unavailable, inspection or publication fails closed with `COMPILER_CAPABILITY_UNAVAILABLE`; it does not fall back to a shell, a path-following Git working directory, a path-following write, or a replace operation.

## Deterministic outputs and approval isolation

Canonical filenames are phase-prefixed. The compiler produces nine canonical files, including the token-free Codex package, the Gemini review package, a manifest, and a phase-prefixed checksum file. Canonical JSON uses byte-sorted object keys, two-space indentation, and exactly one final LF. Sequence fields retain authored order while set-like fields use their defined canonical ordering.

The Authority IR commitment is reconstructed from the complete normalized phase specification, the canonical sanitized repository-snapshot evidence, and the compiler-derived executable-analysis profile identity and version. The executable profile is not authored input: it is imported from the closed command-dependency validator by both compilation and verification, so a profile change necessarily changes the Authority IR commitment. The commitment therefore binds every normalized authority field, including commands, operation budgets, rollback, target-confirmation, Git, governance, scope, artifact policy, compatibility and state contracts, plus the snapshot digest, compiler-derived dependency facts, and the exact executable profile. Its independently recomputed projection also records the phase-global operation-charge aggregate and governance contract. That aggregate uses the same rule as operation validation: the sum of command charges plus the larger of the true/false branch charges for every conditional scope, across all six operation keys. Compilation and verification use the same canonical derivation; verification never trusts a digest merely extracted from the retained Codex text. A phase-spec alteration, omitted or stale executable profile, retained command-only aggregate, or older Authority IR commitment paired with self-consistently refreshed manifest/checksum bytes cannot retain the prior Codex, Gemini package, or approval token.

The token-free Codex package is self-contained: it embeds the complete canonical normalized phase specification and the exact canonical sanitized repository-snapshot evidence bytes, including all scope, command, budget, rollback, target-confirmation, Git, state, governance, compatibility, conditional-scope, external-resource, and repository contracts. An executor or reviewer can reconstruct the complete declared authority from that one package without consulting any sibling artifact. The standalone phase-spec and snapshot files remain byte-identical evidence copies, not undeclared authority dependencies.

The self-contained Codex package is rendered first and hashed as raw bytes. A domain-separated approval basis then derives the approval token. That token appears exactly once in the Gemini package and nowhere else: not in any other canonical file, filename, manifest value, checksum content, ZIP name, ZIP comment, or ZIP extra field. The manifest stores only the approval contract identifier and the token SHA-256 commitment. The Gemini package embeds every exact Codex package byte, so Gemini reviews the same self-contained bytes later supplied to Codex.

The external writer requires a destination that does not exist and is outside the repository and `.git`. It opens the normalized destination parent once with `O_NOFOLLOW|O_DIRECTORY` and retains that descriptor and exact device/inode identity through the complete operation. A fixed, isolated, bounded `/usr/bin/python3 -I -S` bridge receives that parent as child descriptor 3. Unique mode-0700 sibling temporary-directory creation, exclusive mode-0600 artifact creation, descriptor-relative reread/hash/mode/link verification, atomic no-replace publication, and optional exclusive ZIP creation all use basenames plus `dir_fd`/`openat`-style operations against that descriptor. Publication uses `renameatx_np(..., RENAME_EXCL)` on Darwin or `renameat2(..., RENAME_NOREPLACE)` on Linux with the same parent descriptor for source and destination. Node rechecks the bound descriptor against the parent pathname before and after each major stage and immediately before descriptor-bound final semantic verification. Parent-path replacement therefore fails closed and cannot redirect any compiler write into the replacement directory. The bridge has a fixed interpreter, program, argument-vector protocol, environment, no shell, a 4 KiB combined child-output bound, and a five-second timeout; raw child output is never exposed. A competing final path is never deleted, replaced, or overwritten. On a failed invocation, invocation-owned partial output remains for explicit inspection and cleanup. ZIP output is optional transport only, is created after canonical-directory verification, must have the exact phase-bound sibling name, and never defines canonical identity.

External bundle publication is supported only on Darwin when `renameatx_np(..., RENAME_EXCL)` is available or on Linux when `renameat2(..., RENAME_NOREPLACE)` is available. Both supported platforms also require an executable `/usr/bin/python3` with the standard-library modules used by the fixed bridge. Missing interpreter or native no-replace support fails with the stable `COMPILER_CAPABILITY_UNAVAILABLE` diagnostic; the compiler never falls back to a clobbering rename or a shell. Pure parsing, validation, and rendering do not require this publication bridge.

Compiled-directory verification enumerates and reads artifacts through a retained no-follow directory descriptor using the fixed, isolated, bounded `/usr/bin/python3 -I -S` bridge; ZIP verification reads from one retained no-follow ZIP descriptor. The writer compares semantic verifier identities with the in-memory canonical identity and then descriptor-reverifies the intended directory and ZIP bytes, so directory or ZIP pathname ABA substitution fails closed. The verifier also applies pre/post descriptor identity checks, bounded reads, and post-read path identity checks. It verifies the exact phase-prefixed artifact set, bytes, hashes, sizes, modes, link counts, LF/CR rules, final markers, token occurrence policy, embedded Codex bytes, manifest/checksum relationships, compiler-derived sanitized dependency evidence, and bounded ZIP metadata when present. Canonical phase-spec, snapshot, manifest, leaf-entry, identity, and checksum structures are closed and shape-checked before dereference; malformed null, array, object, or wrong-entry values produce stable diagnostics rather than raw exceptions.

The CLI applies the same descriptor-bound, no-follow, size-bounded read discipline to authored phase-spec and repository-snapshot inputs. Phase specs enter through `parsePhaseSpec`, so duplicate keys and closed-schema failures retain their exact diagnostics. CLI compilation and verification remain static: even a valid command-bearing synthetic phase is rendered and verified without executing its declared command.

## Tests and repository policy

Run the compiler suite with:

```text
npm run test:phase-compiler
```

The three child tests run in this order:

1. `phase-compiler.test.mjs` covers strict schemas, canonicalization, snapshot collection, semantic/governance/operation validation, dependency closure, P01-P03, and N01-N23.
2. `phase-compiler-security.test.mjs` covers new-only output, confinement, link/mode/race/tamper defenses, ZIP binding, CLI behavior, sanitized failures, and cleanup.
3. `phase-compiler-determinism.test.mjs` compiles the same synthetic phase twice in separate `/tmp` destinations and compares all nine canonical files byte-for-byte while proving that optional ZIP transport changes no canonical identity.

All fixtures are local, synthetic, no-network, no-secret, no-browser, and no-database. The static safety manifest classifies the three tests as `RUN_POLICY`; pure modules, schemas, and fixtures as `VALIDATE_ONLY`; and the repository snapshot adapter, CLI, and external writer as `DENY` outside the dedicated bounded compiler lane. The static runner pins the three test source identities and exact import allowlists before running them.

## Limitations and next authority

This MVP compiles only the fixed supported schema, validators, renderers, and operation model. It cannot infer missing authority, accept arbitrary schemas or templates, execute a compiled plan, read live services, or prove runtime/deployment/database behavior. Compatibility adapters must be explicit and versioned; unknown or unproven dependencies fail closed.

Migrating an existing phase to compiler-produced artifacts is a later authority class. It requires a separately reviewed implementation package that selects the phase, supplies authored input and repository snapshot evidence, validates compatibility, and authorizes any operational execution. This implementation itself performs no live operation, deployment, publishing, reactivation, or launch.
