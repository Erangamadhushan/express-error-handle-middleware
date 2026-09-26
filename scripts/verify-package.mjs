import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const smokeDirectory = mkdtempSync(join(tmpdir(), "express-error-kit-"));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npmExecutable = process.env.npm_execpath;

const runNpm = (args, options = {}) => {
  const command = npmExecutable ? process.execPath : npmCommand;
  const commandArgs = npmExecutable ? [npmExecutable, ...args] : args;
  const commandOptions = npmExecutable
    ? options
    : { ...options, shell: process.platform === "win32" };

  return execFileSync(command, commandArgs, commandOptions);
};

try {
  const packOutput = runNpm(
    ["pack", "--json", "--pack-destination", smokeDirectory],
    { cwd: root, encoding: "utf8" },
  );
  const [{ filename }] = JSON.parse(packOutput);

  runNpm(
    [
      "install",
      "--no-save",
      "--ignore-scripts",
      join(smokeDirectory, filename),
    ],
    { cwd: smokeDirectory, stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    ["-e", "const kit = require('@erangamadhushan/express-error-handle-middleware'); if (!kit.errorMiddleware || !kit.ApiError) process.exit(1)"],
    { cwd: smokeDirectory, stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    ["--input-type=module", "-e", "const kit = await import('@erangamadhushan/express-error-handle-middleware'); if (!kit.errorMiddleware || !kit.ApiError) process.exit(1)"],
    { cwd: smokeDirectory, stdio: "inherit" },
  );
} finally {
  rmSync(smokeDirectory, { recursive: true, force: true });
}