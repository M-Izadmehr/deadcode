#!/usr/bin/env node
import program from "commander";
import getDeadFiles from "./index";
import fs from "fs";

const list = arg => arg.split(",");

program
  .version("0.2.0")
  .option("-c, --config <config>", "Config file", entry =>
    JSON.parse(fs.readFileSync(entry, "utf-8"))
  )
  .option("-s, --entry <entry>", "Entry point files", list)
  .option("-e, --exclude <exclude>", "Files to ignore (glob pattern(s))", list)
  .option("-i, --src <src>", "Files to check (glob pattern(s))", list)
  .parse(process.argv);

const { src, exclude, config } = program;
let { entry } = program;
let cwdPackage;

try {
  cwdPackage = JSON.parse(fs.readFileSync("./package.json", "utf8"));
} catch {}

if (!entry) {
  if (cwdPackage && cwdPackage.main) {
    entry = `./${cwdPackage.main}`;
  } else {
    console.error("No entrypoint found");
    process.exit(1);
  }
}

getDeadFiles({
  ...((cwdPackage && cwdPackage.deadcode) || {}),
  ...(config || {}),
  entry,
  include: src,
  exclude
})
  .then(
    ({
      deadFiles,
      dependencies,
      dynamicDependencies,
      unparsedDependencies,
      unresolvedDependencies
    }) => {
      console.log(`${dependencies.length} dependencies found`);

      if (dynamicDependencies.length) {
        console.warn(
          `\n${dynamicDependencies.length} dynamic dependencies found in:`
        );
        dynamicDependencies.map(filename => console.log(`  ${filename}`));
      } else {
        console.log("\nno dynamic dependencies found");
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
