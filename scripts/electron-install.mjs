import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronPathFile = path.join(root, 'node_modules/electron/path.txt');

if (existsSync(electronPathFile)) {
  process.exit(0);
}

const installScript = path.join(root, 'node_modules/electron/install.js');
if (!existsSync(installScript)) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [installScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_MIRROR: process.env.ELECTRON_MIRROR || 'https://npmmirror.com/mirrors/electron/',
  },
});

process.exit(result.status ?? 1);
