import fs from "node:fs";
import path from "node:path";

function findMonorepoRoot(start: string): string | null {
  let dir = path.resolve(start);
  for (let i = 0; i < 8; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          workspaces?: unknown;
        };
        if (pkg.workspaces) return dir;
      } catch {
        /* ignore */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/** Resolve AM2 CRM SQLite path (same file for web + api). */
export function resolveDatabasePath(cwd = process.cwd()): string {
  const repoRoot = findMonorepoRoot(cwd);

  if (process.env.DATABASE_PATH) {
    const raw = process.env.DATABASE_PATH;
    if (path.isAbsolute(raw)) return raw;
    const bases = [
      repoRoot,
      cwd,
      path.join(cwd, ".."),
      path.join(cwd, "../.."),
    ].filter((b): b is string => Boolean(b));
    for (const base of bases) {
      const resolved = path.resolve(base, raw);
      if (fs.existsSync(resolved) || fs.existsSync(path.dirname(resolved))) {
        return resolved;
      }
    }
    return path.resolve(repoRoot ?? cwd, raw);
  }

  const root = repoRoot ?? cwd;
  const candidates = [
    path.join(root, "apps", "web", "data", "am2.db"),
    path.join(cwd, "data", "am2.db"),
    path.join(cwd, "apps", "web", "data", "am2.db"),
    path.join(cwd, "..", "web", "data", "am2.db"),
    path.join(cwd, "..", "apps", "web", "data", "am2.db"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0]!;
}
