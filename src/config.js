const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/**
 * Prioritas konfigurasi (tinggi -> rendah):
 *   1. Variabel lingkungan  TM_DATA_FILE, NO_COLOR
 *   2. config/default.json
 */
function loadConfig(env = process.env) {
  const defaults = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'config', 'default.json'), 'utf8')
  );
  const dataFile = path.resolve(ROOT, env.TM_DATA_FILE || defaults.dataFile);
  const color = env.NO_COLOR ? false : defaults.color;
  return { dataFile, color };
}

module.exports = { loadConfig };
