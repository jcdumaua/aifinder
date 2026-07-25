import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";

const helperPath = "../lib/public-persistence.ts";

if (!existsSync(new URL(helperPath, import.meta.url))) {
  console.log("EXPECTED_FAIL PUBLIC_PERSISTENCE_HELPER_ABSENT");
  console.log("AIFINDER_PHASE_30EM_30EX_PUBLIC_PERSISTENCE cases=0 pass=0 fail=1");
  process.exit(1);
}

let moduleUnderTest;
try {
  const source = readFileSync(new URL(helperPath, import.meta.url), "utf8");
  const emitted = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "public-persistence.ts",
    reportDiagnostics: true,
  });
  if (emitted.diagnostics?.length) {
    throw new Error("fabricated transpilation failure");
  }
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    emitted.outputText,
    "utf8",
  ).toString("base64")}`;
  moduleUnderTest = await import(moduleUrl);
} catch {
  console.log("EXPECTED_FAIL PUBLIC_PERSISTENCE_HELPER_UNSAFE_OR_UNLOADABLE");
  console.log("AIFINDER_PHASE_30EM_30EX_PUBLIC_PERSISTENCE cases=0 pass=0 fail=1");
  process.exit(1);
}

const {
  parsePersistedStringArray,
  readPersistedStringArray,
} = moduleUnderTest;

const standard = {
  maxSerializedLength: 128,
  maxItems: 4,
  maxItemLength: 12,
};

const cases = [
  {
    name: "null returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray(null, standard), []),
  },
  {
    name: "empty raw text returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray("", standard), []),
  },
  {
    name: "whitespace raw text returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray("  ", standard), []),
  },
  {
    name: "malformed JSON returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray("[", standard), []),
  },
  {
    name: "object JSON returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray('{"a":"b"}', standard), []),
  },
  {
    name: "scalar string JSON returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray('"alpha"', standard), []),
  },
  {
    name: "number JSON returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray("7", standard), []),
  },
  {
    name: "boolean JSON returns an empty array",
    run: () => assert.deepEqual(parsePersistedStringArray("true", standard), []),
  },
  {
    name: "mixed string and number array is rejected atomically",
    run: () => assert.deepEqual(parsePersistedStringArray('["a",2]', standard), []),
  },
  {
    name: "null item rejects the full array",
    run: () => assert.deepEqual(parsePersistedStringArray('["a",null]', standard), []),
  },
  {
    name: "empty item after trimming rejects the full array",
    run: () => assert.deepEqual(parsePersistedStringArray('["a","  "]', standard), []),
  },
  {
    name: "overlong serialized input is rejected",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["abcd"]', {
          maxSerializedLength: 7,
          maxItems: 4,
          maxItemLength: 12,
        }),
        [],
      ),
  },
  {
    name: "too many items are rejected",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["a","b","c"]', {
          maxSerializedLength: 128,
          maxItems: 2,
          maxItemLength: 12,
        }),
        [],
      ),
  },
  {
    name: "overlong trimmed item is rejected",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["abcd"]', {
          maxSerializedLength: 128,
          maxItems: 4,
          maxItemLength: 3,
        }),
        [],
      ),
  },
  {
    name: "exact serialized length is accepted",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["A"]', {
          maxSerializedLength: 5,
          maxItems: 4,
          maxItemLength: 12,
        }),
        ["A"],
      ),
  },
  {
    name: "exact item count is accepted",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["a","b"]', {
          maxSerializedLength: 128,
          maxItems: 2,
          maxItemLength: 12,
        }),
        ["a", "b"],
      ),
  },
  {
    name: "exact trimmed item length is accepted",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["abc"]', {
          maxSerializedLength: 128,
          maxItems: 4,
          maxItemLength: 3,
        }),
        ["abc"],
      ),
  },
  {
    name: "accepted items are trimmed",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('[" alpha ","beta"]', standard),
        ["alpha", "beta"],
      ),
  },
  {
    name: "accepted item order is stable",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["third","first","second"]', standard),
        ["third", "first", "second"],
      ),
  },
  {
    name: "duplicates are removed case-insensitively",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["Alpha","ALPHA","beta","BeTa"]', standard),
        ["Alpha", "beta"],
      ),
  },
  {
    name: "first normalized spelling is preserved",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["  MiXeD  ","mixed"]', standard),
        ["MiXeD"],
      ),
  },
  {
    name: "each successful parse returns a fresh array",
    run: () => {
      const first = parsePersistedStringArray('["a"]', standard);
      const second = parsePersistedStringArray('["a"]', standard);
      assert.notStrictEqual(first, second);
      assert.deepEqual(first, ["a"]);
      assert.deepEqual(second, ["a"]);
    },
  },
  {
    name: "throwing getItem returns an empty array",
    run: () =>
      assert.deepEqual(
        readPersistedStringArray(
          {
            getItem() {
              throw new Error("fabricated storage failure");
            },
          },
          "fabricated-key",
          standard,
        ),
        [],
      ),
  },
  {
    name: "synthetic unicode strings are accepted and trimmed",
    run: () =>
      assert.deepEqual(
        parsePersistedStringArray('["  工具  ","ÅI"]', standard),
        ["工具", "ÅI"],
      ),
  },
  {
    name: "storage reader matches direct parser behavior",
    run: () => {
      const raw = '[" Alpha ","ALPHA","beta"]';
      const direct = parsePersistedStringArray(raw, standard);
      const stored = readPersistedStringArray(
        { getItem: (key) => (key === "fabricated-key" ? raw : null) },
        "fabricated-key",
        standard,
      );
      assert.deepEqual(direct, ["Alpha", "beta"]);
      assert.deepEqual(stored, ["Alpha", "beta"]);
    },
  },
];

let passCount = 0;
let failCount = 0;

for (const testCase of cases) {
  try {
    await testCase.run();
    passCount += 1;
    console.log(`PASS ${testCase.name}`);
  } catch {
    failCount += 1;
    console.log(`FAIL ${testCase.name}`);
  }
}

console.log(
  `AIFINDER_PHASE_30EM_30EX_PUBLIC_PERSISTENCE cases=${cases.length} pass=${passCount} fail=${failCount}`,
);

if (failCount > 0) process.exitCode = 1;
