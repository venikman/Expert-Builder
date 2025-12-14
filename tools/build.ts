import { rm } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client with rsbuild...");
  const { createRsbuild } = await import("@rsbuild/core");
  const { pluginReact } = await import("@rsbuild/plugin-react");

  const rsbuild = await createRsbuild({
    rsbuildConfig: {
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
        },
      },
      html: {
        template: "./client/index.html",
      },
      server: {
        publicDir: {
          name: "./client/public",
          copyOnBuild: true,
        },
      },
      output: {
        distPath: {
          root: "dist/public",
        },
      },
    },
  });

  await rsbuild.build();

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

