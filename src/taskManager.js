class TaskManager {
  constructor(tasks = []) {
    this.tasks = tasks;
  }

  add(title, due) {
    const task = {
      id: this.tasks.length + 1,
      title,
      due,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  complete(id) {
    const task = this.tasks.find((t) => t.id === id);
    task.done = true;
    return task;
  }

  remove(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  list(status = 'all') {
    let result = this.tasks;
    if (status === 'done') result = result.filter((t) => t.done);
    if (status === 'pending') result = result.filter((t) => !t.done);
    return [...result].sort((a, b) => a.due.localeCompare(b.due));
  }
}

module.exports = { TaskManager };
