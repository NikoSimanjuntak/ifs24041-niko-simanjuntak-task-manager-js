const { TaskManager } = require('./taskManager');
const { loadTasks, saveTasks } = require('./storage');
const { loadConfig } = require('./config');

const HELP = `Task Manager CLI

Penggunaan: tm <perintah> [argumen]

Perintah:
  init                           Siapkan file data
  add "<judul>" [--due YYYY-MM-DD]   Tambah tugas
  list [--status all|pending|done]   Tampilkan tugas
  done <id>                      Tandai tugas selesai
  delete <id>                    Hapus tugas
  help                           Tampilkan bantuan

Variabel lingkungan:
  TM_DATA_FILE   Lokasi file data (default: data/tasks.json)
  NO_COLOR       Matikan warna`;

/** Parser argumen minimalis: kembalikan { _: [posisi], flag: nilai }. */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Opsi ${argv[i]} membutuhkan nilai`);
      }
      out[argv[i].slice(2)] = value;
      i++;
    } else {
      out._.push(argv[i]);
    }
  }
  return out;
}

function paint(enabled, code, text) {
  return enabled ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function formatList(tm, tasks, color) {
  if (tasks.length === 0) return 'Belum ada tugas.';
  const lines = tasks.map((t) => {
    const box = t.done ? paint(color, 32, '[x]') : '[ ]';
    const due = t.due ? `(tenggat ${t.due})` : '(tanpa tenggat)';
    const late = tm.isOverdue(t) ? paint(color, 31, ' TERLAMBAT') : '';
    return `${String(t.id).padStart(3)}  ${box} ${t.title} ${due}${late}`;
  });
  return lines.join('\n');
}

/**
 * Titik masuk CLI. Dependensi (out, err, env) disuntikkan agar bisa diuji
 * tanpa menyentuh terminal asli. Mengembalikan exit code.
 */
function run(argv, { out = console.log, err = console.error, env = process.env } = {}) {
  const [cmd, ...rest] = argv;

  try {
    const args = parseArgs(rest);
    const config = loadConfig(env);
    if (!cmd || cmd === 'help' || cmd === '--help') {
      out(HELP);
      return 0;
    }
    if (cmd === 'init') {
      saveTasks(config.dataFile, loadTasks(config.dataFile));
      out(`Siap. File data: ${config.dataFile}`);
      return 0;
    }

    const tm = new TaskManager(loadTasks(config.dataFile));

    switch (cmd) {
      case 'add': {
        const task = tm.add(args._[0], args.due);
        saveTasks(config.dataFile, tm.tasks);
        out(`Tugas #${task.id} ditambahkan: ${task.title}`);
        return 0;
      }
      case 'list':
        out(formatList(tm, tm.list(args.status || 'all'), config.color));
        return 0;
      case 'done': {
        const task = tm.complete(args._[0]);
        saveTasks(config.dataFile, tm.tasks);
        out(`Tugas #${task.id} selesai: ${task.title}`);
        return 0;
      }
      case 'delete': {
        const task = tm.remove(args._[0]);
        saveTasks(config.dataFile, tm.tasks);
        out(`Tugas #${task.id} dihapus: ${task.title}`);
        return 0;
      }
      default:
        err(`Perintah tidak dikenal: "${cmd}". Jalankan "tm help".`);
        return 1;
    }
  } catch (e) {
    err(`Error: ${e.message}`);
    return 1;
  }
}

module.exports = { run, parseArgs, formatList };
