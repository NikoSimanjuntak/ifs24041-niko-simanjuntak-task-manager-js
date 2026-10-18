"""Membuat gambar untuk proposal dari output nyata (docs/evidence & hasil run)."""
import re, textwrap
from PIL import Image, ImageDraw, ImageFont

OUT = "docs/images/"
FD = "/usr/share/fonts/truetype/dejavu/"
S = 2  # skala agar tajam

def F(name, size): return ImageFont.truetype(FD + name, size * S)
MONO, MONOB = "DejaVuSansMono.ttf", "DejaVuSansMono-Bold.ttf"
SANS, SANSB = "DejaVuSans.ttf", "DejaVuSans-Bold.ttf"

# ---------- Terminal ----------
BG, FG = (30, 32, 40), (220, 223, 228)
GREEN, RED, CYAN, YEL, GREY = (110, 220, 130), (240, 100, 100), (110, 200, 240), (240, 200, 110), (130, 136, 150)

def segs(line):
    """Pecah satu baris menjadi (teks, warna) mengikuti ANSI atau penanda ✔/✖/ℹ/$."""
    if "\x1b[" in line:
        out, color = [], FG
        for part in re.split(r"(\x1b\[\d+m)", line):
            m = re.fullmatch(r"\x1b\[(\d+)m", part)
            if m:
                color = {"32": GREEN, "31": RED, "0": FG}.get(m.group(1), FG)
            elif part:
                out.append((part, color))
        return out
    if line.startswith("$"):
        return [("$ ", GREEN), (line[2:], FG)]
    if line.startswith("✔"): return [("✔", GREEN), (line[1:], FG)]
    if line.startswith("✖"): return [("✖", RED), (line[1:], RED)]
    if line.startswith("ℹ"): return [("i", CYAN), (line[1:], CYAN)]
    if line.startswith("Error") or "Error:" in line[:25]: return [(line, RED)]
    if line.startswith("#"): return [(line, GREY)]
    return [(line, FG)]

def terminal(lines, name, title="Terminal", width_chars=None, hl=None):
    fnt = F(MONO, 15)
    cw = fnt.getlength("M")
    lh = int(15 * S * 1.45)
    clean_len = max(len(re.sub(r"\x1b\[\d+m", "", l)) for l in lines)
    w = int(max(width_chars or 0, clean_len + 4) * cw) + 40 * S
    top = 40 * S
    h = top + lh * len(lines) + 30 * S
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, top], fill=(48, 51, 62))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([(16 + i * 22) * S, 14 * S, (28 + i * 22) * S, 26 * S], fill=c)
    tf = F(SANS, 13)
    d.text((w / 2 - tf.getlength(title) / 2, 12 * S), title, font=tf, fill=(170, 175, 190))
    y = top + 16 * S
    for i, line in enumerate(lines):
        x = 20 * S
        if hl and i in hl:
            d.rectangle([0, y - 3 * S, w, y + lh - 5 * S], fill=(70, 40, 45))
        for text, col in segs(line):
            d.text((x, y), text, font=fnt, fill=col)
            x += fnt.getlength(text)
        y += lh
    img.save(OUT + name)

def read(p): return open(p, encoding="utf8").read().splitlines()

# ---------- Diff ----------
def diff(old, new, name, title):
    fnt = F(MONO, 14); lh = int(14 * S * 1.5); cw = fnt.getlength("M")
    rows = [("-", l) for l in old] + [("+", l) for l in new]
    w = int((max(len(l) for _, l in rows) + 6) * cw) + 30 * S
    top = 38 * S
    h = top + lh * len(rows) + 24 * S
    img = Image.new("RGB", (w, h), (250, 250, 252)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, top], fill=(235, 237, 242))
    d.text((16 * S, 10 * S), title, font=F(SANSB, 13), fill=(50, 55, 70))
    y = top + 12 * S
    for sign, l in rows:
        bg, fg = ((255, 228, 230), (150, 30, 40)) if sign == "-" else ((220, 245, 226), (20, 100, 45))
        d.rectangle([0, y - 2 * S, w, y + lh - 4 * S], fill=bg)
        d.text((14 * S, y), sign, font=F(MONOB, 14), fill=fg)
        d.text((34 * S, y), l, font=fnt, fill=fg if sign == "+" else fg)
        y += lh
    img.save(OUT + name)

# ---------- Kotak/diagram ----------
def rbox(d, xy, text, fill, outline, font, tcol=(30, 35, 50), sub=None, subfont=None):
    d.rounded_rectangle([c * S for c in xy], radius=14 * S, fill=fill, outline=outline, width=2 * S)
    x0, y0, x1, y1 = [c * S for c in xy]
    tw = font.getlength(text)
    ty = (y0 + y1) / 2 - (font.size * 0.62 if not sub else font.size * 1.25)
    d.text(((x0 + x1) / 2 - tw / 2, ty), text, font=font, fill=tcol)
    if sub:
        for i, s in enumerate(sub):
            sw = subfont.getlength(s)
            d.text(((x0 + x1) / 2 - sw / 2, ty + font.size * 1.35 + i * subfont.size * 1.3), s, font=subfont, fill=(80, 88, 110))

def arrow(d, a, b, col=(90, 98, 125), w=3):
    (x0, y0), (x1, y1) = a, b
    d.line([x0 * S, y0 * S, x1 * S, y1 * S], fill=col, width=w * S)
    import math
    ang = math.atan2(y1 - y0, x1 - x0); L = 11 * S
    p = [(x1 * S, y1 * S),
         (x1 * S - L * math.cos(ang - .45), y1 * S - L * math.sin(ang - .45)),
         (x1 * S - L * math.cos(ang + .45), y1 * S - L * math.sin(ang + .45))]
    d.polygon(p, fill=col)

def workflow():
    W, H = 900, 420
    img = Image.new("RGB", (W * S, H * S), (252, 252, 254)); d = ImageDraw.Draw(img)
    d.text((24 * S, 16 * S), "Siklus kerja pengembangan dengan AI generatif", font=F(SANSB, 17), fill=(40, 45, 65))
    steps = [("1. Analisis", "kebutuhan &\nbatasan", (219, 234, 254), (96, 140, 220)),
             ("2. Prompt", "instruksi spesifik\nbertahap", (224, 231, 255), (110, 110, 220)),
             ("3. Generate", "AI menulis\nkode draf", (237, 233, 254), (150, 100, 220)),
             ("4. Review", "baca & curigai\nhasil AI", (254, 243, 199), (210, 160, 40)),
             ("5. Uji", "tes otomatis\nnode --test", (220, 252, 231), (60, 170, 100)),
             ("6. Debug & Perbaiki", "cari akar masalah,\nprompt perbaikan", (254, 226, 226), (220, 90, 90)),
             ("7. Perbaiki", "prompt perbaikan\n+ tes ulang", (255, 237, 213), (225, 140, 60))]
    pos = [(30, 80), (320, 80), (610, 80), (610, 250), (320, 250), (30, 250)]
    pos = [(30, 85), (330, 85), (630, 85), (630, 255), (330, 255), (30, 255)]
    bw, bh = 240, 100
    f1, f2 = F(SANSB, 16), F(SANS, 13)
    coords = []
    for i, (t, s, fl, ol) in enumerate(steps[:6]):
        x, y = pos[i]
        rbox(d, (x, y, x + bw, y + bh), t, fl, ol, f1, sub=s.split("\n"), subfont=f2)
        coords.append((x, y))
    # panah
    arrow(d, (270, 135), (328, 135)); arrow(d, (570, 135), (628, 135))
    arrow(d, (750, 187), (750, 253)); arrow(d, (628, 305), (572, 305)); arrow(d, (328, 305), (272, 305))
    # panah balik dari Debug ke Perbaiki -> Generate (loop)
    x, y = 150, 187
    arrow(d, (150, 253), (150, 190), col=(225, 140, 60))
    d.text((158 * S, 207 * S), "Ulangi siklus sampai semua tes lulus", font=F(SANSB, 12), fill=(190, 100, 30))
    d.line([150 * S, 187 * S, 150 * S, 187 * S], fill=(225, 140, 60))
    arrow(d, (150, 187), (150, 186), col=(225, 140, 60))
    # panah menuju review (garis lengkung sederhana) 
    d.line([150 * S, 187 * S, 150 * S, 187 * S])
    d.text((24 * S, 380 * S), "Setiap iterasi dicatat di riwayat git (commit) sebagai bukti proses.", font=F(SANS, 13), fill=(100, 108, 130))
    img.save(OUT + "fig_workflow.png")

def arsitektur():
    W, H = 900, 540
    img = Image.new("RGB", (W * S, H * S), (252, 252, 254)); d = ImageDraw.Draw(img)
    d.text((24 * S, 16 * S), "Arsitektur modul Task Manager", font=F(SANSB, 17), fill=(40, 45, 65))
    f1, f2, f3 = F(SANSB, 15), F(SANS, 12), F(SANSB, 14)
    rbox(d, (330, 55, 570, 120), "Pengguna", (241, 245, 249), (120, 130, 150), f1, sub=["terminal / shell"], subfont=f2)
    rbox(d, (330, 155, 570, 220), "bin/tm.js", (219, 234, 254), (96, 140, 220), f1, sub=["titik masuk"], subfont=f2)
    rbox(d, (300, 255, 600, 330), "src/cli.js", (237, 233, 254), (150, 100, 220), f1, sub=["parse argumen, format keluaran"], subfont=f2)
    rbox(d, (30, 375, 270, 435), "src/config.js", (255, 237, 213), (225, 140, 60), f3, sub=["baca konfigurasi"], subfont=f2)
    rbox(d, (330, 375, 570, 435), "src/taskManager.js", (220, 252, 231), (60, 170, 100), f3, sub=["logika tugas"], subfont=f2)
    rbox(d, (630, 375, 870, 435), "src/storage.js", (254, 243, 199), (210, 160, 40), f3, sub=["baca/tulis JSON"], subfont=f2)
    rbox(d, (30, 470, 270, 525), "config/default.json", (255, 247, 237), (225, 140, 60), f3)
    rbox(d, (330, 470, 570, 525), "src/validators.js", (240, 253, 244), (60, 170, 100), f3)
    rbox(d, (630, 470, 870, 525), "data/tasks.json", (254, 249, 224), (210, 160, 40), f3)
    arrow(d, (450, 120), (450, 153)); arrow(d, (450, 220), (450, 253))
    arrow(d, (360, 330), (170, 373)); arrow(d, (450, 330), (450, 373)); arrow(d, (540, 330), (730, 373))
    arrow(d, (150, 435), (150, 468)); arrow(d, (450, 435), (450, 468)); arrow(d, (750, 435), (750, 468))
    img.save(OUT + "fig_arsitektur.png")

# ---------- Kartu prompt ----------
def prompt_card(name, label, prompt_lines, why):
    W = 860
    f_l, f_p, f_w = F(SANSB, 14), F(SANS, 14), F(SANS, 13)
    lh = int(14 * S * 1.45)
    wrapped = []
    for p in prompt_lines:
        wrapped += textwrap.wrap(p, 86) or [""]
    wwrap = textwrap.wrap(why, 100)
    H = 90 + len(wrapped) * lh // S + 40 + len(wwrap) * int(13 * 1.5) + 40
    img = Image.new("RGB", (W * S, H * S), (252, 252, 254)); d = ImageDraw.Draw(img)
    d.rounded_rectangle([14 * S, 14 * S, (W - 14) * S, (54 + len(wrapped) * lh // S + 14) * S], radius=14 * S,
                        fill=(232, 240, 254), outline=(120, 150, 220), width=2 * S)
    d.text((30 * S, 24 * S), label, font=f_l, fill=(40, 70, 150))
    y = 54 * S
    for l in wrapped:
        d.text((30 * S, y), l, font=f_p, fill=(30, 35, 55)); y += lh
    y += 30 * S
    d.text((20 * S, y), "Alasan instruksi ini:", font=F(SANSB, 13), fill=(120, 80, 20)); y += 22 * S
    for l in wwrap:
        d.text((20 * S, y), l, font=f_w, fill=(90, 70, 40)); y += int(13 * 1.5 * S)
    img.save(OUT + name)

# ---------- Grafik ----------
def chart():
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    labels = ["v1\n(draf AI)", "v2\n(perbaikan inti)", "v2 + tes CLI\n(temuan baru)", "v3\n(final)"]
    passed, failed = [3, 10, 18, 19], [7, 0, 1, 0]
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
    ax.bar(labels, passed, color="#3caa64", label="Lulus")
    ax.bar(labels, failed, bottom=passed, color="#dc5a5a", label="Gagal")
    for i, (p, f) in enumerate(zip(passed, failed)):
        ax.text(i, p / 2, str(p), ha="center", va="center", color="white", fontweight="bold")
        if f: ax.text(i, p + f / 2, str(f), ha="center", va="center", color="white", fontweight="bold")
    ax.set_ylabel("Jumlah tes"); ax.set_title("Hasil pengujian tiap iterasi (data nyata dari node --test)")
    ax.legend(); ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout(); plt.savefig(OUT + "fig_chart.png"); plt.close()

if __name__ == "__main__":
    terminal(read("/tmp/t_v1.txt")[:13] + ["", "# ... lalu detail kegagalan ..."], "fig_test_v1.png", "npm test  (v1 - draf AI)", 70,
             hl=[i for i, l in enumerate(read("/tmp/t_v1.txt")[:13]) if l.startswith("✖")])
    errs = ['✖ add: id tetap unik setelah ada tugas yang dihapus',
            "  AssertionError: ID duplikat: 2,2",
            "",
            "✖ complete: id yang tidak ada melempar error yang jelas",
            "  TypeError: Cannot set properties of undefined (setting 'done')",
            "",
            "✖ list: urutan stabil walau banyak tugas tanpa tenggat ...",
            "  TypeError: Cannot read properties of undefined (reading 'localeCompare')",
            "      at src/taskManager.js:32:45",
            "",
            "✖ loadTasks: file belum ada mengembalikan array kosong",
            "  Error: ENOENT: no such file or directory, open '/tmp/tm-kiO8aa/tasks.json'",
            "",
            "✖ loadTasks: file JSON rusak tidak membuat program crash",
            "  SyntaxError: Expected property name or '}' in JSON at position 1",
            "",
            "✖ add: judul kosong ditolak   |   ✖ add: tanggal tidak valid ditolak",
            "  AssertionError: Missing expected exception."]
    terminal(errs, "fig_error_detail.png", "Detail kegagalan (potongan dari docs/evidence/test_v1.txt)", 78)
    diff(["    id: this.tasks.length + 1,"],
         ["    id: this.nextId(),   // ID terbesar + 1", "", "  nextId() {",
          "    return this.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;", "  }"],
         "fig_diff_id.png", "Perbaikan Bug #1 - ID duplikat (src/taskManager.js)")
    diff(["    const task = this.tasks.find((t) => t.id === id);", "    task.done = true;"],
         ["    const task = this.get(id);   // melempar error jelas jika tidak ada", "    task.done = true;", "",
          "  get(id) {", "    const task = this.tasks.find((t) => t.id === Number(id));",
          "    if (!task) throw new Error(`Tugas dengan ID ${id} tidak ditemukan`);", "    return task;", "  }"],
         "fig_diff_get.png", "Perbaikan Bug #2 - tugas tidak ditemukan (src/taskManager.js)")
    diff(["    return [...result].sort((a, b) => a.due.localeCompare(b.due));"],
         ["    return [...result].sort((a, b) => {", "      if (a.due === b.due) return a.id - b.id;",
          "      if (a.due === null || a.due === undefined) return 1;",
          "      if (b.due === null || b.due === undefined) return -1;",
          "      return a.due < b.due ? -1 : 1;", "    });"],
         "fig_diff_sort.png", "Perbaikan Bug #3 - pengurutan tanpa tenggat (src/taskManager.js)")
    diff(["      out[argv[i].slice(2)] = argv[i + 1];", "      i++;"],
         ["      const value = argv[i + 1];", "      if (value === undefined || value.startsWith('--')) {",
          "        throw new Error(`Opsi ${argv[i]} membutuhkan nilai`);", "      }",
          "      out[argv[i].slice(2)] = value;", "      i++;"],
         "fig_diff_args.png", "Perbaikan Bug #6 - opsi tanpa nilai (src/cli.js)")
    terminal(read("/tmp/t_final.txt"), "fig_test_final.png", "npm test  (v3 - final)", 78)
    terminal(read("/tmp/t_demo.txt"), "fig_demo.png", "Contoh penggunaan Task Manager", 80)
    terminal(read("/tmp/t_err.txt"), "fig_error_demo.png", "Penanganan error yang ramah pengguna", 80)
    workflow(); arsitektur(); chart()

    prompt_card("fig_prompt1.png", "Prompt 1 - Rancang (peran + konteks + batasan + format)", [
        "Kamu adalah senior JavaScript developer. Saya mahasiswa dan ingin membuat task manager CLI sederhana dengan Node.js tanpa library eksternal.",
        "Fitur: tambah tugas (judul, tenggat opsional), daftar tugas (filter status), tandai selesai, hapus. Data disimpan di file JSON.",
        "Sebelum menulis kode, usulkan struktur file dan pembagian modul (logika, penyimpanan, CLI). Jelaskan alasan tiap keputusan dalam bahasa Indonesia."],
        "Meminta rancangan sebelum kode mencegah AI langsung menulis satu file raksasa. Peran memberi gaya jawaban yang tepat, batasan 'tanpa library' menjaga proyek tetap sederhana, dan permintaan alasan membuat saya bisa menilai keputusan AI, bukan sekadar menyalinnya.")
    prompt_card("fig_prompt2.png", "Prompt 2 - Tulis kode (satu modul per instruksi)", [
        "Tulis src/taskManager.js: class TaskManager dengan add, complete, remove, list(status). Kelas ini tidak boleh membaca/menulis file atau memakai console.",
        "Setiap tugas: id, title, due, done, createdAt. Beri komentar singkat berbahasa Indonesia."],
        "Instruksi kecil dan satu tujuan membuat hasil mudah direview. Larangan I/O di dalam kelas memaksa pemisahan tanggung jawab sehingga logika bisa diuji tanpa file nyata.")
    prompt_card("fig_prompt3.png", "Prompt 3 - Uji: minta AI menyerang kodenya sendiri", [
        "Tulis tes dengan node:test untuk TaskManager dan storage. Fokus pada kasus tepi: ID setelah penghapusan, ID yang tidak ada, judul kosong, tanggal tidak valid (2026-13-45), tugas tanpa tenggat, file belum ada, file JSON rusak.",
        "Jangan sesuaikan tes agar lulus dengan kode yang ada; tes harus menggambarkan perilaku yang benar."],
        "AI cenderung menulis tes 'jalur bahagia' yang pasti lulus. Menyebut kasus tepi dan melarang tes disesuaikan dengan kode membuat tes menjadi alat deteksi bug yang jujur.")
    prompt_card("fig_prompt4.png", "Prompt 4 - Debug: beri bukti, bukan keluhan", [
        "Tes ini gagal. Kode: [tempel taskManager.js]. Output: 'AssertionError: ID duplikat: 2,2'.",
        "Jelaskan akar masalahnya (bukan hanya gejalanya), beri perbaikan minimal, lalu sebutkan tes lain yang mungkin terdampak."],
        "Menempelkan kode + pesan error asli menghindari tebakan. Meminta 'akar masalah' dan 'perbaikan minimal' mencegah AI menulis ulang seluruh file dan menimbulkan bug baru.")
    print("done")
