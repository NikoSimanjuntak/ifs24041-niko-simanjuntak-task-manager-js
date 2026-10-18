const test = require('node:test');
const assert = require('node:assert');
const { TaskManager } = require('../src/taskManager');

test('add: membuat tugas dengan id unik', () => {
  const tm = new TaskManager();
  const a = tm.add('A', '2026-11-01');
  const b = tm.add('B', '2026-11-02');
  assert.notStrictEqual(a.id, b.id);
});

test('add: id tetap unik setelah ada tugas yang dihapus', () => {
  const tm = new TaskManager();
  tm.add('A', '2026-11-01');
  tm.add('B', '2026-11-02');
  tm.remove(1);
  const c = tm.add('C', '2026-11-03');
  const ids = tm.tasks.map((t) => t.id);
  assert.strictEqual(new Set(ids).size, ids.length, `ID duplikat: ${ids}`);
  assert.strictEqual(c.id, 3);
});

test('complete: id yang tidak ada melempar error yang jelas', () => {
  const tm = new TaskManager();
  assert.throws(() => tm.complete(99), /tidak ditemukan/);
});

test('list: tugas tanpa tenggat tidak membuat crash dan ditaruh di akhir', () => {
  const tm = new TaskManager();
  tm.add('Tanpa tenggat');
  tm.add('Ada tenggat', '2026-11-01');
  const titles = tm.list().map((t) => t.title);
  assert.deepStrictEqual(titles, ['Ada tenggat', 'Tanpa tenggat']);
});

test('add: judul kosong ditolak', () => {
  const tm = new TaskManager();
  assert.throws(() => tm.add('   ', '2026-11-01'), /judul/i);
});

test('add: tanggal tidak valid ditolak', () => {
  const tm = new TaskManager();
  assert.throws(() => tm.add('X', '2026-13-45'), /tanggal/i);
});

test('list: urutan stabil walau banyak tugas tanpa tenggat di berbagai posisi', () => {
  const tm = new TaskManager();
  tm.add('N1');
  tm.add('B', '2026-12-01');
  tm.add('N2');
  tm.add('A', '2026-11-01');
  const titles = tm.list().map((t) => t.title);
  assert.deepStrictEqual(titles, ['A', 'B', 'N1', 'N2']);
});
