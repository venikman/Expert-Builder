import { rm } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client with rsbuild...");
  const { build } = await import("@rsbuild/core");
  const { pluginReact } = await import("@rsbuild/plugin-react");

  await build({
    plugins: [pluginReact()],
    source: {
      entry: {
        index: "./client/src/main.tsx",
      },
    },
    resolve: {
      alias: {
        "@": "./client/src",
        "@shared": "./shared",
        "@assets": "./attached_assets",
      },
    },
    html: {
      template: "./client/index.html",
    },
    output: {
      distPath: {
        root: "dist/public",
      },
    },
  });

  console.log("building server with bun...");
  await Bun.build({
    entrypoints: ["server/index.ts"],
    outdir: "dist",
    target: "bun",
    minify: true,
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  });

  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
