import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { Project } from 'ts-morph';

function runBenchmark() {
  console.log('===============================================================');
  console.log('🔬 CODE MAP & ARCHITECTURE MAP 1:1 CODE FIDELITY BENCHMARK');
  console.log('===============================================================\n');

  const startTime = Date.now();

  const codeMapPath = path.resolve('docs', '.code-map.yaml');
  const archMapPath = path.resolve('docs', 'architecture-map.yaml');

  if (!fs.existsSync(codeMapPath) || !fs.existsSync(archMapPath)) {
    console.error('❌ Map files not found! Please run `npm run build:map` first.');
    process.exit(1);
  }

  const codeMap = yaml.load(fs.readFileSync(codeMapPath, 'utf8'));
  const archMap = yaml.load(fs.readFileSync(archMapPath, 'utf8'));

  const tsConfigPath = path.resolve('tsconfig.json');
  const project = new Project({ tsConfigFilePath: tsConfigPath });

  const allFiles = Object.keys(codeMap.files || {});
  const allDomains = Object.keys(archMap.domains || {});
  const allStores = Object.keys(archMap.globalStores || {});
  const allTables = Object.keys(archMap.database?.tables || {});

  console.log(
    `📊 Index Pool: ${allFiles.length} files, ${allDomains.length} domains, ${allStores.length} stores, ${allTables.length} tables.\n`
  );

  // 10 distinct samples spanning different layers of the architecture and code maps
  const sampleTargets = [
    { type: 'DOMAIN', key: 'features/quiz' },
    { type: 'DOMAIN', key: 'features/ranking' },
    { type: 'GLOBAL_STORE', key: 'useAuthStore' },
    { type: 'DATABASE_TABLE', key: 'profiles' },
    { type: 'REACT_PAGE', file: 'src/features/ranking/pages/RankingPage.tsx' },
    { type: 'REACT_COMPONENT', file: 'src/pages/ResultPage.tsx' },
    { type: 'CLASS_SERVICE', file: 'src/services/UserRepository.ts' },
    { type: 'CLASS_SERVICE', file: 'src/utils/sound/soundEngine.ts' },
    { type: 'GENERATOR_UTIL', file: 'src/features/quiz/generators/quizGenerator.ts' },
    { type: 'HOOK', file: 'src/features/ranking/hooks/useRanking.ts' },
  ];

  let totalAssertions = 0;
  let passedAssertions = 0;
  const sampleResults = [];

  for (let i = 0; i < sampleTargets.length; i++) {
    const target = sampleTargets[i];
    const index = i + 1;
    const result = {
      index,
      type: target.type,
      name: target.key || target.file,
      checks: [],
      score: 0,
      total: 0,
      passed: true,
    };

    console.log(`---------------------------------------------------------------`);
    console.log(`🧪 [Sample #${index}] [${target.type}] ${result.name}`);

    const assert = (label, condition, detail = '') => {
      totalAssertions++;
      result.total++;
      if (condition) {
        passedAssertions++;
        result.score++;
        result.checks.push({ label, status: 'PASS', detail });
        console.log(`   ✅ PASS: ${label} ${detail ? `(${detail})` : ''}`);
      } else {
        result.passed = false;
        result.checks.push({ label, status: 'FAIL', detail });
        console.log(`   ❌ FAIL: ${label} ${detail ? `(${detail})` : ''}`);
      }
    };

    if (target.type === 'DOMAIN') {
      const domainData = archMap.domains[target.key];
      assert('Domain in architecture-map.yaml', !!domainData);

      // Check physical directory
      const domainDir = path.resolve('src', target.key);
      assert('Physical domain directory exists', fs.existsSync(domainDir), domainDir);

      // Check JSDoc @domain in index.ts
      const indexPath = path.join(domainDir, 'index.ts');
      const indexExists = fs.existsSync(indexPath);
      assert('Domain index.ts exists', indexExists);
      if (indexExists) {
        const indexText = fs.readFileSync(indexPath, 'utf8');
        const hasDomainJSDoc = indexText.includes('@domain');
        assert('index.ts has @domain JSDoc metadata', hasDomainJSDoc);
      }

      // Check entryPoints
      if (domainData?.entryPoints) {
        for (const ep of domainData.entryPoints) {
          assert(`EntryPoint file exists: ${ep}`, fs.existsSync(path.resolve(ep)));
        }
      }

      // Check stores used
      if (domainData?.stores) {
        const domainFiles = fs.readdirSync(domainDir, { recursive: true });
        let allDomainText = '';
        for (const f of domainFiles) {
          const fp = path.join(domainDir, f.toString());
          if (fs.statSync(fp).isFile() && (fp.endsWith('.ts') || fp.endsWith('.tsx'))) {
            allDomainText += fs.readFileSync(fp, 'utf8') + '\n';
          }
        }
        for (const st of domainData.stores) {
          assert(`Store ${st} is actually used in domain`, allDomainText.includes(st));
        }
      }
    } else if (target.type === 'GLOBAL_STORE') {
      const storeName = target.key;
      const storeFile = path.resolve('src', 'stores', `${storeName}.ts`);
      assert('Store physical file exists', fs.existsSync(storeFile), storeFile);

      const sourceFile = project
        .getSourceFiles()
        .find((sf) => sf.getFilePath().endsWith(`${storeName}.ts`));
      assert('Source file parsed by TS AST', !!sourceFile);

      if (sourceFile) {
        const hasExport = sourceFile
          .getVariableDeclarations()
          .some((v) => v.getName() === storeName && v.isExported());
        assert(`Exported store variable '${storeName}' exists`, hasExport);
      }

      assert(`Store listed in architecture-map globalStores`, !!archMap.globalStores[storeName]);
    } else if (target.type === 'DATABASE_TABLE') {
      const tableName = target.key;
      assert(
        `Table '${tableName}' is listed in database.tables`,
        !!archMap.database?.tables[tableName]
      );

      // Scan actual codebase to confirm at least one file queries this table
      let tableFoundInCode = false;
      let matchedFile = '';
      for (const sf of project.getSourceFiles()) {
        const txt = sf.getFullText();
        if (txt.includes(`from('${tableName}')`) || txt.includes(`from("${tableName}")`)) {
          tableFoundInCode = true;
          matchedFile = path.relative(process.cwd(), sf.getFilePath()).replace(/\\/g, '/');
          break;
        }
      }
      assert(
        `Table '${tableName}' is actually queried in code with .from()`,
        tableFoundInCode,
        `Found in: ${matchedFile}`
      );
    } else {
      // CODE MAP File Level Verification
      const fileRelPath = target.file;
      const mapEntry = codeMap.files[fileRelPath];
      const fullPath = path.resolve(fileRelPath);

      assert('File exists on disk', fs.existsSync(fullPath), fileRelPath);
      assert('File is mapped in .code-map.yaml', !!mapEntry);

      const sourceFile = project.getSourceFiles().find((sf) => {
        const rel = path.relative(process.cwd(), sf.getFilePath()).replace(/\\/g, '/');
        return rel === fileRelPath;
      });

      assert('File parsed by AST compiler', !!sourceFile);

      if (sourceFile && mapEntry) {
        // 1. Verify Imports
        if (mapEntry.imports && mapEntry.imports.length > 0) {
          const actualImports = sourceFile
            .getImportDeclarations()
            .map((d) => d.getModuleSpecifierValue());
          for (const imp of mapEntry.imports.slice(0, 3)) {
            assert(`Import '${imp}' matches actual source code`, actualImports.includes(imp));
          }
        }

        // 2. Verify Exports (name & kind/type/interface/type alias)
        if (mapEntry.exports && mapEntry.exports.length > 0) {
          for (const exp of mapEntry.exports) {
            if (exp.type === 'class') {
              const cls = sourceFile.getClass(exp.name);
              assert(`Exported class '${exp.name}' exists in code`, !!cls && cls.isExported());
              if (cls && exp.methods) {
                const actualMethodNames = cls.getMethods().map((m) => m.getName());
                for (const m of exp.methods.slice(0, 3)) {
                  assert(
                    `Class method '${m.name}' exists in code`,
                    actualMethodNames.includes(m.name)
                  );
                }
              }
            } else {
              const hasFunc = sourceFile
                .getFunctions()
                .some((f) => f.getName() === exp.name && f.isExported());
              const hasVar = sourceFile
                .getVariableDeclarations()
                .some((v) => v.getName() === exp.name && v.isExported());
              const hasClass = sourceFile
                .getClasses()
                .some((c) => c.getName() === exp.name && c.isExported());
              const hasInterface = sourceFile
                .getInterfaces()
                .some((i) => i.getName() === exp.name && i.isExported());
              const hasType = sourceFile
                .getTypeAliases()
                .some((t) => t.getName() === exp.name && t.isExported());
              const hasEnum = sourceFile
                .getEnums()
                .some((e) => e.getName() === exp.name && e.isExported());
              assert(
                `Exported symbol '${exp.name}' (${exp.kind || exp.type || 'symbol'}) exists in code`,
                hasFunc || hasVar || hasClass || hasInterface || hasType || hasEnum
              );
            }
          }
        }

        // 3. Verify React State & Handlers
        if (mapEntry.state && mapEntry.state.length > 0) {
          const fileText = sourceFile.getFullText();
          for (const st of mapEntry.state.slice(0, 3)) {
            assert(`React useState '${st}' exists in component body`, fileText.includes(st));
          }
        }
        if (mapEntry.handlers && mapEntry.handlers.length > 0) {
          const fileText = sourceFile.getFullText();
          for (const h of mapEntry.handlers) {
            assert(`Event Handler '${h}' exists in component body`, fileText.includes(h));
          }
        }

        // 4. Verify Calls
        const firstExport = mapEntry.exports?.[0];
        if (firstExport && firstExport.calls && firstExport.calls.length > 0) {
          const fileText = sourceFile.getFullText();
          for (const callName of firstExport.calls.slice(0, 3)) {
            const cleanCall = callName.split(' ')[0].split('.')[0];
            assert(`Inner call target '${cleanCall}' exists in file`, fileText.includes(cleanCall));
          }
        }
      }
    }

    sampleResults.push(result);
  }

  const durationMs = Date.now() - startTime;
  const passRate = ((passedAssertions / totalAssertions) * 100).toFixed(1);

  console.log('\n===============================================================');
  console.log('📈 BENCHMARK RESULTS SUMMARY');
  console.log('===============================================================');
  console.log(`⏱️ Total Execution Time: ${durationMs}ms`);
  console.log(`🎯 Total Sample Items Analyzed: ${sampleTargets.length}`);
  console.log(`🔍 Total Individual Assertions: ${totalAssertions}`);
  console.log(`✅ Passed Assertions: ${passedAssertions}`);
  console.log(`❌ Failed Assertions: ${totalAssertions - passedAssertions}`);
  console.log(`🏆 1:1 Code Consistency Score: ${passRate}%\n`);

  console.log('📋 Sample Breakdown:');
  for (const r of sampleResults) {
    const icon = r.passed ? '✅' : '❌';
    console.log(
      `  ${icon} #${r.index} [${r.type}] ${r.name} - Score: ${r.score}/${r.total} assertions passed`
    );
  }
  console.log('===============================================================\n');

  return { passRate, totalAssertions, passedAssertions, sampleResults, durationMs };
}

runBenchmark();
