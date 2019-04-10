# deadcode

Deadcode shows you source files that are not required anywhere given entry point scripts.

## Summary

### What it does

Deadcode list all files not required anywhere in your project and let you remove them.

### What it does not

#### Dynamic requires

Deadcode will ignore dynamic requires but will provide you with a list of files that contain them.

#### Reassigned requires

Deadcode look for import declarations and calls of the _require_ function. In other word if you assign _require_ to another var and use it to load a dependency, it will not handle it.

### Installation

```
$ npm add deadcode --save-dev
```

## Usage

<pre>
$ deadcode --list-all
<span style="color:blue">info</span> 5 dependencies found
├─ /Users/dead-code/demo/index.js
├─ /Users/dead-code/demo/a.js
├─ fs
├─ /Users/dead-code/demo/b.js
└─ /Users/dead-code/demo/c.js
<span style="color:yellow">warning</span> 1 files with dynamic dependencies found
└─ /Users/dead-code/demo/a.js
<span style="color:yellow">warning</span> 1 ignored dependencies found
└─ /Users/dead-code/node_modules/@babel/core/lib/index.js
<span style="color:green">success</span> 0 unparsed dependencies found
<span style="color:green">success</span> 0 unresolved dependencies

<span style="color:yellow">warning</span> <strong>1 dead files found</strong>
└─ /Users/dead-code/demo/d.js
</pre>

You can get help with:

```
$ deadcode --help
```

### Options

- **config**: config file to use
- **entry**: array of entry point files
- **ignore**: array of pattern matching files to ignore
- **src**: array of pattern matching source files

### How to provide options

Options could be:

- provided as command options:
  ```
  $ deadcode --ignore="**/node_modules/**,**/__tests__/**"
  ```
- loaded from file using the command option `config`:
  ```
  $ deadcode --config=".deadcoderc"
  ```
- read from the `deadcode` property of your package.json:
  ```
  {
    "deadcode": {
      "ignore": ["**/node_modules/**"]
    }
  }
  ```

### Good to know

You should know that:

- Command options override options in config file.
- Config file options override options in package.json.
- If no entry is provided, the `main` property of your package.json will be used.

## Todo

- resolve dynamic import when possible
- handle reassigned require
- look for dead code in living files
