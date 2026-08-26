import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createAdminV1OfficialFirstEnvironmentCredentialLoader,
  readAdminV1OfficialFirstEnvironmentVercelCliAuth,
} from "./admin-v1-official-first-environment-credential-loader.mjs";

const environmentReads = [];
const providerReads = [];
const environment = new Proxy({ ADMIN_PASSWORD: "synthetic-admin" }, {
  get(target, property, receiver) {
    environmentReads.push(property);
    assert.equal(property, "ADMIN_PASSWORD");
    assert.equal(receiver === environment, true);
    return target.ADMIN_PASSWORD;
  },
  ownKeys() {
    throw new Error("ENUMERATION_FORBIDDEN");
  },
});
const loader = createAdminV1OfficialFirstEnvironmentCredentialLoader({
  environment,
  read_provider_auth() {
    providerReads.push("VERCEL_CLI");
    return Buffer.from("synthetic-vercel", "utf8");
  },
});

const environmentValue = await loader.load_environment_value({
  source_contract: {
    key_name: "ADMIN_PASSWORD",
    source_name: "PROCESS_ENV_EXACT_KEY",
  },
});
assert.equal(environmentValue.toString("utf8"), "synthetic-admin");
assert.deepEqual(environmentReads, ["ADMIN_PASSWORD"]);
environmentValue.fill(0);

const firstProviderAuth = await loader.load_provider_auth({
  source_contract: {
    key_name: "token",
    source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  },
});
const secondProviderAuth = await loader.load_provider_auth({
  source_contract: {
    key_name: "token",
    source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
  },
});
assert.equal(firstProviderAuth, secondProviderAuth);
assert.equal(firstProviderAuth.toString("utf8"), "synthetic-vercel");
assert.deepEqual(providerReads, ["VERCEL_CLI"]);

loader.clear_sensitive();
assert.equal(firstProviderAuth.every((value) => value === 0), true);

await assert.rejects(
  loader.load_environment_value({
    source_contract: { key_name: "OTHER", source_name: "PROCESS_ENV_EXACT_KEY" },
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_DENIED",
);
await assert.rejects(
  loader.load_provider_auth({
    source_contract: { key_name: "token", source_name: "PROCESS_ENV_EXACT_KEY" },
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_DENIED",
);

const missing = createAdminV1OfficialFirstEnvironmentCredentialLoader({
  environment: Object.freeze({}),
  read_provider_auth() {
    throw new Error("SHOULD_NOT_RUN");
  },
});
await assert.rejects(
  missing.load_environment_value({
    source_contract: {
      key_name: "ADMIN_PASSWORD",
      source_name: "PROCESS_ENV_EXACT_KEY",
    },
  }),
  (error) => error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
);

const temporaryRoot = realpathSync(mkdtempSync(path.join(
  tmpdir(),
  "aifinder-first-environment-credential-loader-test-",
)));
try {
  const repositoryRoot = path.join(temporaryRoot, "aifinder");
  const credentialDirectory = path.join(
    temporaryRoot,
    "Library",
    "Application Support",
    "com.vercel.cli",
  );
  mkdirSync(repositoryRoot);
  mkdirSync(credentialDirectory, { recursive: true });
  const credentialPath = path.join(credentialDirectory, "auth.json");
  const writeAuth = (value) => writeFileSync(
    credentialPath,
    `${JSON.stringify(value)}\n`,
    { mode: 0o600 },
  );
  const readNative = () =>
    readAdminV1OfficialFirstEnvironmentVercelCliAuth({
      repository_root: repositoryRoot,
    });
  const expectUnavailable = (value) => {
    writeAuth(value);
    assert.throws(
      readNative,
      (error) =>
        error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
    );
  };

  writeAuth({ token: "synthetic-native-vercel" });
  const nativeValue = readAdminV1OfficialFirstEnvironmentVercelCliAuth({
    repository_root: repositoryRoot,
  });
  assert.equal(nativeValue.toString("utf8"), "synthetic-native-vercel");
  nativeValue.fill(0);

  const currentToken = "synthetic-current-vercel";
  const syntheticRefreshToken = "synthetic-refresh-never-returned";
  const futureExpiry = Math.floor(Date.now() / 1000) + 3_600;
  const currentAuth = {
    "// Docs": "synthetic documentation metadata",
    "// Note": "synthetic note metadata",
    expiresAt: futureExpiry,
    refreshToken: syntheticRefreshToken,
    token: currentToken,
    userId: "synthetic-user-id",
  };
  writeAuth(currentAuth);
  const currentValue = readNative();
  assert.equal(currentValue.toString("utf8"), currentToken);
  assert.equal(
    currentValue.includes(Buffer.from(syntheticRefreshToken, "utf8")),
    false,
  );
  currentValue.fill(0);

  let nativeProviderReads = 0;
  writeAuth(currentAuth);
  const nativeLoader = createAdminV1OfficialFirstEnvironmentCredentialLoader({
    environment: Object.freeze({ ADMIN_PASSWORD: "synthetic-admin" }),
    read_provider_auth() {
      nativeProviderReads += 1;
      return readNative();
    },
  });
  const loadedCurrentValue = await nativeLoader.load_provider_auth({
    source_contract: {
      key_name: "token",
      source_name: "AVAILABLE_EXISTING_VERCEL_CLI_SOURCE",
    },
  });
  assert.equal(loadedCurrentValue.toString("utf8"), currentToken);
  assert.equal(nativeProviderReads, 1);
  nativeLoader.clear_sensitive();
  assert.equal(loadedCurrentValue.every((value) => value === 0), true);

  expectUnavailable({
    ...currentAuth,
    expiresAt: Math.floor(Date.now() / 1000) - 1,
  });
  expectUnavailable({ ...currentAuth, unexpected: "denied" });
  const { token: _missingToken, ...missingToken } = currentAuth;
  expectUnavailable(missingToken);
  expectUnavailable({ ...currentAuth, token: 42 });
  expectUnavailable({ ...currentAuth, token: "" });
  expectUnavailable({ ...currentAuth, token: "synthetic\ninvalid" });
  expectUnavailable({ ...currentAuth, refreshToken: 42 });
  expectUnavailable({ ...currentAuth, refreshToken: "" });
  expectUnavailable({ ...currentAuth, refreshToken: "x".repeat(16_385) });
  expectUnavailable({ ...currentAuth, expiresAt: "tomorrow" });
  expectUnavailable({ ...currentAuth, expiresAt: futureExpiry + 0.5 });
  expectUnavailable({
    ...currentAuth,
    expiresAt: Number.MAX_SAFE_INTEGER + 1,
  });
  expectUnavailable({ ...currentAuth, userId: "" });
  expectUnavailable({ ...currentAuth, userId: "synthetic\0invalid" });
  expectUnavailable({ ...currentAuth, userId: "x".repeat(4_097) });
  expectUnavailable({ ...currentAuth, "// Note": 42 });
  expectUnavailable({ ...currentAuth, "// Docs": "synthetic\0invalid" });
  expectUnavailable({ ...currentAuth, "// Note": "x".repeat(4_097) });

  const replacementPath = path.join(credentialDirectory, "replacement.json");
  writeFileSync(replacementPath, '{"token":"synthetic-alias-vercel"}\n', {
    mode: 0o600,
  });
  unlinkSync(credentialPath);
  symlinkSync(replacementPath, credentialPath);
  assert.throws(
    () => readAdminV1OfficialFirstEnvironmentVercelCliAuth({
      repository_root: repositoryRoot,
    }),
    (error) => error?.code === "FIRST_ENVIRONMENT_CREDENTIAL_SOURCE_UNAVAILABLE",
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(
  "PASS_FIRST_ENVIRONMENT_CREDENTIAL_LOADER assertions=36 environment_value_reads=1 provider_auth_reads=2 synthetic_native_provider_reads=1 enumeration=0 provider_calls=0",
);
