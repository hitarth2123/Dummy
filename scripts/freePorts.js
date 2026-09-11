#!/usr/bin/env node

const { execFileSync } = require('child_process');

const ports = process.argv.slice(2).map(Number).filter(Number.isInteger);
const portsToFree = ports.length ? ports : [3000, 5012, 7031];

const findListeners = (port) => {
  try {
    const output = execFileSync('lsof', ['-ti', `tcp:${port}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return [...new Set(output.split(/\s+/).filter(Boolean).map(Number))];
  } catch {
    return [];
  }
};

for (const port of portsToFree) {
  const pids = findListeners(port).filter((pid) => pid !== process.pid);
  if (!pids.length) {
    console.log(`[Ports] ${port} is free`);
    continue;
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`[Ports] Stopped PID ${pid} on port ${port}`);
    } catch (error) {
      if (error.code !== 'ESRCH') console.warn(`[Ports] Could not stop PID ${pid}: ${error.message}`);
    }
  }

  const remaining = findListeners(port).filter((pid) => pid !== process.pid);
  for (const pid of remaining) {
    try {
      process.kill(pid, 'SIGKILL');
      console.log(`[Ports] Force-stopped PID ${pid} on port ${port}`);
    } catch (error) {
      if (error.code !== 'ESRCH') console.warn(`[Ports] Could not force-stop PID ${pid}: ${error.message}`);
    }
  }
}
