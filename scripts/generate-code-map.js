import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

// Standard JavaScript, DOM, React built-in functions to exclude from architectural calls
const IGNORED_EXACT_CALLS = new Set([
  // React Hooks
  'useState',
  'useEffect',
  'useCallback',
  'useMemo',
  'useRef',
  'useContext',
  'useReducer',
  'useId',
  'useDeferredValue',
  'useTransition',
  'useLayoutEffect',
  'useImperativeHandle',
  'useInsertionEffect',
  'useSyncExternalStore',

  // Console
  'console.log',
  'console.error',
  'console.warn',
  'console.info',
  'console.debug',
  'console.table',

  // Array / Object / String prototype methods
  'map',
  'filter',
  'forEach',
  'reduce',
  'reduceRight',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'some',
  'every',
  'push',
  'pop',
  'shift',
  'unshift',
  'slice',
  'splice',
  'concat',
  'indexOf',
  'lastIndexOf',
  'includes',
  'join',
  'split',
  'replace',
  'replaceAll',
  'trim',
  'trimStart',
  'trimEnd',
  'toLowerCase',
  'toUpperCase',
  'toString',
  'toLocaleDateString',
  'toLocaleTimeString',
  'toLocaleString',
  'valueOf',
  'padStart',
  'padEnd',
  'startsWith',
  'endsWith',
  'repeat',
  'match',
  'matchAll',
  'search',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'entries',
  'keys',
  'values',
  'has',
  'get',
  'set',
  'delete',
  'add',
  'clear',
  'size',
  'length',

  // Event & DOM
  'stopPropagation',
  'preventDefault',
  'e.stopPropagation',
  'e.preventDefault',
  'event.stopPropagation',
  'event.preventDefault',
  'addEventListener',
  'removeEventListener',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'scrollIntoView',
  'scrollTo',
  'scrollBy',
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getAttribute',
  'setAttribute',
  'removeAttribute',
  'closest',
  'matches',
  'contains',
  'appendChild',
  'removeChild',
  'replaceChild',
  'focus',
  'blur',

  // Web Audio Low-level Automations
  'setValueAtTime',
  'linearRampToValueAtTime',
  'exponentialRampToValueAtTime',
  'setTargetAtTime',
  'setValueCurveAtTime',
  'cancelScheduledValues',
  'cancelAndHoldAtTime',
  'connect',
  'disconnect',
  'start',
  'stop',

  // Type Casts
  'String',
  'Number',
  'Boolean',
  'Symbol',
  'BigInt',
  'Array',

  // Promise
  'then',
  'catch',
  'finally',
  'resolve',
  'reject',
  'all',
  'allSettled',
  'race',
  'any',
]);

const IGNORED_PREFIXES = [
  'Math.',
  'JSON.',
  'Object.',
  'Promise.',
  'String.',
  'Number.',
  'Boolean.',
  'Array.',
  'Date.',
  'Intl.',
  'RegExp.',
  'window.',
  'document.',
  'navigator.',
  'screen.',
  'node.',
  'element.',
  'container.',
  'scrollContainer.',
  'classList.',
  'style.',
  'dataset.',
];

function isIgnoredCall(callText) {
  if (!callText || callText.length === 0 || callText.startsWith('.')) return true;
  if (IGNORED_EXACT_CALLS.has(callText)) return true;
  for (const prefix of IGNORED_PREFIXES) {
    if (callText.startsWith(prefix)) return true;
  }
  return false;
}

function cleanTypeString(typeStr) {
  if (!typeStr) return '';
  return typeStr
    .replace(/import\("[^"]+"\)\./g, '')
    .replace(/import\('[^']+'\)\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

      // Filter out standard prototype method calls (e.g. items.map, str.trim)
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const methodName = expression.getName();
        if (IGNORED_EXACT_CALLS.has(methodName)) {
          return;
        }
      }

      let text = expression.getText().replace(/\s+/g, ' ').trim();

      // Normalize complex expressions (e.g. member access or chaining)
      if (
        text.length > 50 ||
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

      // Filter out low-level built-in noise
      if (!isIgnoredCall(text)) {
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
    let pName = param.getName().replace(/\s+/g, ' ').trim();
    if (pName.startsWith('{') && pName.endsWith('}')) {
      pName = 'props';
    }
    params[pName] = cleanTypeString(param.getType().getText());
  }
  const returns = cleanTypeString(func.getReturnType().getText());

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
    let pName = param.getName().replace(/\s+/g, ' ').trim();
    if (pName.startsWith('{') && pName.endsWith('}')) {
      pName = 'props';
    }
    params[pName] = cleanTypeString(param.getType().getText());
  }
  const returns = cleanTypeString(initializer.getReturnType().getText());

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
      let pName = param.getName().replace(/\s+/g, ' ').trim();
      if (pName.startsWith('{') && pName.endsWith('}')) {
        pName = 'props';
      }
      params[pName] = cleanTypeString(param.getType().getText());
    }
    const returns = cleanTypeString(method.getReturnType().getText());
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
  const handlerNames = new Set();

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
          handlerNames.add(name);
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
              handlerNames.add(name);
            }
          }
        }
      }
    });
  }

  const result = {};
  if (state.length > 0) result.state = state;
  if (handlerNames.size > 0) result.handlers = Array.from(handlerNames);
  return Object.keys(result).length > 0 ? result : null;
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

/**
 * Dynamically extract domain name and summary from JSDoc tags (@domain, @summary) in index.ts
 */
function getDomainMetadata(domainKey, dirPath) {
  let name = '';
  let summary = '';

  if (dirPath && fs.existsSync(dirPath)) {
    const indexFiles = ['index.ts', 'index.tsx', 'README.md'];
    for (const idx of indexFiles) {
      const fullPath = path.join(dirPath, idx);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const domainMatch = content.match(/@domain\s+([^\n\r*]+)/);
          const summaryMatch = content.match(/@summary\s+([^\n\r*]+)/);
          if (domainMatch) name = domainMatch[1].trim();
          if (summaryMatch) summary = summaryMatch[1].trim();
          if (name && summary) break;
        } catch (_e) {
          // ignore
        }
      }
    }
  }

  if (!name) {
    const cleanKey = domainKey
      .replace(/^features\//, '')
      .replace(/^components\//, '')
      .replace(/^utils\//, '');
    name = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1) + ' Domain';
  }
  if (!summary) {
    summary = `${domainKey} 도메인 기능 모듈`;
  }

  return { name, summary };
}

/**
 * Table description dictionary for actual schema tables
 */
function getTableDescription(tableName) {
  const tableDescriptions = {
    profiles: '유저 닉네임, 아바타, 티어 점수, 총 등반 고도, 산소 잔여량',
    game_records: '게임 플레이 결과(모드, 정답수, 소요시간, 콤보, 획득점수)',
    game_sessions: '실시간 퀴즈 게임 세션 진행 상태 및 검증 토큰',
    badge_definitions: '뱃지 메타데이터(이름, 설명, 아이콘, 획득조건)',
    user_badges: '유저별 획득 뱃지 목록 및 획득일시',
    inventory: '유저 보유 아이템(산소통 등) 및 인벤토리 내역',
    items: '상점 판매 아이템 메타데이터 및 가격 정보',
    daily_reward_history: '일일 출석 및 보상 수령 이력',
    app_settings: '애플리케이션 전역 설정 및 메타데이터',
    game_config: '인게임 월드/레벨 설정 및 파라미터',
    hall_of_fame: '명예의 전당 역대 시즌 랭킹 기록',
    ranking_view: '전체/티어별 리더보드 뷰',
    theme_mapping: '테마 및 카테고리 매핑 설정',
    tier_definitions: '티어 등급 및 별점 승급 기준 정의',
    user_level_records: '유저별 레벨 클리어 상태 및 최고 점수 기록',
  };
  return tableDescriptions[tableName] || `${tableName} 데이터 테이블`;
}

function generateMacroArchitectureMap(sourceFiles = []) {
  // 1. Read package.json dynamically
  const pkgPath = path.resolve('package.json');
  let pkg = { name: 'solve-climb', version: '0.1.0', dependencies: {} };
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (_e) {
      console.warn('Failed to parse package.json:', _e.message);
    }
  }

  // Determine architecture stack dynamically
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const archParts = [];
  if (deps['react']) archParts.push(`React ${deps['react'].replace(/[\^~]/, '')}`);
  if (deps['typescript']) archParts.push('TypeScript');
  if (deps['vite']) archParts.push('Vite');
  if (deps['zustand']) archParts.push('Zustand');
  if (deps['@supabase/supabase-js']) archParts.push('Supabase');
  if (deps['@capacitor/core']) archParts.push('Capacitor');

  // 2. Discover global stores dynamically from src/stores/
  const globalStores = {};
  const storesDir = path.resolve('src', 'stores');
  if (fs.existsSync(storesDir)) {
    const storeFiles = fs.readdirSync(storesDir);
    for (const file of storeFiles) {
      if (file.endsWith('.ts') && !file.includes('.test.') && !file.includes('__tests__')) {
        const storeName = path.basename(file, '.ts');
        const fullStorePath = path.join(storesDir, file);
        let summary = '';
        try {
          const content = fs.readFileSync(fullStorePath, 'utf8');
          const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
          if (commentMatch) {
            summary = commentMatch[1].replace(/^\s*\*\s?/gm, '').trim();
          }
        } catch (_e) {
          // ignore
        }
        globalStores[storeName] = summary || `${storeName} 상태 관리 스토어`;
      }
    }
  }

  // 3. Collect domain candidates dynamically from physical directories
  const domainSummaries = {};
  const candidateDomainDirs = [];

  // Check src/features/*
  const featuresDir = path.resolve('src', 'features');
  if (fs.existsSync(featuresDir)) {
    for (const dirName of fs.readdirSync(featuresDir)) {
      const fullDir = path.join(featuresDir, dirName);
      if (fs.statSync(fullDir).isDirectory()) {
        candidateDomainDirs.push({
          key: `features/${dirName}`,
          dirPath: fullDir,
          relativePrefix: `src/features/${dirName}`,
        });
      }
    }
  }

  // Check other key architectural modules
  const otherModules = [
    { key: 'utils/sound', dir: path.resolve('src', 'utils', 'sound'), prefix: 'src/utils/sound' },
    {
      key: 'components/geometry',
      dir: path.resolve('src', 'components', 'geometry'),
      prefix: 'src/components/geometry',
    },
  ];
  for (const mod of otherModules) {
    if (fs.existsSync(mod.dir)) {
      candidateDomainDirs.push({
        key: mod.key,
        dirPath: mod.dir,
        relativePrefix: mod.prefix,
      });
    }
  }

  const allDbTables = new Set();

  for (const domain of candidateDomainDirs) {
    const meta = getDomainMetadata(domain.key, domain.dirPath);
    const domainObj = {
      name: meta.name,
      summary: meta.summary,
      entryPoints: [],
    };

    // Find actual entryPoints
    const entryCandidates = [];
    const indexFiles = ['index.ts', 'index.tsx'];
    for (const idx of indexFiles) {
      const full = path.join(domain.dirPath, idx);
      if (fs.existsSync(full)) {
        entryCandidates.push(path.relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
    // Look into pages/
    const pagesDir = path.join(domain.dirPath, 'pages');
    if (fs.existsSync(pagesDir)) {
      for (const f of fs.readdirSync(pagesDir)) {
        if (f.endsWith('.tsx') && !f.includes('.test.') && !f.includes('__tests__')) {
          entryCandidates.push(
            path.relative(process.cwd(), path.join(pagesDir, f)).replace(/\\/g, '/')
          );
        }
      }
    }
    // Look into components/
    const compDir = path.join(domain.dirPath, 'components');
    if (fs.existsSync(compDir)) {
      for (const f of fs.readdirSync(compDir)) {
        if (
          (f.endsWith('Layout.tsx') ||
            f.endsWith('Container.tsx') ||
            f.endsWith('Panel.tsx') ||
            f.endsWith('Modal.tsx') ||
            f.endsWith('Section.tsx') ||
            f.endsWith('.tsx')) &&
          !f.includes('.test.') &&
          !f.includes('__tests__')
        ) {
          entryCandidates.push(
            path.relative(process.cwd(), path.join(compDir, f)).replace(/\\/g, '/')
          );
        }
      }
    }
    // Root level components/files in domain dir
    for (const f of fs.readdirSync(domain.dirPath)) {
      const full = path.join(domain.dirPath, f);
      if (
        fs.statSync(full).isFile() &&
        (f.endsWith('.tsx') || f.endsWith('.ts')) &&
        !f.includes('.test.') &&
        !f.includes('__tests__')
      ) {
        entryCandidates.push(path.relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }

    // Filter to existing files only and keep top unique entry points
    const validEntryPoints = Array.from(new Set(entryCandidates)).filter((p) =>
      fs.existsSync(path.resolve(p))
    );
    if (validEntryPoints.length > 0) {
      domainObj.entryPoints = validEntryPoints.slice(0, 5);
    }

    // Dynamic AST scan for stores, dbTables, externalIntegrations
    const storesUsed = new Set();
    const tablesUsed = new Set();
    const integrationsUsed = new Set();

    for (const sourceFile of sourceFiles) {
      const rel = path.relative(process.cwd(), sourceFile.getFilePath()).replace(/\\/g, '/');
      const isFileInDomain = rel.startsWith(domain.relativePrefix);

      if (!isFileInDomain) continue;

      const fileText = sourceFile.getFullText();

      // Scan for store imports
      for (const storeName of Object.keys(globalStores)) {
        if (fileText.includes(storeName)) {
          storesUsed.add(storeName);
        }
      }

      // Scan for db table usages .from('table_name') or supabase.from('table_name')
      const fromMatches = fileText.matchAll(
        /\.from\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g
      );
      for (const match of fromMatches) {
        const tbl = match[1];
        tablesUsed.add(tbl);
        allDbTables.add(tbl);
      }

      // Scan for external integrations
      if (fileText.includes('@supabase') || fileText.includes('supabaseClient'))
        integrationsUsed.add('Supabase Auth');
      if (fileText.includes('google') || fileText.includes('GoogleSignIn'))
        integrationsUsed.add('GoogleSignIn');
      if (
        fileText.includes('toss') ||
        fileText.includes('TossAuth') ||
        fileText.includes('tossGameLogin')
      )
        integrationsUsed.add('TossAuth');
      if (
        fileText.includes('admob') ||
        fileText.includes('adService') ||
        fileText.includes('AdMob')
      )
        integrationsUsed.add('AdMob');
      if (fileText.includes('sentry') || fileText.includes('Sentry'))
        integrationsUsed.add('Sentry');
      if (fileText.includes('@capacitor')) integrationsUsed.add('Capacitor');
    }

    if (storesUsed.size > 0) {
      domainObj.stores = Array.from(storesUsed).sort();
    }
    if (tablesUsed.size > 0) {
      domainObj.dbTables = Array.from(tablesUsed).sort();
    }
    if (integrationsUsed.size > 0) {
      domainObj.externalIntegrations = Array.from(integrationsUsed).sort();
    }

    domainSummaries[domain.key] = domainObj;
  }

  // 4. Scan all sourceFiles once to populate any missed DB tables purely from code
  for (const sourceFile of sourceFiles) {
    const fileText = sourceFile.getFullText();
    const fromMatches = fileText.matchAll(
      /\.from\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g
    );
    for (const match of fromMatches) {
      allDbTables.add(match[1]);
    }
  }

  const dbTablesMap = {};
  for (const tbl of Array.from(allDbTables).sort()) {
    dbTablesMap[tbl] = getTableDescription(tbl);
  }

  return {
    project: pkg.name || 'solve-climb',
    version: pkg.version || '0.1.0',
    generatedAt: new Date().toISOString(),
    architecture:
      archParts.join(' + ') || 'React 19 + TypeScript + Vite + Zustand + Supabase + Capacitor',
    summary:
      pkg.description || '웹 및 모바일(안드로이드/Toss) 기반 실시간 클라이밍 수학/CS 퀴즈 게임',
    domains: domainSummaries,
    globalStores,
    database: {
      tables: dbTablesMap,
    },
  };
}

function main() {
  console.log('Starting Optimized Code Map generation...');
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
        if (reactInfo.state) fileData.state = reactInfo.state;
        if (reactInfo.handlers) fileData.handlers = reactInfo.handlers;
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

  // 1. Write Detailed Code Map (.code-map.yaml)
  const detailedYaml = yaml.dump(mapData, { indent: 2, lineWidth: -1, noRefs: true });
  const detailedDestPaths = [
    path.resolve('docs', '.code-map.yaml'),
    path.resolve('.agent', '.code-map.yaml'),
  ];
  for (const destPath of detailedDestPaths) {
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(destPath, detailedYaml, 'utf-8');
    console.log(`Success! Detailed Code Map written to: ${destPath}`);
  }

  // 2. Write Macroscopic Architecture Map (architecture-map.yaml)
  const macroData = generateMacroArchitectureMap(sourceFiles);
  const macroYaml = yaml.dump(macroData, { indent: 2, lineWidth: -1, noRefs: true });
  const macroDestPaths = [
    path.resolve('docs', 'architecture-map.yaml'),
    path.resolve('.agent', 'architecture-map.yaml'),
  ];
  for (const destPath of macroDestPaths) {
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(destPath, macroYaml, 'utf-8');
    console.log(`Success! Macroscopic Architecture Map written to: ${destPath}`);
  }
}

main();
