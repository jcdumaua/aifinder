import { register } from "node:module";

// Test-only loader shim for Next.js' server-only marker.
// This applies only to Node tests that opt into this register file.
const serverOnlyTestLoader = new URL(
  `data:text/javascript,${encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export%20%7B%7D%3B",
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
`)}`,
);

register(serverOnlyTestLoader, import.meta.url);
register(new URL("./typescript-extension-loader.mjs", import.meta.url));
