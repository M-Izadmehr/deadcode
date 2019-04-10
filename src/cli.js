#!/usr/bin/env node
import program from "commander";
import getDeadFiles from "./index";
import fs from "fs";
import path from "path";

const list = arg => arg.split(",");

program
  .version("0.3.2")
  .option("-c, --config <config>", "Config file", entry =>
    JSON.parse(fs.readFileSync(path.resolve(process.cwd(), entry), "utf-8"))
  )
  .option("-e, --entry <entry>", "Entry point files", list)
  .option("-i, --ignore <ignore>", "Files to ignore (glob pattern(s))", list)
  .option("-s, --src <src>", "Files to check (glob pattern(s))", list)
  .parse(process.argv);

const fileConfig = program.config || {};
let packageConfig;

try {
  packageConfig =
    JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "./package.json"), "utf8")
    ).deadcode || {};
} catch {}

const config = {
  include: program.src || fileConfig.src || packageConfig.src,
  entry: program.entry || fileConfig.entry || packageConfig.entry,
  ignore: program.ignore || fileConfig.ignore || packageConfig.ignore
};

if (!config.entry) {
  if (cwdPackage && cwdPackage.main) {
    config.entry = `./${cwdPackage.main}`;
  } else {
    console.error("No entrypoint found");
    process.exit(1);
  }
}

let traversedCursor = 0;
process.stdout.write(`${++traversedCursor} files traversed`);

const onTraverseFile = filename => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${++traversedCursor} files traversed`);
};
const didTraverseFile = () => {
  process.stdout.write("\n");
};

getDeadFiles({
  onTraverseFile,
  ...config
})
  .then(
    ({
      deadFiles,
      dependencies,
      dynamicDependencies,
      unparsedDependencies,
      unresolvedDependencies,
      ignoredDependencies
    }) => {
      didTraverseFile();
      console.log(`${dependencies.length} dependencies found`);

      if (dynamicDependencies.length) {
        console.warn(
          `\n${dynamicDependencies.length} dynamic dependencies found in:`
        );
        dynamicDependencies.map(filename => console.log(`  ${filename}`));
      } else {
        console.log("\nno dynamic dependencies found");
      }

      if (ignoredDependencies.length) {
        console.warn(
          `\n${ignoredDependencies.length} ignored dependencies found:`
        );
        ignoredDependencies.map(filename => console.log(`  ${filename}`));
      }

      if (unparsedDependencies.length) {
        console.warn(
          `\n${unparsedDependencies.length} unparsed dependencies found:`
        );
        unparsedDependencies.map(filename => console.log(`  ${filename}`));
      }

      if (unresolvedDependencies.length) {
        console.warn(
          `\n${unresolvedDependencies.length} unresolved dependencies:`
        );
        unresolvedDependencies.map(filename => console.log(`  ${filename}`));
      }

      if (deadFiles.length) {
        console.log(`\n${deadFiles.length} dead files found:`);
        deadFiles.map(filename => console.log(`  ${filename}`));
      } else {
        console.log("\nno dead files found");
      }

      process.exit(deadFiles.length ? 1 : 0);
    }
  )
  .catch(console.log);
