const fs = require('node:fs');

function loadTasks(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function saveTasks(file, tasks) {
  fs.writeFileSync(file, JSON.stringify(tasks, null, 2));
}

module.exports = { loadTasks, saveTasks };
