var fs = require("fs");
var esprima = require('esprima');

var wrapInArray = function(arg) {
  return Array.isArray(arg) ? arg : [arg];
}

var crawlAst = function(ast, visitNodeFn) {
  nodeActions = {
    "MethodDefinition": function(node) {
      return wrapInArray(node.value);
    },
    "ExpressionStatement": function(node) {
      return wrapInArray(node.expression);
    },
    "ReturnStatement": function(node) {
      return wrapInArray(node.argument);
    },
    "CallExpression": function(node) {
       return wrapInArray(node.arguments);
    },
    "ClassBody": function(node) {
      return wrapInArray(node.body);
    },
    "ClassDeclaration": function(node) {
      return wrapInArray(node.body);
    },
    "VariableDeclaration": function(node) {
      return wrapInArray(node.declarations);
    },
    "FunctionExpression": function(node) {
      return wrapInArray(node.body);
    },
    "BlockStatement": function(node) {
      return wrapInArray(node.body);
    },
    "ForStatement": function(node) {
      return wrapInArray(node.body);
    },
    "JSXElement": function(node) {
      var openingNodes = wrapInArray(node.openingElement);
      var childrenNodes = wrapInArray(node.children);
      var closingNodes = wrapInArray(node.closingElement);

      return openingNodes.concat(childrenNodes).concat(closingNodes);
    },
    "JSXOpeningElement": function(node) {
      return wrapInArray(node.name);
    },
    "JSXClosingElement": function(node) {
      return wrapInArray(node.name);
    }
  }

  nodes = ast.body;

  while (nodes.length > 0) {
    nextNode = nodes.splice(0, 1)[0];

    if (nextNode) {
      visitNodeFn(nextNode);

      var action = nodeActions[nextNode.type];
      if (typeof(action) === 'function') {
        var newNodes = action(nextNode);
        for (var i = 0; i < newNodes.length; i++) {
          nodes.unshift(newNodes[i]);
        }
      }
    }
  }
}

var isReactComponent = function(name) {
  return /^[A-Z]/.test(name);
}

// Return {<componentName>: [<listOfComponentsUsed>]}
var getComponentsUsed = function(jsPath) {
  var code = fs.readFileSync(jsPath).toString();
  var ast = esprima.parse(code, {
    jsx: true,
    sourceType: 'module',
    loc: true,
  });

  jsxElements = [];
  rootComponentName = "";
  crawlAst(ast, function(node) {
    if (node.type === "ClassDeclaration") {
      rootComponentName = node.id.name;
    } else if (node.type === "JSXIdentifier") {
      jsxElements.push(node.name);
    }
  });

  var onlyComponents = jsxElements.filter(isReactComponent);
  return {[rootComponentName]: onlyComponents};
}

//============================MAIN===========================
var dir = "/Users/michaelwest/projects/ambitions/src/components";
var files = fs.readdirSync(dir);
files.forEach(file => {
  var jsxElements = getComponentsUsed(dir + "/" + file);
  console.log(jsxElements);
});
//var jsxElements = getComponentsUsed("app.js");
//console.log(jsxElements);
