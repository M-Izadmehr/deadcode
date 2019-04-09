#!/usr/bin/env node
import program from "commander";
import getDeadFiles from "./index";
import fs from "fs";

const list = arg => arg.split(",");

program
  .version("0.1.1")
  .option("-s, --src <src>", "Entry point files", list)
  .option("-i, --include <include>", "Files to check (glob pattern(s))", list)
  .option("-e, --exclude <exclude>", "Files to ignore (glob pattern(s))", list)
  .parse(process.argv);

const { include, exclude } = program;
let { src: entry } = program;

if (!entry) {
  try {
    entry = `./${JSON.parse(fs.readFileSync("./package.json", "utf8")).main}`;
  } catch {}

  if (!entry) {
    console.error("No entrypoint found");
    process.exit(1);
  }
}

getDeadFiles({
  entry,
  include,
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
