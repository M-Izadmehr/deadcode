import traverse from "@babel/traverse";

export default ast => {
  const dependencies = [];
  const dynamicDependencies = [];

  traverse(ast, {
    CallExpression(path) {
      if (isRequireCallee(path.node.callee)) {
        if (path.node.arguments[0].type !== "StringLiteral") {
          dynamicDependencies.push(path.node.arguments[0].loc);
        } else {
          dependencies.push(path.node.arguments[0].value);
        }
      }
    },
    ImportDeclaration(path) {
      if (path.node.source.type !== "StringLiteral") {
        dynamicDependencies.push(path.node.source.loc);
      } else {
        dependencies.push(path.node.source.value);
      }
    },
    ExportNamedDeclaration(path) {
      if (path.node.source) {
        if (path.node.source.type !== "StringLiteral") {
          dynamicDependencies.push(path.node.source.loc);
        } else {
          dependencies.push(path.node.source.value);
        }
      }
    }
  });

  return { dependencies, dynamicDependencies };
};

const isRequireCallee = callee => {
  if (callee.type === "Identifier") {
    return callee.name === "require";
  }

  return false;
};
