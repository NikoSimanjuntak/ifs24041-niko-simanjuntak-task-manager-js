const { validateTitle, validateDate } = require('./validators');

class TaskManager {
  constructor(tasks = []) {
    this.tasks = tasks;
  }

  /** ID berikutnya = ID terbesar + 1, sehingga tidak bentrok setelah penghapusan. */
  nextId() {
    return this.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }

  add(title, due) {
    const task = {
      id: this.nextId(),
      title: validateTitle(title),
      due: validateDate(due),
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  get(id) {
    const task = this.tasks.find((t) => t.id === Number(id));
    if (!task) throw new Error(`Tugas dengan ID ${id} tidak ditemukan`);
    return task;
  }

  complete(id) {
    const task = this.get(id);
    task.done = true;
    return task;
  }

  remove(id) {
    const task = this.get(id);
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    return task;
  }

  isOverdue(task, today = new Date().toISOString().slice(0, 10)) {
    return !task.done && task.due !== null && task.due < today;
  }

  /** Urut berdasarkan tenggat terdekat; tugas tanpa tenggat selalu di akhir. */
  list(status = 'all') {
    let result = this.tasks;
    if (status === 'done') result = result.filter((t) => t.done);
    else if (status === 'pending') result = result.filter((t) => !t.done);
    else if (status !== 'all') throw new Error(`Status tidak dikenal: "${status}"`);
    return [...result].sort((a, b) => {
      if (a.due === b.due) return a.id - b.id;
      if (a.due === null || a.due === undefined) return 1;
      if (b.due === null || b.due === undefined) return -1;
      return a.due < b.due ? -1 : 1;
    });
  }
}

module.exports = { TaskManager };
