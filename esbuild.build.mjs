import * as esbuild from "esbuild";

const isDevelopment =
  process.env.NODE_ENV != null ? process.env.NODE_ENV === "development" : true;

export const esbuildCfg = {
  entryPoints: ["src/index.ts"],
  outfile: "public/static/js/bundle.js",
  sourcemap: isDevelopment,
  bundle: true,
  minify: true,
};

esbuild.buildSync(esbuildCfg);
