#!/usr/bin/env node
import program from "commander";
import chalk from "chalk";
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

const onTraverseFile = filename => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${chalk.blue("info")} ${++traversedCursor} files traversed`
  );
};
const willTraverseFiles = () => {
  process.stdout.write(`${chalk.blue("info")} 0 files traversed`);
};
const didTraverseFiles = () => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};
const logInfo = title => {
  console.log(chalk.blue("info"), title);
};
const logWarning = title => {
  console.warn(chalk.yellow("warning"), title);
};
const logSuccess = title => {
  console.log(chalk.green("success"), title);
};
const logDependencyItem = (dependency, key, list) => {
  console.log(list.length - 1 === key ? "└─" : "├─", dependency);
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
      didTraverseFiles();
      logInfo(`${dependencies.length} dependencies found`);

      if (dynamicDependencies.length) {
        logWarning(
          `${dynamicDependencies.length} dynamic dependencies found in:`
        );
        dynamicDependencies.map(logDependencyItem);
      } else {
        logSuccess("0 dynamic dependencies found");
      }

      if (ignoredDependencies.length) {
        logWarning(`${ignoredDependencies.length} ignored dependencies found:`);
        ignoredDependencies.map(logDependencyItem);
      }

      if (unparsedDependencies.length) {
        logWarning(
          `${unparsedDependencies.length} unparsed dependencies found:`
        );
        unparsedDependencies.map(logDependencyItem);
      }

      if (unresolvedDependencies.length) {
        logWarning(`${unresolvedDependencies.length} unresolved dependencies:`);
        unresolvedDependencies.map(logDependencyItem);
      }

      if (deadFiles.length) {
        logWarning(deadFiles.length, "dead files found:");
        deadFiles.map(logDependencyItem);
      } else {
        logSuccess("0 dead files found");
      }

      process.exit(deadFiles.length ? 1 : 0);
    }
  )
  .catch(console.log);
