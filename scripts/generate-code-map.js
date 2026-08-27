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

function generateMacroArchitectureMap() {
  const domainSummaries = {
    'features/quiz': {
      name: '퀴즈 게임 플레이 엔진 (Quiz Engine)',
      summary: '일반 모드(60s)/서바이벌(10s) 퀴즈 출제, 타이머, 콤보, 점수 및 보상 판정',
      entryPoints: ['src/features/quiz/QuizContainer.tsx'],
      stores: ['useQuizStore', 'useLevelProgressStore'],
      dbTables: ['game_records', 'user_profiles'],
    },
    'features/auth': {
      name: '사용자 인증 및 세션 (Authentication)',
      summary: 'Google OAuth, Toss App-in-Toss, 게스트 로그인 및 세션 동기화',
      entryPoints: ['src/features/auth/AuthModal.tsx'],
      stores: ['useAuthStore', 'useUserStore'],
      externalIntegrations: ['Supabase Auth', 'GoogleSignIn', 'TossAuth'],
    },
    'features/ranking': {
      name: '랭킹 및 티어 시스템 (Ranking & Tiers)',
      summary: '전체/티어별 리더보드 조회, 시즌 레이팅 점수 산정 및 레이팅 검증',
      entryPoints: ['src/features/ranking/RankingPage.tsx'],
      stores: ['useRankingStore', 'useUserStore'],
      dbTables: ['user_profiles', 'game_records'],
    },
    'features/shop': {
      name: '상점 및 아이템 관리 (Shop & Inventory)',
      summary: '산소통 및 시간연장 아이템 구매, 인벤토리 관리, 보상형 광고 연동',
      entryPoints: ['src/features/shop/ShopPage.tsx'],
      stores: ['useShopStore', 'useInventoryStore'],
      dbTables: ['user_inventory', 'user_profiles'],
      externalIntegrations: ['AdMob'],
    },
    'features/debug': {
      name: '개발 및 디버그 도구 (Debug Tools)',
      summary: '테스트 데이터 리셋, 더미 기록 생성, 에러 로그 뷰어 및 바운더리 테스트 패널',
      entryPoints: ['src/features/debug/components/DebugPanel.tsx'],
      stores: ['useDebugStore', 'useErrorLogStore'],
    },
    'utils/sound': {
      name: 'Web Audio 사운드 엔진 (Audio Synthesis)',
      summary: 'Web Audio API 기반 절차적 SFX 합성, 상황별 다이나믹 BGM 트랙 및 주파수 시각화',
      entryPoints: ['src/utils/sound/index.ts', 'src/components/GlobalBgmManager.tsx'],
      stores: ['useSettingsStore'],
    },
    'components/geometry': {
      name: 'Manim 기하 시각화 (Geometry Visualizer)',
      summary: '수학 기하학 및 대수학 문제용 인터랙티브 도형/차트 렌더러',
      entryPoints: ['src/components/geometry/ShapeVisualizer.tsx'],
    },
  };

  const globalStores = {
    useAuthStore: '로그인 유저 정보 및 인증 세션 토큰 관리',
    useQuizStore: '현재 문제, 선택지, 남은 시간, 점수, 콤보 및 진행 상태',
    useLevelProgressStore: '월드별 클리어 레벨, 등반 고도 및 별점 진척도',
    useSettingsStore: 'BGM/SFX 볼륨, 햅틱 피드백, 테마 설정',
    useToastStore: '전역 토스트 알림 메시지 큐',
    useBadgeStore: '업적 뱃지 획득 내역 및 팝업',
    useErrorLogStore: '런타임 에러 캡처 및 Sentry 연동 버퍼',
    useDebugStore: '치트 모드 및 로컬 테스트 오버라이드',
  };

  const database = {
    tables: {
      user_profiles: '유저 닉네임, 아바타, 티어 점수, 총 등반 고도, 산소 잔여량',
      game_records: '게임 플레이 결과(모드, 정답수, 소요시간, 콤보, 획득점수)',
      badge_definitions: '뱃지 메타데이터(이름, 설명, 아이콘, 획득조건)',
      user_badges: '유저별 획득 뱃지 목록 및 획득일시',
      user_inventory: '유저 보유 아이템(산소통 등) 및 사용 내역',
      daily_reward_history: '일일 출석 및 보상 수령 이력',
    },
  };

  return {
    project: 'solve-climb',
    version: '0.27.532',
    generatedAt: new Date().toISOString(),
    architecture: 'React 19 + TypeScript + Vite + Zustand + Supabase + Capacitor',
    summary: '웹 및 모바일(안드로이드/Toss) 기반 실시간 클라이밍 수학/CS 퀴즈 게임',
    domains: domainSummaries,
    globalStores,
    database,
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
  const macroData = generateMacroArchitectureMap();
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
