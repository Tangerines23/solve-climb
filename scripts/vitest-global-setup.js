export function setup() {
  // setup
}

export function teardown() {
  console.log('[Vitest Global Setup] Teardown called. Forcing exit in 500ms...');
  setTimeout(() => {
    process.exit(0);
  }, 500);
}
