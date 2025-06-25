import browserSync from "@rbnlffl/esbuild-plugin-browser-sync";
import esbuild from "esbuild";
import { exec } from "node:child_process";
import path from "node:path";
import { esbuildCfg } from "./esbuild.build.mjs";

const context = await esbuild.context({
  ...esbuildCfg,
  plugins: [
    browserSync({
      host: "localhost",
      port: 3000,
      server: {
        baseDir: "public",
      },
      injectChanges: false,
      files: [
        {
          match: "css/**/*.css",
          fn: (_, file) =>
            exec(
              `yarn css-minify -f ${file} -o ${path.join("public", "static", "css")}`,
              (err, stdout, stderr) => {
                if (stdout.trim().length > 0) console.log(stdout);
                if (stderr.trim().length > 0) console.error(stderr);
                if (err != null) throw err;
              }
            ),
        },
      ],
    }),
  ],
});

context.watch();
