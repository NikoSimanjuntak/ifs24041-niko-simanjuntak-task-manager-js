const fs = require('node:fs');
const path = require('node:path');

/**
 * Membaca daftar tugas dari file JSON.
 * - File belum ada  -> [] (pengguna baru).
 * - File rusak      -> disalin ke <file>.bak lalu [] (data lama tidak hilang).
 */
function loadTasks(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('bukan array');
    return data;
  } catch {
    fs.copyFileSync(file, `${file}.bak`);
    return [];
  }
}

/** Tulis ke file sementara lalu rename, agar file asli tidak setengah tertulis. */
function saveTasks(file, tasks) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(tasks, null, 2));
  fs.renameSync(tmp, file);
}

module.exports = { loadTasks, saveTasks };
