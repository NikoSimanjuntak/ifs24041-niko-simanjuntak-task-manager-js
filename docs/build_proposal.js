const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageBreak, Footer,
  PageNumber, TabStopType,
} = require('docx');

const IMG = path.join(__dirname, 'images');
const FONT = 'Calibri';
const CONTENT_W = 9026; // A4 dengan margin 1 inci (DXA)

// ---------- helper ----------
function runs(text, base = {}) {
  // dukung **tebal** dan `kode`
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: tok.slice(1, -1), font: 'Consolas', size: 20, shading: { type: ShadingType.CLEAR, fill: 'EEF0F4' }, ...base }));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t), spacing: { after: 120, line: 300 }, alignment: AlignmentType.JUSTIFIED, ...o });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: false });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullets = (items) => items.map((t) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: runs(t), spacing: { after: 60, line: 290 } }));
const numbered = (items, ref = 'num') => items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 290 } }));
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
let figNo = 0;
function fig(file, caption, maxW = 590, maxH = 430) {
  figNo += 1;
  const full = path.join(IMG, file);
  const { w, h } = pngSize(full);
  let W = Math.min(maxW, w), H = (W * h) / w;
  if (H > maxH) { H = maxH; W = (H * w) / h; }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(full), transformation: { width: Math.round(W), height: Math.round(H) },
        altText: { title: caption, description: caption, name: file } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: `Gambar ${figNo}. ${caption}`, italics: true, size: 20, color: '555B6E' })] }),
  ];
}

const border = { style: BorderStyle.SINGLE, size: 4, color: 'B8BECC' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths, opts = {}) {
  const mk = (txt, w, head) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: head ? { type: ShadingType.CLEAR, fill: '1F3A68', color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: String(txt).split('\n').map((line) => new Paragraph({ spacing: { after: 20 },
      children: runs(line, head ? { bold: true, color: 'FFFFFF', size: 20 } : { size: 20 }) })),
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => mk(h, widths[i], true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, widths[i], false)) })),
    ],
  });
}
const gap = () => new Paragraph({ spacing: { after: 120 }, children: [] });
function code(lines) {
  return lines.map((l, i) => new Paragraph({
    spacing: { after: 0, line: 260 },
    shading: { type: ShadingType.CLEAR, fill: 'F1F3F7' },
    indent: { left: 200, right: 200 },
    border: i === 0 ? { top: { style: BorderStyle.SINGLE, size: 4, color: 'D0D5E0', space: 4 } } : (i === lines.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D5E0', space: 4 } } : undefined),
    children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 19 })],
  }));
}

// ---------- isi ----------
const c = [];

// Sampul
c.push(new Paragraph({ spacing: { before: 1800, after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'PROPOSAL PROYEK', size: 26, bold: true, color: '5B6B8C', characterSpacing: 60 })] }));
c.push(new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'Pengembangan Task Manager Sederhana', size: 52, bold: true, color: '1F3A68' })] }));
c.push(new Paragraph({ spacing: { after: 500 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'dengan JavaScript (Node.js) menggunakan AI Generatif sebagai Asisten Pemrograman', size: 30, color: '3A4668' })] }));
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 700 },
  children: [new TextRun({ text: 'Analisis - Perancangan - Prompting - Evaluasi Kode - Pengujian - Debugging - Perbaikan', size: 22, italics: true, color: '6B7490' })] }));
c.push(table(['Keterangan', 'Isi'], [
  ['Nama', '[isi nama Anda]'],
  ['NIM / Kelas', '[isi NIM / kelas]'],
  ['Mata kuliah / Dosen', '[isi mata kuliah dan dosen]'],
  ['Repositori GitHub', 'https://github.com/[username]/task-manager-js'],
  ['Tanggal', '18 Oktober 2026'],
], [2800, 6226]));
c.push(gap());
c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
  children: [new TextRun({ text: 'Seluruh hasil pengujian, tangkapan layar, dan riwayat perubahan dalam dokumen ini berasal dari proyek yang benar-benar dijalankan dan tersimpan di repositori.', size: 20, italics: true, color: '6B7490' })] }));
c.push(pageBreak());

// Daftar isi manual
c.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Daftar Isi')] }));
c.push(...numbered([
  'Pendahuluan', 'Analisis Kebutuhan', 'Perancangan Program', 'Strategi Penggunaan AI Generatif (Prompting)',
  'Menulis Kode dan Mengevaluasi Hasil AI', 'Pengujian dan Identifikasi Kesalahan', 'Debugging dan Perbaikan Kode',
  'Hasil Akhir dan Cara Menjalankan', 'Refleksi dan Penjelasan Keputusan', 'Penutup dan Lampiran',
], 'toc'));
c.push(pageBreak());

// 1
c.push(H1('1. Pendahuluan'));
c.push(H2('1.1 Latar Belakang'));
c.push(P('Pengelolaan tugas harian sering berantakan ketika hanya mengandalkan ingatan atau catatan acak. Aplikasi task manager membantu mencatat tugas, menetapkan tenggat, dan menandai progres. Pada saat yang sama, AI generatif seperti Claude, ChatGPT, atau Copilot kini mampu menghasilkan kode dengan cepat. Namun kode hasil AI **tidak otomatis benar**: ia bisa mengandung bug halus, melewatkan kasus tepi, atau terlihat meyakinkan padahal keliru.'));
c.push(P('Proyek ini membuat task manager sederhana berbasis JavaScript sekaligus mendemonstrasikan cara bekerja dengan AI secara bertanggung jawab: **merancang** sebelum menulis, **memberi instruksi** (prompt) yang spesifik, **mengevaluasi** kode yang dihasilkan secara kritis, **menguji**, **mengidentifikasi kesalahan**, **memperbaiki**, dan **menjelaskan alasan** setiap keputusan. AI diperlakukan sebagai asisten, bukan sebagai pengganti pemahaman programmer.'));
c.push(H2('1.2 Tujuan'));
c.push(...bullets([
  'Membangun aplikasi task manager CLI dengan JavaScript (Node.js) yang berfungsi dan teruji.',
  'Menunjukkan alur kerja pemrograman dengan AI: rancang, tulis, uji, debug, perbaiki.',
  'Mendokumentasikan contoh prompt beserta alasannya, serta cara menilai dan memperbaiki keluaran AI.',
  'Menyimpan seluruh hasil (kode, cara menjalankan, inisialisasi, konfigurasi, proposal) di GitHub.',
]));
c.push(H2('1.3 Ruang Lingkup dan Batasan'));
c.push(...bullets([
  '**Termasuk:** tambah, lihat (dengan filter), selesaikan, dan hapus tugas; tenggat opsional; penyimpanan JSON; konfigurasi; tes otomatis.',
  '**Tidak termasuk:** antarmuka grafis/web, akun pengguna multi-user, sinkronisasi cloud, notifikasi.',
  '**Batasan teknis:** hanya Node.js bawaan (tanpa library eksternal) agar mudah dijalankan dan dipahami.',
]));
c.push(H2('1.4 Manfaat'));
c.push(P('Bagi pembelajar, dokumen ini menjadi contoh nyata bahwa kualitas hasil AI sangat bergantung pada kualitas instruksi dan kedisiplinan verifikasi. Bagi penilai, setiap klaim dapat ditelusuri ke bukti: keluaran tes, riwayat commit git, dan kode di repositori.'));

// 2
c.push(H1('2. Analisis Kebutuhan'));
c.push(H2('2.1 Kebutuhan Fungsional'));
c.push(table(['Kode', 'Kebutuhan', 'Kriteria penerimaan'], [
  ['FR-01', 'Menambah tugas dengan judul dan tenggat opsional', 'Tugas tersimpan dengan ID unik; judul kosong ditolak; tanggal harus valid (YYYY-MM-DD)'],
  ['FR-02', 'Menampilkan daftar tugas', 'Terurut menurut tenggat terdekat; tugas tanpa tenggat di bagian akhir; bisa difilter all/pending/done'],
  ['FR-03', 'Menandai tugas selesai', 'Status berubah menjadi selesai; ID tidak ada menghasilkan pesan error jelas'],
  ['FR-04', 'Menghapus tugas', 'Tugas hilang dari daftar; ID baru tidak bentrok dengan ID lama'],
  ['FR-05', 'Menandai tugas terlambat', 'Tugas belum selesai dengan tenggat lampau diberi label TERLAMBAT'],
  ['FR-06', 'Menyimpan data permanen', 'Data tetap ada setelah program ditutup; file rusak tidak menyebabkan crash'],
], [900, 3000, 5126]));
c.push(gap());
c.push(H2('2.2 Kebutuhan Non-Fungsional'));
c.push(...bullets([
  '**Kemudahan dijalankan:** tanpa instalasi dependensi; satu perintah `node bin/tm.js`.',
  '**Keterujian (testability):** logika bisnis terpisah dari input/output agar dapat diuji otomatis.',
  '**Ketahanan:** input salah dan file data rusak ditangani dengan pesan jelas, bukan crash.',
  '**Keterbacaan:** kode modular dengan komentar singkat berbahasa Indonesia.',
  '**Portabilitas:** berjalan di Windows, macOS, dan Linux (Node.js 20+).',
]));
c.push(H2('2.3 Pemilihan Teknologi dan Alasannya'));
c.push(table(['Pilihan', 'Alternatif', 'Alasan memilih'], [
  ['Node.js (CLI)', 'Aplikasi web / React', 'Fokus proyek adalah proses dengan AI, bukan UI. CLI lebih kecil sehingga setiap baris kode AI bisa direview penuh.'],
  ['Penyimpanan file JSON', 'SQLite / database', 'Sederhana, mudah dibaca manusia, tanpa dependensi. Cukup untuk ratusan tugas.'],
  ['`node:test` bawaan', 'Jest / Mocha', 'Sudah ada di Node; menghilangkan instalasi library dan menyederhanakan CI.'],
  ['Tanpa library parser argumen', 'commander / yargs', 'Perintahnya hanya 6; parser kecil (±15 baris) mudah diuji dan dipahami.'],
], [2200, 2200, 4626]));
c.push(gap());

// 3
c.push(H1('3. Perancangan Program'));
c.push(H2('3.1 Arsitektur Modul'));
c.push(P('Program dibagi menjadi modul dengan satu tanggung jawab masing-masing. Pemisahan terpenting: **logika tugas (`taskManager.js`) tidak boleh menyentuh file atau terminal.** Dengan begitu logika dapat diuji cepat tanpa file sungguhan, dan penyimpanan dapat diganti tanpa mengubah logika.'));
c.push(...fig('fig_arsitektur.png', 'Arsitektur modul Task Manager: CLI memanggil config, logika tugas, dan penyimpanan.', 520, 330));
c.push(H2('3.2 Struktur Data'));
c.push(table(['Field', 'Tipe', 'Keterangan'], [
  ['id', 'number', 'ID terbesar yang ada + 1 (unik, tidak bentrok setelah penghapusan)'],
  ['title', 'string', 'Judul, di-trim, tidak boleh kosong'],
  ['due', 'string | null', 'Tenggat format YYYY-MM-DD, atau null jika tidak ada'],
  ['done', 'boolean', 'Status selesai'],
  ['createdAt', 'string (ISO 8601)', 'Waktu pembuatan'],
], [1700, 2400, 4926]));
c.push(gap());
c.push(H2('3.3 Alur Perintah'));
c.push(...numbered([
  '`bin/tm.js` meneruskan argumen terminal ke `run()` di `cli.js`.',
  '`cli.js` mem-parsing argumen dan memuat konfigurasi (env mengalahkan `config/default.json`).',
  'Data dibaca lewat `storage.loadTasks()` lalu dibungkus `TaskManager`.',
  'Perintah dijalankan; jika mengubah data, hasil disimpan lewat `storage.saveTasks()` (tulis ke file sementara lalu rename agar atomik).',
  'Error apa pun ditangkap satu tempat: pesan ke stderr dan exit code 1.',
], 'num2'));
c.push(H2('3.4 Keputusan Rancangan Penting'));
c.push(table(['Keputusan', 'Alasan', 'Konsekuensi / trade-off'], [
  ['`run(argv, {out, err, env})` menerima dependensi sebagai parameter', 'Agar CLI bisa diuji tanpa terminal sungguhan dan tanpa menyentuh data pengguna', 'Sedikit lebih verbose, tetapi tes end-to-end jadi mudah'],
  ['ID = max + 1, bukan counter terpisah', 'Menjaga format file tetap berupa array sederhana', 'ID tugas terakhir yang dihapus dapat dipakai ulang; dapat diterima untuk skala proyek ini'],
  ['Tugas tanpa tenggat selalu di akhir', 'Tugas bertenggat lebih mendesak untuk dilihat pengguna', 'Perlu pembanding khusus saat mengurutkan'],
  ['File rusak dibackup ke `.bak`, bukan ditimpa', 'Data pengguna tidak boleh hilang diam-diam', 'Ada file tambahan yang perlu dibersihkan manual'],
], [3000, 3200, 2826]));
c.push(gap());
c.push(H2('3.5 Rencana Pengujian'));
c.push(P('Sebelum meminta kode, ditetapkan bahwa tes harus mencakup (a) jalur normal, (b) kasus tepi: ID setelah penghapusan, ID tidak ada, judul kosong, tanggal mustahil, tugas tanpa tenggat, file belum ada, file JSON rusak, dan (c) alur end-to-end lewat CLI. Tes ditulis dengan `node:test` dan dijalankan dengan `npm test`.'));

// 4
c.push(H1('4. Strategi Penggunaan AI Generatif (Prompting)'));
c.push(H2('4.1 Siklus Kerja'));
c.push(P('Pekerjaan dengan AI diperlakukan sebagai siklus berulang, bukan sekali tanya. Setiap putaran selesai hanya ketika tes otomatis lulus.'));
c.push(...fig('fig_workflow.png', 'Siklus kerja: analisis, prompt, generate, review, uji, debug & perbaiki, lalu ulangi.', 540, 300));
c.push(H2('4.2 Prinsip Menyusun Instruksi'));
c.push(table(['Prinsip', 'Penerapan di proyek ini', 'Alasan'], [
  ['Berikan peran dan konteks', '"Kamu senior JavaScript developer... saya mahasiswa..."', 'Menyesuaikan kedalaman dan gaya penjelasan'],
  ['Nyatakan batasan', '"Tanpa library eksternal", "kelas tidak boleh I/O"', 'Mencegah solusi berlebihan dan menjaga desain bersih'],
  ['Minta rancangan sebelum kode', 'Prompt 1 meminta struktur modul + alasan', 'Menangkap kesalahan arsitektur lebih murah daripada kesalahan kode'],
  ['Satu tugas per instruksi', 'Prompt 2 hanya untuk `taskManager.js`', 'Hasil kecil mudah direview dan di-debug'],
  ['Sebut kasus tepi secara eksplisit', 'Prompt 3 mendaftar kasus tepi', 'AI cenderung menulis tes jalur bahagia saja'],
  ['Sertakan bukti saat debugging', 'Prompt 4 menempel kode + pesan error asli', 'Menghindari tebakan; fokus pada akar masalah'],
], [2400, 3500, 3126]));
c.push(gap());
c.push(H2('4.3 Contoh Instruksi, Gambar, dan Alasannya'));
c.push(P('Empat prompt berikut mewakili empat fase kerja. Di bawah tiap kartu dijelaskan **mengapa** instruksi dirumuskan demikian.'));
c.push(...fig('fig_prompt1.png', 'Prompt 1 (merancang): meminta struktur dan alasan sebelum kode.', 560, 300));
c.push(...fig('fig_prompt2.png', 'Prompt 2 (menulis): satu modul, dengan larangan I/O di logika.', 560, 260));
c.push(...fig('fig_prompt3.png', 'Prompt 3 (menguji): AI diminta menyerang kodenya sendiri lewat kasus tepi.', 560, 300));
c.push(...fig('fig_prompt4.png', 'Prompt 4 (debugging): menyertakan kode dan pesan error asli.', 560, 260));
c.push(H2('4.4 Kriteria Mengevaluasi Kode dari AI'));
c.push(P('Kode AI tidak pernah diterima begitu saja. Setiap hasil dinilai dengan daftar periksa berikut sebelum dan sesudah dijalankan:'));
c.push(table(['Pertanyaan evaluasi', 'Cara memeriksa'], [
  ['Apakah memenuhi seluruh kebutuhan (FR-01 s.d. FR-06)?', 'Cocokkan fitur dengan tabel kebutuhan'],
  ['Apa yang terjadi jika input kosong, salah, atau tidak ada?', 'Telusuri tiap fungsi dengan input ekstrem; tulis tesnya'],
  ['Adakah asumsi tersembunyi (mis. data selalu valid, file selalu ada)?', 'Cari akses properti tanpa pengecekan, I/O tanpa try/catch'],
  ['Apakah tanggung jawab modul bersih?', 'Logika tidak boleh memanggil console atau fs'],
  ['Apakah tes benar-benar membuktikan sesuatu?', 'Perkuat tes; curigai tes yang lulus terlalu mudah'],
  ['Bisakah saya menjelaskan setiap baris?', 'Jika tidak, minta AI menjelaskan atau sederhanakan'],
], [4600, 4426]));
c.push(gap());

// 5
c.push(H1('5. Menulis Kode dan Mengevaluasi Hasil AI'));
c.push(H2('5.1 Draf Awal (v1)'));
c.push(P('Draf pertama dari AI terdiri dari `taskManager.js` (±35 baris) dan `storage.js` (±12 baris). Secara sekilas kodenya rapi, mudah dibaca, dan "terlihat benar". Inilah jebakannya: **keterbacaan bukan bukti kebenaran.** Berikut cuplikan kritis dari v1:'));
c.push(...code([
  "add(title, due) {",
  "  const task = { id: this.tasks.length + 1, title, due, done: false, ... };",
  "}",
  "complete(id) {",
  "  const task = this.tasks.find((t) => t.id === id);",
  "  task.done = true;                      // jika task undefined -> crash",
  "}",
  "list(status) { ... .sort((a, b) => a.due.localeCompare(b.due)); }  // due bisa kosong",
  "loadTasks(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }  // file ada & valid?",
]));
c.push(gap());
c.push(H2('5.2 Hasil Review Manual (sebelum dijalankan)'));
c.push(P('Membaca v1 dengan daftar periksa pada bagian 4.4 menghasilkan lima kecurigaan. Semuanya kemudian dibuktikan atau dibantah oleh tes pada bab 6:'));
c.push(table(['No', 'Kecurigaan saat membaca kode', 'Prediksi'], [
  ['1', '`id = panjang array + 1` akan bentrok setelah ada penghapusan', 'ID duplikat'],
  ['2', '`find()` bisa mengembalikan `undefined`, lalu langsung diakses', 'Crash TypeError'],
  ['3', '`a.due.localeCompare` jika `due` kosong', 'Crash TypeError'],
  ['4', '`readFileSync` / `JSON.parse` tanpa penanganan error', 'Crash pada pengguna baru / file rusak'],
  ['5', 'Tidak ada validasi judul dan tanggal', 'Data sampah tersimpan'],
], [700, 6000, 2326]));
c.push(gap());
c.push(P('Poin positif v1 yang dipertahankan: pemisahan kelas dan penyimpanan, nama fungsi jelas, penggunaan `filter` yang immutable, dan penyalinan array sebelum `sort` (`[...result]`) sehingga data asli tidak berubah.'));

// 6
c.push(H1('6. Pengujian dan Identifikasi Kesalahan'));
c.push(H2('6.1 Kendala Pertama: Perintah Tes Gagal Dijalankan'));
c.push(P('Sebelum tes dapat berjalan, muncul kesalahan pada konfigurasi yang diusulkan AI: `"test": "node --test test/"`. Pada Node 22 perintah itu dianggap sebagai path modul dan berhenti dengan pesan **`Could not find \'test/\'`**. Perbaikannya: gunakan penemuan otomatis `node --test` (ditambah reporter `spec` agar hasil mudah dibaca). Pelajaran: bahkan skrip konfigurasi dari AI harus dijalankan, bukan dipercaya.'));
c.push(H2('6.2 Hasil Tes pada v1'));
c.push(...fig('fig_test_v1.png', 'Hasil npm test pada draf AI v1: 7 dari 10 tes gagal (baris merah).', 470, 340));
c.push(P('Tujuh kegagalan menunjuk ke bug nyata. Detail pesan error asli ditunjukkan pada gambar berikut.'));
c.push(...fig('fig_error_detail.png', 'Pesan error asli dari tiap tes yang gagal.', 540, 390));
c.push(H2('6.3 Pemetaan Gejala ke Akar Masalah'));
c.push(table(['Bug', 'Gejala di tes', 'Akar masalah', 'Dampak bagi pengguna'], [
  ['B1', 'ID duplikat: 2,2', 'ID dihitung dari `length + 1`', 'Menyelesaikan/menghapus tugas yang salah'],
  ['B2', 'TypeError ... setting \'done\'', '`find()` tidak dicek; `remove` diam-diam tidak melakukan apa pun', 'Crash dengan pesan teknis membingungkan'],
  ['B3', 'TypeError ... \'localeCompare\'', 'Pembanding mengasumsikan `due` selalu string', 'Crash saat ada tugas tanpa tenggat'],
  ['B4', 'ENOENT dan SyntaxError', 'Tidak menangani file belum ada / JSON rusak', 'Pengguna baru langsung crash; data bisa hilang'],
  ['B5', 'Missing expected exception (x2)', 'Tidak ada validasi judul & tanggal', 'Tugas tanpa judul & tanggal 2026-13-45 tersimpan'],
], [700, 2400, 3000, 2926]));
c.push(gap());
c.push(H2('6.4 Pelajaran: Tes yang Lulus Belum Tentu Benar'));
c.push(P('Pada draf pertama, tes "tugas tanpa tenggat tidak membuat crash" **lulus**, padahal bug B3 ada. Penyebabnya kebetulan: urutan pemanggilan pembanding oleh mesin JavaScript untuk array dua elemen membuat `due` yang kosong hanya berada di sisi argumen kedua, sehingga `localeCompare(undefined)` (yang membandingkan dengan teks "undefined") kebetulan memberi urutan yang benar. Ketika tes diperkuat dengan empat tugas (dua tanpa tenggat di posisi berbeda), kode langsung crash. Kesimpulan: **tes harus dirancang untuk mencoba menggagalkan kode**, bukan sekadar membuatnya hijau.'));

// 7
c.push(H1('7. Debugging dan Perbaikan Kode'));
c.push(P('Setiap perbaikan dibuat **minimal** dan terarah ke akar masalah, lalu seluruh tes dijalankan ulang untuk memastikan tidak ada regresi. Gambar di bawah menunjukkan perubahan kode (merah = dihapus, hijau = ditambah).'));
c.push(H2('7.1 B1 - ID Duplikat'));
c.push(P('**Diagnosis:** setelah menghapus tugas #1 dari [#1, #2], panjang array menjadi 1 sehingga tugas baru mendapat ID 2, sama dengan tugas yang sudah ada. **Keputusan:** hitung ID dari ID terbesar + 1. Alternatif UUID ditolak karena pengguna harus mengetik ID di terminal, jadi angka pendek lebih ramah.'));
c.push(...fig('fig_diff_id.png', 'Perbaikan B1: ID dari nilai maksimum + 1.', 560, 200));
c.push(H2('7.2 B2 - Tugas Tidak Ditemukan'));
c.push(P('**Diagnosis:** `find()` mengembalikan `undefined` bila ID tidak ada, lalu `task.done = true` melempar TypeError. **Keputusan:** satu metode `get()` yang dipakai bersama oleh `complete` dan `remove` dan melempar pesan berbahasa pengguna. `Number(id)` dipakai karena argumen CLI selalu berupa string.'));
c.push(...fig('fig_diff_get.png', 'Perbaikan B2: metode get() dengan pesan error yang jelas.', 560, 280));
c.push(H2('7.3 B3 - Pengurutan Tanpa Tenggat'));
c.push(P('**Diagnosis:** pembanding memanggil `.localeCompare` pada nilai kosong. **Keputusan:** pembanding eksplisit tiga cabang - tenggat sama dibandingkan ID (urutan stabil), kosong ke akhir, selain itu bandingkan teks tanggal. Format ISO `YYYY-MM-DD` sengaja dipilih karena urutan teksnya sama dengan urutan kronologis.'));
c.push(...fig('fig_diff_sort.png', 'Perbaikan B3: pembanding yang aman terhadap nilai kosong.', 560, 240));
c.push(H2('7.4 B4 dan B5 - Penyimpanan dan Validasi'));
c.push(P('**Penyimpanan:** `ENOENT` dianggap kondisi normal (pengguna baru) sehingga mengembalikan array kosong; JSON rusak disalin ke `.bak` sebelum mulai dari kosong sehingga data tidak hilang; penulisan memakai file sementara + rename agar file tidak pernah setengah tertulis.'));
c.push(...code([
  "try { raw = fs.readFileSync(file, 'utf8'); }",
  "catch (err) { if (err.code === 'ENOENT') return []; throw err; }",
  "try { const data = JSON.parse(raw); if (!Array.isArray(data)) throw ...; return data; }",
  "catch { fs.copyFileSync(file, `${file}.bak`); return []; }",
]));
c.push(gap());
c.push(P('**Validasi:** modul `validators.js` baru. Tanggal tidak cukup dicek dengan regex karena `2026-13-45` lolos regex; kode membuat objek `Date` UTC lalu memastikan tahun, bulan, dan hari tetap sama (round-trip) sehingga tanggal yang tidak ada di kalender ditolak.'));
c.push(H2('7.5 B6 - Ditemukan oleh Tes End-to-End'));
c.push(P('Setelah v2 lulus 10 tes inti, ditulis 9 tes CLI end-to-end. Satu gagal: `add "Tugas" --due` (tanpa nilai) **diam-diam menyimpan tugas tanpa tenggat**. Pengguna mengira tenggat tersimpan. Bug ini tidak terlihat oleh tes unit karena berada di lapisan parsing argumen. **Keputusan:** parser melempar error "Opsi --due membutuhkan nilai" - lebih baik gagal dengan suara keras daripada diam-diam salah.'));
c.push(...fig('fig_diff_args.png', 'Perbaikan B6: opsi tanpa nilai ditolak.', 560, 260));
c.push(H2('7.6 Ringkasan Hasil Tiap Iterasi'));
c.push(...fig('fig_chart.png', 'Jumlah tes lulus dan gagal pada tiap iterasi (data dari keluaran node --test).', 470, 260));
c.push(table(['Iterasi', 'Perubahan utama', 'Total tes', 'Lulus', 'Gagal'], [
  ['v1', 'Draf awal dari AI', '10', '3', '7'],
  ['v2', 'Perbaikan B1-B5, tambah validators, config, CLI', '10', '10', '0'],
  ['v2 + tes CLI', 'Ditambah 9 tes end-to-end', '19', '18', '1 (B6)'],
  ['v3', 'Perbaikan B6 pada parser argumen', '19', '19', '0'],
], [1600, 4026, 1100, 1100, 1200]));
c.push(gap());

// 8
c.push(H1('8. Hasil Akhir dan Cara Menjalankan'));
c.push(H2('8.1 Hasil Pengujian Akhir'));
c.push(...fig('fig_test_final.png', 'Hasil akhir npm test: 19 tes, 19 lulus, 0 gagal.', 520, 470));
c.push(H2('8.2 Demonstrasi Penggunaan'));
c.push(P('Gambar berikut adalah keluaran nyata program: inisialisasi, penambahan empat tugas, penyelesaian tugas #1, daftar dengan label TERLAMBAT (tenggat 1 Okt 2026 sudah lewat), penghapusan, dan filter pending. Perhatikan tugas tanpa tenggat berada di akhir daftar.'));
c.push(...fig('fig_demo.png', 'Contoh sesi penggunaan Task Manager.', 520, 470));
c.push(H2('8.3 Penanganan Error'));
c.push(...fig('fig_error_demo.png', 'Pesan error yang ramah untuk berbagai input salah.', 520, 260));
c.push(H2('8.4 Cara Menjalankan (ringkas)'));
c.push(...code([
  "git clone https://github.com/<username>/task-manager-js.git",
  "cd task-manager-js",
  "npm run init                                  # inisialisasi file data",
  "node bin/tm.js add \"Belajar JS\" --due 2026-11-01",
  "node bin/tm.js list",
  "npm test                                      # jalankan 19 tes",
]));
c.push(gap());
c.push(P('**Konfigurasi:** lokasi file data dan warna diatur di `config/default.json`, dan dapat ditimpa variabel lingkungan `TM_DATA_FILE` dan `NO_COLOR`. Panduan lengkap ada di `README.md` pada repositori.'));

// 9
c.push(H1('9. Refleksi dan Penjelasan Keputusan'));
c.push(H2('9.1 Apa yang Dilakukan AI dengan Baik'));
c.push(...bullets([
  'Menghasilkan kerangka kode dan struktur modul dengan cepat dan rapi.',
  'Menulis tes dan pesan error dalam jumlah besar saat diberi daftar kasus tepi yang jelas.',
  'Menjelaskan akar masalah ketika diberi kode dan pesan error asli.',
]));
c.push(H2('9.2 Kelemahan Kode AI yang Ditemukan'));
c.push(...bullets([
  '**Optimis berlebihan:** menganggap input selalu valid, file selalu ada, dan data selalu lengkap.',
  '**Gagal pada kasus tepi** yang tidak disebut eksplisit (ID setelah penghapusan, nilai kosong).',
  '**Konfigurasi yang tidak dijalankan:** skrip `npm test` gagal pada Node 22.',
  '**Percaya diri tanpa bukti:** kode terlihat benar padahal 7 dari 10 tes gagal.',
]));
c.push(H2('9.3 Ringkasan Keputusan dan Alasannya'));
c.push(table(['Keputusan', 'Alasan'], [
  ['Merancang sebelum meminta kode', 'Kesalahan arsitektur paling mahal diperbaiki belakangan'],
  ['Memisahkan logika dari I/O', 'Memungkinkan tes cepat dan penggantian penyimpanan'],
  ['Menulis tes sebelum memperbaiki', 'Bug terbukti nyata, dan perbaikan terukur'],
  ['Perbaikan minimal per bug', 'Mengurangi risiko regresi dan memudahkan review'],
  ['Gagal keras (error jelas) dibanding diam-diam', 'Pengguna tahu apa yang salah; data tidak rusak senyap'],
  ['Satu commit per iterasi', 'Riwayat git menjadi bukti proses yang bisa diaudit'],
  ['Backup file rusak, bukan menimpa', 'Data pengguna adalah aset; jangan hilang diam-diam'],
], [3800, 5226]));
c.push(gap());
c.push(H2('9.4 Etika dan Tanggung Jawab'));
c.push(P('Penggunaan AI diungkapkan secara terbuka dalam dokumen dan repositori. Tanggung jawab atas kebenaran kode tetap pada pengembang: setiap bagian dijalankan, diuji, dan dapat dijelaskan. Proyek ini tidak memuat data pribadi maupun kunci rahasia (`.gitignore` mengecualikan `data/*.json` dan `.env`).'));
c.push(H2('9.5 Pengembangan Lanjutan'));
c.push(...bullets([
  'Counter ID persisten agar ID tidak pernah dipakai ulang.',
  'Perintah `edit`, prioritas tugas, dan pencarian.',
  'Antarmuka web sederhana atau ekspor ke CSV.',
  'Tes cakupan (coverage) dan lint otomatis di GitHub Actions (CI dasar sudah disiapkan).',
]));

// 10
c.push(H1('10. Penutup dan Lampiran'));
c.push(H2('10.1 Kesimpulan'));
c.push(P('Proyek ini menunjukkan bahwa AI generatif sangat efektif mempercepat pemrograman, tetapi nilai terbesar muncul dari **proses manusia di sekitarnya**: merancang kebutuhan, menyusun prompt yang spesifik, mencurigai hasil, menguji dengan kasus tepi, mendiagnosis akar masalah, dan memperbaiki secara terukur. Draf pertama AI gagal pada 7 dari 10 tes; setelah tiga putaran evaluasi dan perbaikan, aplikasi lulus 19 dari 19 tes dan siap dijalankan oleh siapa pun lewat repositori GitHub.'));
c.push(H2('10.2 Lampiran A - Struktur Repositori'));
c.push(...code([
  "task-manager-js/",
  "|-- bin/tm.js                 titik masuk CLI",
  "|-- src/                      cli, taskManager, validators, storage, config",
  "|-- config/default.json       konfigurasi bawaan",
  "|-- data/                     lokasi tasks.json (tidak di-commit)",
  "|-- test/                     tes unit dan end-to-end (19 tes)",
  "|-- docs/                     proposal, gambar, bukti pengujian, skrip gambar",
  "|-- .github/workflows/ci.yml  CI GitHub Actions",
  "|-- README.md  LICENSE  package.json  .gitignore",
]));
c.push(gap());
c.push(H2('10.3 Lampiran B - Perintah Git untuk Mengunggah ke GitHub'));
c.push(...code([
  "git remote add origin https://github.com/<username>/task-manager-js.git",
  "git push -u origin main",
  "git log --oneline            # menampilkan riwayat iterasi v1 -> v3",
]));
c.push(gap());
c.push(H2('10.4 Lampiran C - Bukti Pengujian'));
c.push(P('Keluaran mentah tiap iterasi tersimpan di folder `docs/evidence/`: `test_v0_config_error.txt` (kegagalan skrip tes), `test_v1.txt` (7 gagal), `test_v2.txt` (10 lulus), `test_v2_cli.txt` (1 gagal ditemukan tes CLI), dan `test_v3_final.txt` (19 lulus).'));

// ---------- dokumen ----------
const doc = new Document({
  creator: 'Task Manager JS', title: 'Proposal Task Manager JS dengan AI Generatif',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, color: '1F3A68', font: FONT },
        paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '1F3A68', space: 4 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, color: '2F5597', font: FONT },
        paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
    ...['num', 'num2', 'toc'].map((r) => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] })),
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Proposal Task Manager JS dengan AI Generatif  |  Halaman ', size: 18, color: '7A8199' }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '7A8199' }) ] })] }) },
    children: c,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(path.join(__dirname, 'Proposal_Task_Manager_JS.docx'), buf);
  console.log('docx ok');
});
