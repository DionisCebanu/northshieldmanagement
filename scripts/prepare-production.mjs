
import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve("dist/apps/web");

// Copy the existing Express server into the production output.
await copyFile(
  "apps/web/server.ts",
  resolve(outputDirectory, "server.ts")
);

// Create a JavaScript entry point for Hostinger.
await writeFile(
  resolve(outputDirectory, "server.js"),
  `import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "production";
process.env.BUILD_DIRECTORY = fileURLToPath(new URL(".", import.meta.url));

await import("./server.ts");
`,
  "utf8"
);

// Ensure the deployed JavaScript files are treated as ES modules.
await writeFile(
  resolve(outputDirectory, "package.json"),
  JSON.stringify({ type: "module" }, null, 2),
  "utf8"
);

console.log("Production entry point prepared: dist/apps/web/server.js");
