import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

function getFileSummary(sourceFile) {
  const leadingCommentRanges = sourceFile.getLeadingCommentRanges();
  if (leadingCommentRanges.length > 0) {
    return leadingCommentRanges[0]
      .getText()
      .replace(/\/\*\*|\*\/|\/\*|\*\//g, '')
      .replace(/^\s*\*\s?/gm, '')
      .trim();
  }
  return '';
}

function getLocalImports(sourceFile) {
  const imports = [];
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (
      moduleSpecifier.startsWith('.') ||
      moduleSpecifier.startsWith('src/') ||
      moduleSpecifier.startsWith('@/')
    ) {
      imports.push(moduleSpecifier);
    }
  }
  return imports;
}

function getInnerCalls(node) {
  const calls = new Set();
  node.forEachDescendant((descendant) => {
    if (descendant.getKind() === SyntaxKind.CallExpression) {
      const expression = descendant.getExpression();
      let text = expression.getText().replace(/\s+/g, ' ').trim();

      // Skip overly long or complex expressions (e.g. inline callbacks/code snippets)
      if (
        text.length > 60 ||
        text.includes('=>') ||
        text.includes('{') ||
        text.includes('}') ||
        text.includes('function')
      ) {
        if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
          text = expression.getName();
        } else {
          return;
        }
      }

      // Filter out basic array/object methods and React built-in hooks
      const ignoredCalls = new Set([
        'map',
        'filter',
        'forEach',
        'reduce',
        'find',
        'push',
        'slice',
        'concat',
        'indexOf',
        'includes',
        'join',
        'split',
        'replace',
        'trim',
        'toLowerCase',
        'toUpperCase',
        'toString',
        'useState',
        'useEffect',
        'useCallback',
        'useMemo',
        'useRef',
        'useContext',
        'useImperativeHandle',
        'useLayoutEffect',
        'console.log',
        'console.error',
        'console.warn',
        'console.info',
      ]);

      if (!text.startsWith('.') && !ignoredCalls.has(text) && text.length > 0) {
        calls.add(text);
      }
    }
  });
  return Array.from(calls);
}

function extractAnnotations(text) {
  const calls = [];
  const listens = [];
  const emits = [];

  if (!text) return { calls, listens, emits };

  // Match @calls <some_target>
  const callsMatches = text.matchAll(/@calls\s+([^\s\n]+)/g);
  for (const match of callsMatches) {
    calls.push(match[1]);
  }

  // Match @listens <some_event>
  const listensMatches = text.matchAll(/@listens\s+([^\s\n]+)/g);
  for (const match of listensMatches) {
    listens.push(match[1]);
  }

  // Match @emits <some_event>
  const emitsMatches = text.matchAll(/@emits\s+([^\s\n]+)/g);
  for (const match of emitsMatches) {
    emits.push(match[1]);
  }

  return { calls, listens, emits };
}

function parseFunction(func) {
  const name = func.getName() || 'anonymous';
  const params = {};
  for (const param of func.getParameters()) {
    params[param.getName()] = param.getType().getText();
  }
  const returns = func.getReturnType().getText();

  const jsdocs = func.getJsDocs();
  let description = '';
  let fullCommentText = '';
  if (jsdocs.length > 0) {
    fullCommentText = jsdocs[0].getText();
    description = jsdocs[0].getDescription().trim();
  } else {
    const comments = func.getLeadingCommentRanges();
    if (comments.length > 0) {
      fullCommentText = comments.map((c) => c.getText()).join('\n');
      description = comments[0]
        .getText()
        .replace(/\/\*\*|\*\/|\/\*|\*|\/\/+/g, '')
        .trim();
    }
  }

  const calls = getInnerCalls(func);
  const annotations = extractAnnotations(fullCommentText);
  const allCalls = Array.from(new Set([...calls, ...annotations.calls]));

  const data = { name };
  if (Object.keys(params).length > 0) data.params = params;
  if (returns && returns !== 'void' && returns !== 'any') data.returns = returns;
  if (description) data.description = description;
  if (allCalls.length > 0) data.calls = allCalls;
  if (annotations.listens.length > 0) data.listens = annotations.listens;
  if (annotations.emits.length > 0) data.emits = annotations.emits;

  return data;
}

function parseVariableFunction(varDecl, initializer) {
  const name = varDecl.getName();
  const params = {};
  for (const param of initializer.getParameters()) {
    params[param.getName()] = param.getType().getText();
  }
  const returns = initializer.getReturnType().getText();

  const varStatement = varDecl.getVariableStatement();
  let description = '';
  let fullCommentText = '';
  if (varStatement) {
    const jsdocs = varStatement.getJsDocs();
    if (jsdocs.length > 0) {
      fullCommentText = jsdocs[0].getText();
      description = jsdocs[0].getDescription().trim();
    } else {
      const comments = varStatement.getLeadingCommentRanges();
      if (comments.length > 0) {
        fullCommentText = comments.map((c) => c.getText()).join('\n');
        description = comments[0]
          .getText()
          .replace(/\/\*\*|\*\/|\/\*|\*|\/\/+/g, '')
          .trim();
      }
    }
  }

  const calls = getInnerCalls(initializer);
  const annotations = extractAnnotations(fullCommentText);
  const allCalls = Array.from(new Set([...calls, ...annotations.calls]));

  const data = { name };
  if (Object.keys(params).length > 0) data.params = params;
  if (returns && returns !== 'void' && returns !== 'any') data.returns = returns;
  if (description) data.description = description;
  if (allCalls.length > 0) data.calls = allCalls;
  if (annotations.listens.length > 0) data.listens = annotations.listens;
  if (annotations.emits.length > 0) data.emits = annotations.emits;

  return data;
}

function parseClass(cls) {
  const name = cls.getName() || 'anonymous';
  const methods = [];

  for (const method of cls.getMethods()) {
    const mName = method.getName();
    const params = {};
    for (const param of method.getParameters()) {
      params[param.getName()] = param.getType().getText();
    }
    const returns = method.getReturnType().getText();
    const calls = getInnerCalls(method);

    const mData = { name: mName };
    if (Object.keys(params).length > 0) mData.params = params;
    if (returns && returns !== 'void' && returns !== 'any') mData.returns = returns;
    if (calls.length > 0) mData.calls = calls;
    methods.push(mData);
  }

  const data = { name, type: 'class' };
  if (methods.length > 0) data.methods = methods;
  return data;
}

function parseInternalHandler(node, name = '') {
  const hName = name || node.getName() || 'anonymous';
  const calls = getInnerCalls(node);

  let description = '';
  let fullCommentText = '';
  const comments = node.getLeadingCommentRanges();
  if (comments.length > 0) {
    fullCommentText = comments.map((c) => c.getText()).join('\n');
    description = comments[0]
      .getText()
      .replace(/\/\*\*|\*\/|\/\*|\*|\/\/+/g, '')
      .trim();
  }

  const annotations = extractAnnotations(fullCommentText);
  const allCalls = Array.from(new Set([...calls, ...annotations.calls]));

  const data = { name: hName };
  if (description) data.description = description;
  if (allCalls.length > 0) data.calls = allCalls;
  if (annotations.listens.length > 0) data.listens = annotations.listens;
  if (annotations.emits.length > 0) data.emits = annotations.emits;
  return data;
}

function getReactInfo(sourceFile) {
  const isTsx = sourceFile.getFilePath().endsWith('.tsx');
  if (!isTsx) return null;

  const allFunctions = [];
  for (const func of sourceFile.getFunctions()) {
    allFunctions.push({ node: func, name: func.getName() });
  }
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    const init = varDecl.getInitializer();
    if (
      init &&
      (init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression)
    ) {
      allFunctions.push({ node: init, name: varDecl.getName() });
    }
  }

  const mainComponent = allFunctions.find((f) => f.name && f.name[0] === f.name[0].toUpperCase());
  if (!mainComponent) return null;

  const componentNode = mainComponent.node;
  const state = [];
  const handlers = [];

  componentNode.forEachDescendant((descendant) => {
    if (descendant.getKind() === SyntaxKind.CallExpression) {
      const expr = descendant.getExpression();
      if (expr.getText() === 'useState') {
        const parent = descendant.getParent();
        if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
          const nameNode = parent.getNameNode();
          if (nameNode.getKind() === SyntaxKind.ArrayBindingPattern) {
            const elements = nameNode.getElements();
            if (elements.length > 0) {
              state.push(elements[0].getText());
            }
          }
        }
      }
    }
  });

  const body = componentNode.getBody();
  if (body) {
    body.forEachChild((child) => {
      if (child.getKind() === SyntaxKind.FunctionDeclaration) {
        const name = child.getName();
        if (
          name &&
          (name.startsWith('handle') ||
            name.startsWith('on') ||
            name.includes('Click') ||
            name.includes('Submit') ||
            name.includes('Change'))
        ) {
          handlers.push(parseInternalHandler(child));
        }
      } else if (child.getKind() === SyntaxKind.VariableStatement) {
        for (const varDecl of child.getDeclarations()) {
          const init = varDecl.getInitializer();
          if (
            init &&
            (init.getKind() === SyntaxKind.ArrowFunction ||
              init.getKind() === SyntaxKind.FunctionExpression)
          ) {
            const name = varDecl.getName();
            if (
              name &&
              (name.startsWith('handle') ||
                name.startsWith('on') ||
                name.includes('Click') ||
                name.includes('Submit') ||
                name.includes('Change'))
            ) {
              handlers.push(parseInternalHandler(init, name));
            }
          }
        }
      }
    });
  }

  return { state, handlers };
}

function getExports(sourceFile) {
  const exports = [];

  for (const func of sourceFile.getFunctions()) {
    if (func.isExported()) {
      exports.push(parseFunction(func));
    }
  }

  for (const varDecl of sourceFile.getVariableDeclarations()) {
    if (varDecl.isExported()) {
      const initializer = varDecl.getInitializer();
      if (
        initializer &&
        (initializer.getKind() === SyntaxKind.ArrowFunction ||
          initializer.getKind() === SyntaxKind.FunctionExpression)
      ) {
        exports.push(parseVariableFunction(varDecl, initializer));
      } else {
        exports.push({
          name: varDecl.getName(),
          kind: 'const',
        });
      }
    }
  }

  for (const cls of sourceFile.getClasses()) {
    if (cls.isExported()) {
      exports.push(parseClass(cls));
    }
  }

  for (const iface of sourceFile.getInterfaces()) {
    if (iface.isExported()) {
      exports.push({
        name: iface.getName(),
        kind: 'interface',
      });
    }
  }

  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (typeAlias.isExported()) {
      exports.push({
        name: typeAlias.getName(),
        kind: 'type',
      });
    }
  }

  for (const en of sourceFile.getEnums()) {
    if (en.isExported()) {
      exports.push({
        name: en.getName(),
        kind: 'enum',
      });
    }
  }

  return exports;
}

function main() {
  console.log('Starting Code Map generation...');
  const tsConfigPath = path.resolve('tsconfig.json');
  console.log(`Using TSConfig: ${tsConfigPath}`);

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');
  console.log(`Found ${sourceFiles.length} source files to analyze.`);

  const mapData = {
    project: 'solve-climb',
    generatedAt: new Date().toISOString(),
    files: {},
  };

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // Skip test files, stories, and scripts themselves
    if (
      relativePath.includes('__tests__') ||
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.') ||
      relativePath.includes('.stories.') ||
      relativePath.startsWith('scripts/')
    ) {
      continue;
    }

    try {
      const fileSummary = getFileSummary(sourceFile);
      const imports = getLocalImports(sourceFile);
      const exports = getExports(sourceFile);
      const reactInfo = getReactInfo(sourceFile);

      const fileData = {};
      if (fileSummary) fileData.summary = fileSummary;
      if (imports.length > 0) fileData.imports = imports;
      if (reactInfo) {
        if (reactInfo.state && reactInfo.state.length > 0) fileData.state = reactInfo.state;
        if (reactInfo.handlers && reactInfo.handlers.length > 0)
          fileData.handlers = reactInfo.handlers;
      }
      if (exports.length > 0) {
        fileData.exports = exports;
      }

      if (Object.keys(fileData).length > 0) {
        mapData.files[relativePath] = fileData;
      }
    } catch (e) {
      console.warn(`[WARNING] Failed to parse file: ${relativePath}. Error: ${e.message}`);
    }
  }

  const yamlOutput = yaml.dump(mapData, { indent: 2, lineWidth: -1, noRefs: true });

  const destPaths = [
    path.resolve('docs', '.code-map.yaml'),
    path.resolve('.agent', '.code-map.yaml'),
  ];

  for (const destPath of destPaths) {
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(destPath, yamlOutput, 'utf-8');
    console.log(`Success! Code Map written to: ${destPath}`);
  }
}

main();

