import { parseAsync, DEFAULT_EXTENSIONS } from "@babel/core";
import * as babel from "@babel/core";
import fs from "fs";
import path from "path";
import glob from "glob";

import traverse from "./traverse";

const promisify = func => (...args) =>
  new Promise((resolve, reject) => {
    func(...args, (error, ...rest) => {
      if (error) {
        reject(error);
      } else {
        resolve(...rest);
      }
    });
  });

const readFileAsync = promisify(fs.readFile);
const globAsync = promisify(glob);

const getDeadFiles = async ({
  entry = [],
  include = DEFAULT_EXTENSIONS.map(ext => `${process.cwd()}/**${ext}`),
  ignore = ["**/node_modules/**"]
}) => {
  const {
    dependencies,
    dynamicDependencies,
    unparsedDependencies,
    unresolvedDependencies
  } = await getDependencies(entry);
  const includedFiles = await getIncludedFiles(include, ignore);
  const deadFiles = includedFiles.filter(
    file => dependencies.indexOf(file) === -1
  );

  return {
    deadFiles,
    dependencies,
    dynamicDependencies,
    unparsedDependencies,
    unresolvedDependencies
  };
};

const getDependencies = async entry => {
  const traverseStack = await Promise.all(
    []
      .concat(entry)
      .map(filename => require.resolve(path.resolve(process.cwd(), filename)))
  );
  const dependencies = [];
  const dynamicDependencies = [];
  const unparsedDependencies = [];
  const unresolvedDependencies = [];

  const traverseNext = async () => {
    if (!traverseStack.length) {
      return;
    }

    const filename = traverseStack[0];
    const dirname = path.dirname(filename);
    const src = await readFileAsync(filename, "UTF-8").catch(() => {});
    let res;

    try {
      const ast = await parseAsync(src, { filename });
      res = traverse(ast);
    } catch {
      unparsedDependencies.push(filename);
    }

    traverseStack.shift();
    dependencies.push(filename);

    if (res) {
      res.dependencies.forEach(dependency => {
        let filename;

        try {
          if (dependency.match(/^[.\/]/)) {
            filename = require.resolve(path.join(dirname, dependency));
          } else {
            filename = require.resolve(dependency);
          }
        } catch (error) {
          unresolvedDependencies.push(filename);
          return;
        }

        if (
          traverseStack.indexOf(filename) === -1 &&
          dependencies.indexOf(filename) === -1
        ) {
          traverseStack.push(filename);
        }
      });

      if (res.dynamicDependencies.length) {
        dynamicDependencies.push(filename);
      }
    }

    await traverseNext();
  };

  await traverseNext();

  return {
    dependencies,
    dynamicDependencies,
    unparsedDependencies,
    unresolvedDependencies
  };
};

const getIncludedFiles = async (include, ignore) => {
  const files = [];

  await Promise.all(
    [].concat(include).map(async pattern => {
      (await globAsync(pattern, {
        ignore,
        realpath: true,
        nodir: true
      })).forEach(file => {
        if (files.indexOf(file) === -1) {
          files.push(file);
        }
      });
    })
  );

  return files;
};

export default getDeadFiles;
