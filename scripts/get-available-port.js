#!/usr/bin/env node
/**
 * 사용 가능한 포트를 찾아 stdout으로 출력합니다.
 * 5173부터 순차 검사하여 점유되지 않은 첫 포트를 반환합니다.
 * E2E 테스트 병렬 실행 시 포트 충돌 방지용.
 */
import net from 'net';

const BASE_PORT = 5174;
const MAX_ATTEMPTS = 100;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const port = BASE_PORT + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${BASE_PORT}-${BASE_PORT + MAX_ATTEMPTS - 1}`);
}

findAvailablePort().then((port) => {
  process.stdout.write(String(port));
});
