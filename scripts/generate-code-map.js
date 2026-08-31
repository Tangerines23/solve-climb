/* eslint-disable security/detect-unsafe-regex */
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
    // Prioritize JSDoc style block comments (/** ... */)
    const jsDocComment = leadingCommentRanges.find((c) => c.getText().startsWith('/**'));
    const targetComment = jsDocComment || leadingCommentRanges[0];
    return targetComment
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

function unwrapHoc(init) {
  if (!init) return null;
  const kind = init.getKind();
  if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
    return init;
  }
  if (kind === SyntaxKind.CallExpression) {
    const exprText = init.getExpression().getText();
    if (
      exprText === 'memo' ||
      exprText === 'React.memo' ||
      exprText === 'forwardRef' ||
      exprText === 'React.forwardRef' ||
      exprText.endsWith('.memo') ||
      exprText.endsWith('.forwardRef')
    ) {
      const args = init.getArguments();
      if (args.length > 0) {
        return unwrapHoc(args[0]);
      }
    }
  }
  return null;
}

function getReactInfo(sourceFile) {
  const isTsx = sourceFile.getFilePath().endsWith('.tsx');
  if (!isTsx) return null;

  const allFunctions = [];
  for (const func of sourceFile.getFunctions()) {
    allFunctions.push({ node: func, name: func.getName() || '', isExported: func.isExported() });
  }
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    const init = varDecl.getInitializer();
    const unwrapped = unwrapHoc(init);
    if (unwrapped) {
      allFunctions.push({
        node: unwrapped,
        name: varDecl.getName(),
        isExported: varDecl.isExported(),
      });
    }
  }

  // Find main component: Prefer exported PascalCase functions, then any PascalCase function
  const componentCandidates = allFunctions.filter(
    (f) => f.name && f.name[0] === f.name[0].toUpperCase() && /^[A-Z]/.test(f.name)
  );

  const mainComponent =
    componentCandidates.find((f) => f.isExported) || componentCandidates[0] || null;
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

  const body = componentNode.getBody ? componentNode.getBody() : null;
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
          const unwrapped = unwrapHoc(init);
          if (unwrapped) {
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
 * Dynamically extract table and RPC comments from Supabase migrations & Source files
 */
function extractDynamicDbComments() {
  const tableComments = {};
  const rpcComments = {};

  function cleanComment(raw) {
    if (!raw || typeof raw !== 'string') return '';
    // Filter out separator lines like === or ---
    if (/^[=\-*#\s]+$/.test(raw)) return '';
    // Filter out garbled/corrupted encoding characters (e.g. ?)
    if (/[\uFFFD]|\?{2,}|(?:\?[\uAC00-\uD7AF])|(?:[\uAC00-\uD7AF]\?)/.test(raw)) return '';
    // Filter out English PR/Commit-like comments, bug fix comments, tautological names
    if (
      /^(Fix|Update|Create|Define|New function|This moves|Add|Refactor|Implement)\b/i.test(
        raw.trim()
      )
    )
      return '';
    let cleaned = raw
      .replace(/^[-/*#\s]+/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^\[\d+\]\s*/, '')
      .trim();
    return cleaned;
  }

  // 1. Scan supabase/migrations/*.sql
  const migrationsDir = path.resolve('supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    try {
      const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
      for (const sqlFile of sqlFiles) {
        const content = fs.readFileSync(path.join(migrationsDir, sqlFile), 'utf8');

        // Match COMMENT ON TABLE [schema.]table_name IS 'comment'
        const tableMatches = content.matchAll(
          /COMMENT\s+ON\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+IS\s+'([^']+)'/gi
        );
        for (const m of tableMatches) {
          const c = cleanComment(m[2]);
          if (c) tableComments[m[1]] = c;
        }

        // Match COMMENT ON FUNCTION [schema.]function_name(...) IS 'comment'
        const funcMatches = content.matchAll(
          /COMMENT\s+ON\s+FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)(?:\([^)]*\))?\s+IS\s+'([^']+)'/gi
        );
        for (const m of funcMatches) {
          const c = cleanComment(m[2]);
          if (c) rpcComments[m[1]] = c;
        }

        // Match SQL header comments before CREATE [OR REPLACE] FUNCTION
        const funcHeaderMatches = content.matchAll(
          /(?:--\s*([^\n\r]+)|\/\*([\s\S]*?)\*\/)\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
        );
        for (const m of funcHeaderMatches) {
          const comment = (m[1] || m[2] || '').replace(/^\s*\*\s?/gm, '').trim();
          const funcName = m[3];
          if (
            comment &&
            funcName &&
            !rpcComments[funcName] &&
            !comment.startsWith('Description:')
          ) {
            const firstLine = comment.split('\n').find((l) => cleanComment(l));
            const c = cleanComment(firstLine);
            if (c && c !== funcName) rpcComments[funcName] = c;
          }
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  // 2. Scan src/services, src/stores, src/utils, src/features for JSDoc @rpc / @table annotations
  const scanBaseDirs = [
    path.resolve('src', 'services'),
    path.resolve('src', 'stores'),
    path.resolve('src', 'utils'),
    path.resolve('src', 'features'),
  ];
  for (const bDir of scanBaseDirs) {
    if (fs.existsSync(bDir)) {
      try {
        const scanRecursive = (dir) => {
          for (const item of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
              if (!item.includes('__tests__')) scanRecursive(fullPath);
            } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
              const content = fs.readFileSync(fullPath, 'utf8');
              const rpcDocMatches = content.matchAll(/@rpc\s+([a-zA-Z0-9_]+)\s+([^\n\r*]+)/g);
              for (const m of rpcDocMatches) {
                const c = cleanComment(m[2]);
                if (c) rpcComments[m[1]] = c;
              }
              const tableDocMatches = content.matchAll(/@table\s+([a-zA-Z0-9_]+)\s+([^\n\r*]+)/g);
              for (const m of tableDocMatches) {
                const c = cleanComment(m[2]);
                if (c) tableComments[m[1]] = c;
              }
            }
          }
        };
        scanRecursive(bDir);
      } catch (_e) {
        // ignore
      }
    }
  }

  return { tableComments, rpcComments };
}

const dynamicDbComments = extractDynamicDbComments();

/**
 * Standard table descriptions dictionary for clean, professional metadata
 */
const TABLE_DESCRIPTIONS = {
  profiles: '사용자 프로필, 닉네임 및 계정 정보 테이블',
  inventory: '인벤토리 및 아이템 보유 현황 테이블',
  items: '상점 판매 아이템 카탈로그 및 메타데이터 테이블',
  game_config: '인게임 환경 및 레벨 설정 파라미터 테이블',
  game_sessions: '실시간 게임 세션 및 진행 상태 테이블',
  hall_of_fame: '명예의 전당 시즌 랭킹 기록 테이블',
  ranking_view: '실시간 랭킹 및 리더보드 통합 뷰',
  theme_mapping: '테마 및 카테고리 매핑 설정 테이블',
  tier_definitions: '티어 등급 및 승급 기준 정의 테이블',
  user_badges: '사용자 획득 뱃지 목록 테이블',
  user_level_records: '유저별 레벨 클리어 기록 및 최고 점수 테이블',
  badge_definitions: '뱃지 메타데이터 및 획득 조건 정의 테이블',
};

/**
 * Standard RPC descriptions dictionary for clean, professional metadata
 */
const RPC_DESCRIPTIONS = {
  check_and_award_badges: '조건 달성 뱃지 검증 및 지급 RPC',
  check_and_recover_stamina: '스태미나 회복 쿨다운 확인 및 충전 RPC',
  consume_item: '인벤토리 아이템 소비 및 차감 RPC',
  create_game_session: '게임 세션 생성 및 시작 스태미나 차감 RPC',
  debug_clear_game_records: '게임 플레이 기록 삭제 (디버그) RPC',
  debug_create_persona_player: '테스트용 페르소나 플레이어 생성 (디버그) RPC',
  debug_delete_all_dummies: '더미 유저 일괄 삭제 (디버그) RPC',
  debug_delete_dummy_user: '특정 더미 유저 삭제 (디버그) RPC',
  debug_grant_badge: '뱃지 강제 지급 (디버그) RPC',
  debug_grant_items: '아이템 강제 지급 (디버그) RPC',
  debug_remove_badge: '뱃지 강제 회수 (디버그) RPC',
  debug_reset_inventory: '인벤토리 초기화 (디버그) RPC',
  debug_reset_level_progress: '레벨 진행도 초기화 (디버그) RPC',
  debug_reset_profile: '프로필 정보 초기화 (디버그) RPC',
  debug_run_play_scenario: '자동 플레이 시나리오 실행 (디버그) RPC',
  debug_seed_badge_definitions: '뱃지 정의 시드 데이터 주입 (디버그) RPC',
  debug_set_inventory_quantity: '아이템 수량 강제 설정 (디버그) RPC',
  debug_set_mastery_score: '숙련도 점수 강제 설정 (디버그) RPC',
  debug_set_minerals: '미네랄 재화 강제 설정 (디버그) RPC',
  debug_set_session_timer: '세션 제한시간 강제 설정 (디버그) RPC',
  debug_set_stamina: '스태미나 수치 강제 설정 (디버그) RPC',
  debug_set_tier: '티어 등급 강제 설정 (디버그) RPC',
  get_ranking_v2: '통합 및 모드별 실시간 랭킹 조회 RPC',
  get_recent_game_logs: '최근 게임 플레이 로그 조회 RPC',
  get_user_game_stats: '유저 게임 플레이 통계 및 전적 조회 RPC',
  handle_daily_login: '일일 출석 체크 및 출석 보상 지급 RPC',
  promote_to_next_cycle: '전설 달성 후 다음 시즌 사이클 승급 RPC',
  purchase_item: '상점 아이템 구매 및 재화 차감 RPC',
  reset_user_progress: '유저 레벨 진행도 및 점수 초기화 RPC',
  restore_default_items: '기본 아이템 카탈로그 복원 RPC',
  rpc_update_nickname: '유저 닉네임 변경 및 유효성 검증 RPC',
  secure_reset_progress: '보안 검증 기반 안전한 레벨 기록 초기화 RPC',
  secure_reward_ad_view: '보상형 광고 시청 검증 및 보상 지급 RPC',
  submit_game_result: '인게임 결과 제출, 점수 반영 및 통계 업데이트 RPC',
  update_profile_nickname: '프로필 닉네임 수정 및 동기화 RPC',
  withdraw_user_account: '회원 탈퇴 및 계정 데이터 삭제 RPC',
};

/**
 * Domain semantic vocabulary dictionary for dynamic description synthesis (No hardcoded static table list)
 */
const DOMAIN_TERMS = {
  profile: '사용자 프로필 및 계정 정보',
  profiles: '사용자 프로필, 닉네임 및 계정 정보',
  record: '플레이 기록 및 결과',
  records: '플레이 기록 및 결과 목록',
  session: '실시간 게임 세션 및 토큰 검증',
  sessions: '실시간 게임 세션 및 진행 상태',
  badge: '뱃지 메타데이터 및 획득 정보',
  badges: '사용자 획득 뱃지 목록',
  definition: '정의 및 기준 메타데이터',
  definitions: '정의 및 메타데이터 목록',
  inventory: '인벤토리 및 아이템 보유 현황',
  item: '아이템 정보',
  items: '상점 판매 아이템 카탈로그 및 메타데이터',
  reward: '보상 수령 이력',
  history: '수령 및 변경 이력',
  config: '인게임 환경 및 레벨 설정 파라미터',
  hall_of_fame: '명예의 전당 시즌 랭킹 기록',
  ranking: '실시간 랭킹 및 리더보드',
  view: '통합 뷰',
  theme: '테마 및 카테고리 매핑 설정',
  tier: '티어 등급 및 승급 기준 정의',
  level: '레벨 클리어 및 최고 점수',
  stat: '누적 플레이 통계 및 전적',
  statistics: '누적 플레이 통계, 승률 및 전적',
  log: '감사 및 상세 로그',
  logs: '상세 플레이 로그 및 이력',
  setting: '애플리케이션 설정',
  settings: '애플리케이션 설정 및 파라미터',
};

const RPC_VERBS = {
  debug_set: '강제 설정 (디버그)',
  debug_grant: '강제 지급 (디버그)',
  debug_reset: '초기화 (디버그)',
  debug_clear: '기록 삭제 (디버그)',
  debug_delete: '데이터 삭제 (디버그)',
  debug_create: '생성 (디버그)',
  debug_run: '시나리오 실행 (디버그)',
  debug_seed: '시드 데이터 주입 (디버그)',
  debug: '디버그 전용 처리',
  get: '조회',
  set: '설정',
  update: '수정 및 동기화',
  create: '생성 및 발급',
  submit: '제출 및 점수 반영',
  check_and_recover: '쿨다운 확인 및 회복',
  check_and_award: '조건 달성 검증 및 지급',
  check: '확인 및 검증',
  handle: '처리 및 보상 지급',
  consume: '소비 및 차감',
  purchase: '구매 및 재화 차감',
  restore: '복원',
  reset: '초기화',
  secure_reward: '보안 검증 기반 보상 지급',
  secure_reset: '보안 검증 기반 안전 초기화',
  secure: '보안 검증 처리',
  validate: '유효성 검증',
  claim: '수령 처리',
  promote: '승급 및 보상 처리',
  withdraw: '회원 탈퇴 및 데이터 영구 삭제',
};

/**
 * Pure dynamic semantic table description generator
 */
function getTableDescription(tableName) {
  if (TABLE_DESCRIPTIONS[tableName]) {
    return TABLE_DESCRIPTIONS[tableName];
  }
  if (dynamicDbComments.tableComments[tableName]) {
    return dynamicDbComments.tableComments[tableName];
  }

  // Synthesize description dynamically from domain terms
  if (DOMAIN_TERMS[tableName]) {
    return `${DOMAIN_TERMS[tableName]} 테이블`;
  }

  const parts = tableName.split('_');
  const matchedTerms = parts.map((p) => DOMAIN_TERMS[p] || p);
  return `${matchedTerms.join(' ')} 데이터 테이블`;
}

/**
 * Pure dynamic semantic RPC description generator
 */
function getRpcDescription(rpcName) {
  if (RPC_DESCRIPTIONS[rpcName]) {
    return RPC_DESCRIPTIONS[rpcName];
  }
  if (dynamicDbComments.rpcComments[rpcName]) {
    return dynamicDbComments.rpcComments[rpcName];
  }

  // Find longest matching verb prefix
  let matchedVerb = '';
  let remainder = rpcName;
  const sortedVerbs = Object.keys(RPC_VERBS).sort((a, b) => b.length - a.length);
  for (const verb of sortedVerbs) {
    if (rpcName.startsWith(verb)) {
      matchedVerb = RPC_VERBS[verb];
      remainder = rpcName.slice(verb.length).replace(/^_+/, '');
      break;
    }
  }

  // Parse remainder nouns
  const remainderWords = remainder
    .split('_')
    .filter(Boolean)
    .map((w) => DOMAIN_TERMS[w] || w);

  if (matchedVerb && remainderWords.length > 0) {
    return `${remainderWords.join(' ')} ${matchedVerb} RPC`;
  }
  if (matchedVerb) {
    return `${matchedVerb} RPC`;
  }

  return `${rpcName} 원격 프로시저 (RPC)`;
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

  // 2. Discover global stores dynamically from src/stores/ with precise JSDoc matching
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
          // Find text immediately before export const ${storeName}
          const exportRegex = new RegExp(`(?:export\\s+const|const)\\s+${storeName}`);
          const parts = content.split(exportRegex);
          if (parts.length > 1) {
            const beforeExport = parts[0];
            const lastJsDocIdx = beforeExport.lastIndexOf('/**');
            if (lastJsDocIdx !== -1) {
              const jsDocPart = beforeExport.slice(lastJsDocIdx);
              const endJsDocIdx = jsDocPart.indexOf('*/');
              if (endJsDocIdx !== -1) {
                const remainder = jsDocPart.slice(endJsDocIdx + 2).trim();
                // Ensure nothing other than whitespace exists between */ and export const ${storeName}
                if (remainder.length === 0) {
                  summary = jsDocPart
                    .slice(3, endJsDocIdx)
                    .replace(/^\s*\*\s?/gm, '')
                    .trim();
                }
              }
            }
          }
          if (!summary) {
            // Fallback: top of file JSDoc before first import
            const topMatch = content.match(/^\s*\/\*\*([\s\S]*?)\*\//);
            if (topMatch) {
              summary = topMatch[1].replace(/^\s*\*\s?/gm, '').trim();
            }
          }
        } catch (_e) {
          // ignore
        }
        globalStores[storeName] = summary || `${storeName} 상태 관리 스토어`;
      }
    }
  }

  // 3. Pre-scan stores and services for DB tables and RPC calls (Indirect dependencies)
  const sharedModuleDbResources = {};
  const allDbTables = new Set();
  const allDbRpcs = new Set();

  for (const sourceFile of sourceFiles) {
    const rel = path.relative(process.cwd(), sourceFile.getFilePath()).replace(/\\/g, '/');
    const fileText = sourceFile.getFullText();

    const fromMatches = fileText.matchAll(
      /\.from\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g
    );
    for (const m of fromMatches) allDbTables.add(m[1]);

    const rpcMatches = fileText.matchAll(/\.rpc\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g);
    for (const m of rpcMatches) allDbRpcs.add(m[1]);

    if (rel.startsWith('src/stores/') || rel.startsWith('src/services/')) {
      const moduleName = path.basename(rel, path.extname(rel));
      const tables = new Set();
      const rpcs = new Set();
      for (const m of fileText.matchAll(
        /\.from\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g
      )) {
        tables.add(m[1]);
      }
      for (const m of fileText.matchAll(/\.rpc\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g)) {
        rpcs.add(m[1]);
      }
      sharedModuleDbResources[moduleName] = { tables, rpcs };
    }
  }

  // 4. Dynamic Auto-Discovery of Domains (Zero Hardcoding)
  const domainSummaries = {};
  const candidateDomainDirs = [];

  // 4.1 Auto-discover src/features/*
  const featuresDir = path.resolve('src', 'features');
  if (fs.existsSync(featuresDir)) {
    for (const dirName of fs.readdirSync(featuresDir)) {
      const fullDir = path.join(featuresDir, dirName);
      if (fs.statSync(fullDir).isDirectory()) {
        candidateDomainDirs.push({
          key: `features/${dirName}`,
          dirPath: fullDir,
          relativePrefix: `src/features/${dirName}`,
          type: 'feature',
        });
      }
    }
  }

  // 4.2 Auto-discover all other src/ directories (pages, services, components/*, utils/*, etc.)
  const scanParents = ['pages', 'services', 'components', 'utils', 'lib'];
  for (const parent of scanParents) {
    const parentPath = path.resolve('src', parent);
    if (fs.existsSync(parentPath) && fs.statSync(parentPath).isDirectory()) {
      // Check parent directory itself for index.ts/tsx with @domain
      const pIdxTs = path.join(parentPath, 'index.ts');
      const pIdxTsx = path.join(parentPath, 'index.tsx');
      const pCheck = fs.existsSync(pIdxTs) ? pIdxTs : fs.existsSync(pIdxTsx) ? pIdxTsx : null;
      if (pCheck) {
        try {
          const content = fs.readFileSync(pCheck, 'utf8');
          if (content.includes('@domain')) {
            const typeMatch = content.match(/@type\s+([^\n\r*]+)/);
            candidateDomainDirs.push({
              key: parent,
              dirPath: parentPath,
              relativePrefix: `src/${parent}`,
              type: typeMatch
                ? typeMatch[1].trim()
                : parent === 'pages'
                  ? 'page'
                  : parent === 'services'
                    ? 'service'
                    : 'module',
            });
          }
        } catch (_e) {
          // ignore
        }
      }

      // Check subdirectories under parent
      for (const sub of fs.readdirSync(parentPath)) {
        const subPath = path.join(parentPath, sub);
        if (
          fs.statSync(subPath).isDirectory() &&
          !candidateDomainDirs.some((c) => c.dirPath === subPath)
        ) {
          const idxTs = path.join(subPath, 'index.ts');
          const idxTsx = path.join(subPath, 'index.tsx');
          const checkFile = fs.existsSync(idxTs) ? idxTs : fs.existsSync(idxTsx) ? idxTsx : null;
          if (checkFile) {
            try {
              const fileContent = fs.readFileSync(checkFile, 'utf8');
              if (fileContent.includes('@domain')) {
                const typeMatch = fileContent.match(/@type\s+([^\n\r*]+)/);
                candidateDomainDirs.push({
                  key: `${parent}/${sub}`,
                  dirPath: subPath,
                  relativePrefix: `src/${parent}/${sub}`,
                  type: typeMatch
                    ? typeMatch[1].trim()
                    : parent === 'services'
                      ? 'service'
                      : parent === 'utils'
                        ? 'engine'
                        : parent === 'components'
                          ? 'ui-module'
                          : 'module',
                });
              }
            } catch (_e) {
              // ignore
            }
          }
        }
      }
    }
  }

  for (const domain of candidateDomainDirs) {
    const meta = getDomainMetadata(domain.key, domain.dirPath);
    const domainObj = {
      name: meta.name,
      type: domain.type,
      summary: meta.summary,
      entryPoints: [],
    };

    // Find actual entryPoints (index.ts first, then pages, then top-level components/files)
    const entryCandidates = [];
    const indexFiles = ['index.ts', 'index.tsx'];
    for (const idx of indexFiles) {
      const full = path.join(domain.dirPath, idx);
      if (fs.existsSync(full)) {
        entryCandidates.push(path.relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
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
    // If no index and no pages, check root domain files
    if (entryCandidates.length === 0) {
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
    }

    const validEntryPoints = Array.from(new Set(entryCandidates)).filter((p) =>
      fs.existsSync(path.resolve(p))
    );
    if (validEntryPoints.length > 0) {
      domainObj.entryPoints = validEntryPoints.slice(0, 10);
    }

    // Dynamic AST scan for stores, direct dbTables, RPCs, externalIntegrations
    const storesUsed = new Set();
    const tablesUsed = new Set();
    const rpcsUsed = new Set();
    const integrationsUsed = new Set();

    for (const sourceFile of sourceFiles) {
      const rel = path.relative(process.cwd(), sourceFile.getFilePath()).replace(/\\/g, '/');
      const isFileInDomain = rel.startsWith(domain.relativePrefix);

      if (!isFileInDomain) continue;

      // Extract real AST identifiers (ignoring comments/JSDoc)
      const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
      const usedIdentifiers = new Set(identifiers.map((id) => id.getText()));

      // Scan for store usages
      for (const storeName of Object.keys(globalStores)) {
        if (usedIdentifiers.has(storeName)) {
          if (rel.endsWith(`stores/${storeName}.ts`)) continue;
          storesUsed.add(storeName);
        }
      }

      // Direct DB table usages
      const fileText = sourceFile.getFullText();
      const fromMatches = fileText.matchAll(
        /\.from\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g
      );
      for (const match of fromMatches) {
        tablesUsed.add(match[1]);
      }

      // Direct RPC usages
      const rpcMatches = fileText.matchAll(
        /\.rpc\s*(?:<[^>]+>)?\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g
      );
      for (const match of rpcMatches) {
        rpcsUsed.add(match[1]);
      }

      // JSDoc annotations @table and @rpc in domain source files
      const tableDocMatches = fileText.matchAll(/@table\s+([a-zA-Z0-9_]+)/g);
      for (const m of tableDocMatches) {
        tablesUsed.add(m[1]);
      }
      const rpcDocMatches = fileText.matchAll(/@rpc\s+([a-zA-Z0-9_]+)/g);
      for (const m of rpcDocMatches) {
        rpcsUsed.add(m[1]);
      }

      // Dynamic / Tagged external integrations (@integration <Name>)
      const integrationTags = fileText.matchAll(/@integration\s+([^\n\r*]+)/g);
      for (const m of integrationTags) {
        integrationsUsed.add(m[1].trim());
      }

      // SDK package patterns
      const SDK_PATTERNS = [
        { name: 'Supabase Auth', match: ['@supabase', 'supabaseClient'] },
        { name: 'GoogleSignIn', match: ['GoogleSignIn', '@capawesome/capacitor-google-sign-in'] },
        { name: 'TossAuth', match: ['tossGameLogin', 'tossGameCenter', 'tossAuth'] },
        { name: 'AdMob', match: ['@capacitor-community/admob', 'AdService', 'adService'] },
        { name: 'Sentry', match: ['@sentry'] },
        { name: 'Capacitor', match: ['@capacitor/core', '@capacitor/app'] },
      ];

      for (const sdk of SDK_PATTERNS) {
        if (
          sdk.match.some((keyword) => usedIdentifiers.has(keyword) || fileText.includes(keyword))
        ) {
          integrationsUsed.add(sdk.name);
        }
      }
    }

    if (storesUsed.size > 0) {
      domainObj.stores = Array.from(storesUsed).sort();
    }
    if (tablesUsed.size > 0) {
      domainObj.dbTables = Array.from(tablesUsed).sort();
    }
    if (rpcsUsed.size > 0) {
      domainObj.dbRpcs = Array.from(rpcsUsed).sort();
    }
    if (integrationsUsed.size > 0) {
      domainObj.externalIntegrations = Array.from(integrationsUsed).sort();
    }

    domainSummaries[domain.key] = domainObj;
  }

  const dbTablesMap = {};
  for (const tbl of Array.from(allDbTables).sort()) {
    dbTablesMap[tbl] = getTableDescription(tbl);
  }

  const dbRpcsMap = {};
  for (const rpc of Array.from(allDbRpcs).sort()) {
    dbRpcsMap[rpc] = getRpcDescription(rpc);
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
      rpcs: dbRpcsMap,
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
