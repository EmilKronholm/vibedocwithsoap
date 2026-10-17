import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Inside this repo the packages are used from source. In your own app you install them and need no aliases.
const source = (pkg: string) => fileURLToPath(new URL(`../../packages/${pkg}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: { alias: { "@folio/core": source("core"), "@folio/ui": source("ui") } },
  server: { port: 5191, strictPort: true },
});
