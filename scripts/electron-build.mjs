import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const PNPM_VERSION = '11.15.1';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const localBin = join(root, 'node_modules', '.bin');
const wrapperDir = join(root, 'scripts', '.pnpm-wrapper');
const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
const pathSeparator = process.platform === 'win32' ? ';' : ':';

function ensurePnpmWrapper() {
  mkdirSync(wrapperDir, { recursive: true });

  if (process.platform === 'win32') {
    writeFileSync(
      join(wrapperDir, 'pnpm.cmd'),
      `@echo off\r\nnpx --yes pnpm@${PNPM_VERSION} %*\r\n`,
    );
    return;
  }

  const shWrapper = join(wrapperDir, 'pnpm');
  writeFileSync(shWrapper, `#!/bin/sh\nexec npx --yes pnpm@${PNPM_VERSION} "$@"\n`, { mode: 0o755 });
}

ensurePnpmWrapper();

const env = {
  ...process.env,
  [pathKey]: [wrapperDir, localBin, process.env[pathKey] ?? ''].filter(Boolean).join(pathSeparator),
  ELECTRON_MIRROR:
    process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR:
    process.env.ELECTRON_BUILDER_BINARIES_MIRROR || 'https://npmmirror.com/mirrors/electron-builder-binaries/',
};

const electronBuilderCli = require.resolve('electron-builder/cli.js');
const args = ['--config', 'electron-builder.yml', ...process.argv.slice(2)];

// Node 22+ rejects spawning .cmd/.bat without shell; invoke cli.js directly instead.
const result = spawnSync(process.execPath, [electronBuilderCli, ...args], {
  cwd: root,
  env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
