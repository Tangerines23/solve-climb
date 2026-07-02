import { Project } from 'ts-morph';
import fs from 'fs';
import path from 'path';

function main() {
  console.log('Starting Optimized Logic Flowchart generation...');
  const tsConfigPath = path.resolve('tsconfig.json');
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');
  console.log(`Found ${sourceFiles.length} source files to analyze.`);

  const nodes = {};
  const connections = [];

  // Helper to categorize folders
  const getCategory = (relPath) => {
    const parts = relPath.split('/');
    if (parts.length > 2 && parts[0] === 'src') {
      if (parts[1] === 'features') {
        return `features/${parts[2]}`; // e.g., features/auth, features/quiz
      }
      return parts[1]; // e.g., components, stores, utils, pages
    }
    return 'other';
  };

  // 1. Scan files
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // Filter out tests, stories, mocks
    if (
      relativePath.includes('__tests__') ||
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.') ||
      relativePath.includes('.stories.') ||
      relativePath.startsWith('scripts/')
    ) {
      continue;
    }

    const category = getCategory(relativePath);
    const basename = path.basename(relativePath, path.extname(relativePath));
    const nodeId = relativePath.replace(/[^a-zA-Z0-9]/g, '_');

    nodes[nodeId] = {
      id: nodeId,
      label: basename,
      category,
      path: relativePath,
    };

    // Resolve imports
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      let importedFilePath = null;

      if (
        moduleSpecifier.startsWith('.') ||
        moduleSpecifier.startsWith('src/') ||
        moduleSpecifier.startsWith('@/')
      ) {
        let resolved = null;
        if (moduleSpecifier.startsWith('@/')) {
          resolved = path.resolve('src', moduleSpecifier.slice(2));
        } else if (moduleSpecifier.startsWith('src/')) {
          resolved = path.resolve(moduleSpecifier);
        } else {
          resolved = path.resolve(path.dirname(filePath), moduleSpecifier);
        }

        const exts = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
        for (const ext of exts) {
          const testPath = resolved + ext;
          if (fs.existsSync(testPath)) {
            importedFilePath = testPath;
            break;
          }
        }
        if (!importedFilePath && fs.existsSync(resolved)) {
          importedFilePath = resolved;
        }
      }

      if (importedFilePath) {
        const importedRelPath = path.relative(process.cwd(), importedFilePath).replace(/\\/g, '/');
        const targetNodeId = importedRelPath.replace(/[^a-zA-Z0-9]/g, '_');
        connections.push({ from: nodeId, to: targetNodeId });
      }
    }
  }

  // --- DIAGRAM 1: ARCHITECTURE LEVEL (DIRECTORY DEPENDENCIES) ---
  // Connects directory groups together (e.g. pages -> features/quiz -> stores)
  const dirConnections = new Set();
  for (const conn of connections) {
    const fromNode = nodes[conn.from];
    const toNode = nodes[conn.to];
    if (fromNode && toNode && fromNode.category !== toNode.category) {
      // Ignore other category or very minor categories to keep clean
      if (fromNode.category === 'other' || toNode.category === 'other') continue;
      dirConnections.add(`${fromNode.category} --> ${toNode.category}`);
    }
  }

  const prettyCategoryName = (cat) => {
    const names = {
      components: '🎨 Shared UI Components',
      stores: '📦 Zustand Stores',
      utils: '🛠️ Utilities',
      pages: '📄 Pages',
      services: '🔌 Services',
      config: '⚙️ Configuration',
    };
    return names[cat] || `📁 ${cat}`;
  };

  let archMermaid = '```mermaid\ngraph TD\n';
  // Declare nodes with pretty labels
  const categoriesInUse = new Set();
  for (const connStr of dirConnections) {
    const [from, to] = connStr.split(' --> ');
    categoriesInUse.add(from);
    categoriesInUse.add(to);
  }
  for (const cat of categoriesInUse) {
    archMermaid += `  ${cat.replace(/[^a-zA-Z0-9]/g, '_')}["${prettyCategoryName(cat)}"]\n`;
  }
  archMermaid += '\n  %% Connections\n';
  for (const connStr of dirConnections) {
    const [from, to] = connStr.split(' --> ');
    archMermaid += `  ${from.replace(/[^a-zA-Z0-9]/g, '_')} --> ${to.replace(/[^a-zA-Z0-9]/g, '_')}\n`;
  }
  archMermaid += '```\n';

  // --- DIAGRAM 2: CORE MODULE LEVEL (CORE FILES ONLY) ---
  // Filters nodes to only show Pages, Stores, Services, and top-level Feature Entry points.
  // Completely hides UI leaf components like AlertModal, confirmModal, layout shells, etc.
  const isCoreNode = (node) => {
    // 1. Pages and Stores are always core
    if (node.category === 'pages' || node.category === 'stores' || node.category === 'services')
      return true;
    if (node.path.includes('/pages/')) return true;

    // 2. Explicit app entry points
    if (node.label === 'App' || node.label === 'main') return true;

    // 3. Top-level feature layout or entry files (skip leaf components inside features)
    if (node.category.startsWith('features/')) {
      const parts = node.path.split('/');
      // e.g. src/features/quiz/QuizLayout.tsx or src/features/quiz/index.ts (if any) or top level page files
      if (parts.length === 4) {
        // src/features/name/Filename.ts
        // Skip minor utility or type files at top level if any
        if (node.label.toLowerCase().includes('type') || node.label.toLowerCase().includes('style'))
          return false;
        return true;
      }
      if (
        node.label.endsWith('Layout') ||
        node.label.endsWith('Page') ||
        node.label.endsWith('Service')
      )
        return true;
    }

    // 4. Major database or network utils
    if (node.label === 'supabaseClient' || node.label === 'haptic' || node.label === 'errorHandler')
      return true;

    return false;
  };

  const coreNodes = {};
  const coreSubgraphs = {};
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (isCoreNode(node)) {
      coreNodes[nodeId] = node;
      if (!coreSubgraphs[node.category]) {
        coreSubgraphs[node.category] = [];
      }
      coreSubgraphs[node.category].push(nodeId);
    }
  }

  // Map connections between core nodes
  const coreConnections = new Set();
  for (const conn of connections) {
    if (coreNodes[conn.from] && coreNodes[conn.to] && conn.from !== conn.to) {
      coreConnections.add(`${conn.from} --> ${conn.to}`);
    }
  }

  let coreMermaid = '```mermaid\ngraph TD\n';
  for (const [category, nodeIds] of Object.entries(coreSubgraphs)) {
    if (nodeIds.length === 0) continue;
    const label = prettyCategoryName(category);
    coreMermaid += `  subgraph ${category.replace(/[^a-zA-Z0-9]/g, '_')} ["${label}"]\n`;
    for (const nodeId of nodeIds) {
      const node = coreNodes[nodeId];
      coreMermaid += `    ${node.id}["${node.label}"]\n`;
    }
    coreMermaid += '  end\n\n';
  }
  coreMermaid += '  %% Relations\n';
  for (const connStr of coreConnections) {
    coreMermaid += `  ${connStr}\n`;
  }
  coreMermaid += '```\n';

  // 5. Output file
  const docPath = path.resolve('docs', 'code-flowchart.md');
  const outputContent = `# 🧗‍♂️ Solve Climb 핵심 로직 흐름도 (Code Flowchart)

이 문서는 프로젝트 내 주요 폴더(아키텍처) 및 핵심 비즈니스 로직(화면, 전역 상태, 데이터베이스) 간의 관계를 시각적으로 나타냅니다.
코드가 업데이트되거나 커밋될 때 자동으로 빌드되어 최신화됩니다.

---

## 🏛️ 1. 아키텍처 폴더 흐름도 (Architecture Level)
프로젝트 내 대분류 폴더 간의 상호작용 및 데이터 흐름을 나타냅니다. (가장 거시적인 구조도)

${archMermaid}

---

## 🎯 2. 핵심 모듈 흐름도 (Core File Level)
UI 모달, 토스트 등의 단순 디자인 파일을 제외한 **페이지(Pages), 상태 저장소(Zustand Stores), 핵심 기능 진입점(Features)** 간의 실질적인 호출 관계도입니다.

${coreMermaid}

---

## 💡 구성 요소 설명
* **📄 Pages**: 프로젝트의 메인 화면 단위 페이지들입니다.
* **📦 Zustand Stores**: 사용자 인증, 배지, 설정 등의 상태를 중앙 관리하는 전역 스토어입니다.
* **🔌 Services / Utilities**: API 클라이언트(Supabase) 및 진동/시간 계산 유틸리티들입니다.
* **📁 features/***: 로그인, 퀴즈, 마이페이지 등 도메인별 기능 컴포넌트 및 비즈니스 로직 진입점 영역입니다.
`;

  fs.writeFileSync(docPath, outputContent, 'utf-8');
  console.log(`Success! Optimized Logic Flowchart written to: ${docPath}`);
}

main();
