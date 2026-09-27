const BLOCKED_NAMES = /^(\.env|\.env\..+|\.pem|\.key|\.p12|\.pfx|id_rsa|id_ed25519|node_modules|\.git)$/i;
const BLOCKED_EXT = /\.(exe|dll|so|dylib|bin|class|pyc|wasm|obj|o|a|lib|db|sqlite|sqlite3)$/i;
const MAX_FILE_SIZE = 200 * 1024; // 200 KB
const MAX_ZIP_SIZE = 15 * 1024 * 1024; // 15 MB

function isBlocked(filePath) {
  const parts = filePath.split('/');
  for (const part of parts) {
    if (BLOCKED_NAMES.test(part)) return true;
  }
  if (BLOCKED_EXT.test(filePath)) return true;
  return false;
}

function guardTree(files) {
  return files.filter((f) => {
    if (isBlocked(f.path)) return false;
    if (f.size > MAX_FILE_SIZE) return false;
    // Block path traversal
    if (f.path.includes('..')) return false;
    return true;
  });
}

module.exports = { guardTree, MAX_ZIP_SIZE, isBlocked };
