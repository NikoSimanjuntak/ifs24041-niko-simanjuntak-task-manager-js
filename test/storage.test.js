const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadTasks, saveTasks } = require('../src/storage');

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tm-')), 'tasks.json');

test('loadTasks: file belum ada mengembalikan array kosong', () => {
  assert.deepStrictEqual(loadTasks(tmp()), []);
});

test('loadTasks: file JSON rusak tidak membuat program crash', () => {
  const f = tmp();
  fs.writeFileSync(f, '{rusak');
  assert.deepStrictEqual(loadTasks(f), []);
  assert.ok(fs.existsSync(f + '.bak'), 'file rusak harus dibackup');
});

test('saveTasks lalu loadTasks: data konsisten', () => {
  const f = tmp();
  saveTasks(f, [{ id: 1, title: 'A' }]);
  assert.deepStrictEqual(loadTasks(f), [{ id: 1, title: 'A' }]);
});
