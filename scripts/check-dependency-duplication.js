import { execSync } from 'child_process';

/**
 * Dependency Duplication Guardian
 * 'npm ls --all --json' 결과를 분석하여 프로젝트 내에
 * 동일한 패키지가 서로 다른 버전으로 중복 포함되어 있는지 체크합니다.
 */

function checkDuplicates() {
  console.log('📦 [Dependency Guardian] 중복 의존성 분석 시작...');

  try {
    const output = execSync('npm ls --all --json', {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const data = JSON.parse(output);

    const versionMap = new Map();

    function walk(deps) {
      if (!deps) return;

      for (const [name, info] of Object.entries(deps)) {
        if (!versionMap.has(name)) {
          versionMap.set(name, new Set());
        }

        if (info.version) {
          versionMap.get(name).add(info.version);
        }

        if (info.dependencies) {
          walk(info.dependencies);
        }
      }
    }

    walk(data.dependencies);

    const duplicates = [];
    for (const [name, versions] of versionMap.entries()) {
      if (versions.size > 1) {
        // peerDependencies 등으로 인한 의도적 중복이나 아주 작은 유틸리티는 제외 가능 (화이트리스트)
        const IGNORE_DUPLICATES = [
          '@types/node',
          'react-is',
          'hoist-non-react-statics',
          'chalk',
          'commander',
          'semver',
          'ansi-styles',
          'ansi-regex',
          'strip-ansi',
          'wrap-ansi',
          'debug',
          'tslib',
          'fs-extra',
          'signal-exit',
          'slice-ansi',
          'is-fullwidth-code-point',
          'string-width',
          'emoji-regex',
          'env-paths',
          'kleur',
          'ini',
          'open',
          'define-lazy-prop',
          'is-docker',
          'is-wsl',
          'xmlbuilder',
          'chownr',
          'yallist',
          'picomatch',
          'magic-string',
          'unplugin',
          'glob-parent',
          'webpack-virtual-modules',
          'estree-walker',
          'strip-indent',
          'ajv',
          'json-schema-traverse',
          'is-unicode-supported',
          'get-stream',
          'is-stream',
          'pretty-ms',
          'parse-ms',
          'path-key',
          'source-map',
          'aria-query',
          'dom-accessibility-api',
          'lru-cache',
          'tinyrainbow',
          'tar-fs',
          'tar-stream',
          'parent-module',
          'resolve-from',
          'eslint-visitor-keys',
          'globals',
          'ignore',
          'strip-json-comments',
          'whatwg-mimetype',
          'ws',
          'type-fest',
          'devtools-protocol',
          'data-uri-to-buffer',
          'ast-types',
          'ansi-escapes',
          'cli-cursor',
          'restore-cursor',
          'onetime',
          'module-definition',
          'ast-module-types',
          'node-source-walk',
          'mute-stream',
          'pretty-bytes',
          '@vitejs/plugin-react',
          '@rolldown/pluginutils',
          'react-refresh',
          'https-proxy-agent',
          'agent-base',
          'node-fetch',
          'whatwg-url',
          'tr46',
          'webidl-conversions',
          'which',
          '@inquirer/figures',
          '@inquirer/external-editor',
          '@opentelemetry/semantic-conventions',
          '@open-draft/deferred-promise',
          'set-cookie-parser',
        ];
        if (IGNORE_DUPLICATES.includes(name)) continue;

        duplicates.push({ name, versions: Array.from(versions) });
      }
    }

    if (duplicates.length > 0) {
      console.log('\n❌ 중복된 의존성이 발견되었습니다:');
      duplicates.forEach(({ name, versions }) => {
        console.log(`  - ${name}: [${versions.join(', ')}]`);
      });

      console.log('\n💡 해결 방법:');
      console.log('  1. "npm dedupe" 명령어를 실행하여 가능한 중복을 제거하세요.');
      console.log(
        '  2. package.json의 버전을 하나로 통일하거나 overrides(npm) / resolutions(yarn)를 사용하세요.'
      );

      // 심각한 중복(번들 크기에 영향이 큰 것)이 아니면 경고만 하고 통과할 수도 있지만,
      // 여기서는 품질 강화를 위해 실패 처리합니다.
      process.exit(1);
    } else {
      console.log('✅ 중복된 의존성이 없습니다. 깨끗한 종속성 트리를 유지하고 있습니다.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
    // npm ls가 에러를 낼 수 있으므로 (missing peer 등), 이 경우는 경고 후 종료
    process.exit(1);
  }
}

checkDuplicates();
