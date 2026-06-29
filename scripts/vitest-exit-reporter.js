export default class VitestExitReporter {
  onFinished(files, errors) {
    const hasErrors = errors && errors.length > 0;
    const exitCode = hasErrors ? 1 : 0;
    console.log(`[Vitest Exit Reporter] Finished. Exit code: ${exitCode}. Forcing exit...`);
    setTimeout(() => {
      process.exit(exitCode);
    }, 100);
  }
}
