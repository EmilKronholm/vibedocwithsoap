import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Inside this repo the package is used from source. In your own app you install it and need no alias.
export default defineConfig({
  resolve: { alias: { "@folio/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)) } },
  server: { port: 5192, strictPort: true },
});
