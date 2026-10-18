const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run } = require('../src/cli');

/** Jalankan CLI dengan file data sementara dan tangkap output-nya. */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-cli-'));
  const env = { TM_DATA_FILE: path.join(dir, 'tasks.json'), NO_COLOR: '1' };
  return (...argv) => {
    const out = [];
    const err = [];
    const code = run(argv, { out: (s) => out.push(s), err: (s) => err.push(s), env });
    return { code, out: out.join('\n'), err: err.join('\n') };
  };
}

test('init membuat file data', () => {
  const tm = sandbox();
  const r = tm('init');
  assert.strictEqual(r.code, 0);
  assert.match(r.out, /Siap/);
});

test('alur lengkap: add -> list -> done -> delete', () => {
  const tm = sandbox();
  assert.strictEqual(tm('add', 'Belajar JS', '--due', '2099-01-01').code, 0);
  assert.match(tm('list').out, /\[ \] Belajar JS/);
  assert.strictEqual(tm('done', '1').code, 0);
  assert.match(tm('list', '--status', 'done').out, /\[x\] Belajar JS/);
  assert.strictEqual(tm('delete', '1').code, 0);
  assert.match(tm('list').out, /Belum ada tugas/);
});

test('data tersimpan antar pemanggilan (persistensi)', () => {
  const tm = sandbox();
  tm('add', 'Satu');
  tm('add', 'Dua');
  assert.match(tm('list').out, /Satu[\s\S]*Dua/);
});

test('tugas lewat tenggat diberi label TERLAMBAT', () => {
  const tm = sandbox();
  tm('add', 'Lama', '--due', '2020-01-01');
  assert.match(tm('list').out, /TERLAMBAT/);
});

test('error ditampilkan ke stderr dengan exit code 1', () => {
  const tm = sandbox();
  const r = tm('done', '42');
  assert.strictEqual(r.code, 1);
  assert.match(r.err, /tidak ditemukan/);
});

test('perintah tidak dikenal -> exit code 1', () => {
  assert.strictEqual(sandbox()('foo').code, 1);
});

test('--due tanpa nilai harus error, bukan diam-diam diabaikan', () => {
  const tm = sandbox();
  const r = tm('add', 'Tugas', '--due');
  assert.strictEqual(r.code, 1);
  assert.match(r.err, /--due/);
});

test('--status tidak valid ditolak', () => {
  const tm = sandbox();
  tm('add', 'A');
  const r = tm('list', '--status', 'selesai');
  assert.strictEqual(r.code, 1);
  assert.match(r.err, /Status tidak dikenal/);
});

test('ID non-angka ditolak dengan pesan jelas', () => {
  const tm = sandbox();
  const r = tm('done', 'abc');
  assert.strictEqual(r.code, 1);
  assert.match(r.err, /ID/);
});
