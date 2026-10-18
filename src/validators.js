/** Validasi input pengguna. Dipisah dari logika bisnis agar mudah diuji. */

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error('Judul tugas tidak boleh kosong');
  }
  return title.trim();
}

/** Menerima 'YYYY-MM-DD' dan menolak tanggal yang tidak ada di kalender (mis. 2026-13-45). */
function validateDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!m) throw new Error(`Format tanggal tidak valid: "${value}" (gunakan YYYY-MM-DD)`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const real =
    dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  if (!real) throw new Error(`Tanggal tidak ada di kalender: "${value}"`);
  return String(value);
}

module.exports = { validateTitle, validateDate };
