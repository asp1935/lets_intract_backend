   // build.js
import { build } from "esbuild";
import {nodeExternalsPlugin} from "esbuild-node-externals";

build({
  entryPoints: ["./src/server.js"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/server.js",
  external: ["express", "dotenv"], // don't bundle these
  target: "node18", // or your preferred Node version
  plugins: [nodeExternalsPlugin()],
  loader: {
    ".json": "json",
  },
}).catch(() => process.exit(1));
