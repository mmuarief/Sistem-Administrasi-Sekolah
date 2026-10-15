const $ = id => document.getElementById(id);

const stages = [
  {tj:m=>`Peserta didik mampu menjelaskan pengertian, tujuan, dan ciri-ciri ${m} melalui pengamatan contoh.`,
   mt:m=>`Konsep dasar, tujuan, dan ciri-ciri ${m}.`,
   ke:(m,w)=>[`Salam, doa, presensi, apersepsi dengan pertanyaan pemantik terkait ${m}; penyampaian tujuan pembelajaran (±10 menit).`,`Peserta didik mengamati contoh ${m}, berdiskusi dalam kelompok untuk mengidentifikasi ciri dan unsur utamanya, lalu mempresentasikan temuan secara singkat; guru memberi umpan balik (±55 menit).`,`Menyimpulkan materi bersama, refleksi singkat, tugas membaca/mencari contoh ${m}, doa penutup (±15 menit).`],
   as:`Formatif: observasi diskusi kelompok dan kuis singkat (3–5 soal) pemahaman konsep.`,
   rf:[`Sebagian besar siswa aktif, namun diskusi kelompok melebihi waktu. Pertemuan berikutnya batas waktu diskusi diperketat dengan timer.`,`Contoh yang ditampilkan menarik minat siswa; beberapa siswa masih kesulitan membedakan konsep inti. Perlu penguatan dengan contoh pembanding.`],
   cp:[`Ananda A aktif bertanya dan mampu menjelaskan ulang konsep dengan bahasa sendiri. Ananda B masih pasif dan perlu didorong melalui pertanyaan terarah.`,`Mayoritas siswa mulai memahami konsep dasar; 4 siswa memerlukan pendampingan membedakan ciri utama.`]},
  {tj:m=>`Peserta didik mampu menganalisis struktur dan kaidah kebahasaan/unsur penyusun ${m} dari contoh yang diberikan.`,
   mt:m=>`Struktur, unsur, dan kaidah penyusun ${m}.`,
   ke:(m,w)=>[`Salam, presensi, mengulas materi pertemuan sebelumnya melalui tanya jawab, menyampaikan tujuan (±10 menit).`,`Peserta didik menganalisis struktur dan unsur ${m} pada teks/contoh menggunakan lembar kerja (LKPD) secara berpasangan; guru berkeliling membimbing; hasil analisis dibahas bersama (±55 menit).`,`Menyimpulkan hasil analisis, refleksi pemahaman, informasi rencana praktik pertemuan berikutnya (±15 menit).`],
   as:`Formatif: penilaian LKPD (rubrik ketepatan analisis) dan pertanyaan lisan.`,
   rf:[`Model berpasangan efektif meningkatkan partisipasi, tetapi LKPD terlalu panjang sehingga beberapa pasangan tidak selesai. LKPD akan diringkas.`,`Siswa cukup antusias, namun masih ada kekeliruan dalam menentukan unsur penyusun. Perlu pembahasan ulang pada awal pertemuan berikutnya.`],
   cp:[`Ananda C teliti dan ketepatan analisisnya tinggi. Ananda D masih keliru mengidentifikasi unsur dan perlu bimbingan individual.`,`Sekitar 70% siswa mencapai ketuntasan LKPD; sisanya diberi remedial berupa latihan tambahan.`]},
  {tj:m=>`Peserta didik mampu menyusun/menghasilkan karya ${m} secara mandiri sesuai struktur dan kaidah yang telah dipelajari.`,
   mt:m=>`Praktik produksi dan penyusunan ${m}.`,
   ke:(m,w)=>[`Salam, presensi, apersepsi, menyampaikan tujuan dan kriteria keberhasilan produk (±10 menit).`,`Peserta didik merencanakan, menyusun draf ${m} secara mandiri, saling menelaah draf teman sebaya (peer review) dengan lembar umpan balik, kemudian merevisi karya; guru memberi bimbingan individual (±55 menit).`,`Beberapa siswa membagikan hasil, refleksi proses, penugasan penyempurnaan karya, doa penutup (±15 menit).`],
   as:`Formatif: penilaian unjuk kerja/produk dengan rubrik (isi, struktur, kebahasaan/ketepatan, kreativitas).`,
   rf:[`Pembelajaran berbasis produk memotivasi siswa, tetapi waktu revisi kurang. Perlu alokasi waktu tambahan atau tugas penyempurnaan di rumah.`,`Peer review membantu siswa menemukan kesalahan sendiri; guru perlu menyiapkan pedoman umpan balik yang lebih jelas.`],
   cp:[`Ananda E menghasilkan karya kreatif dan runtut. Ananda F kesulitan memulai dan mendapat scaffolding berupa kerangka karya.`,`Sebagian besar siswa mampu menyelesaikan draf; 5 siswa perlu pendampingan pada tahap revisi.`]},
  {tj:m=>`Peserta didik mampu mempresentasikan karya, memberi tanggapan, dan merefleksikan pencapaian belajar ${m}.`,
   mt:m=>`Presentasi, evaluasi, dan refleksi ${m}.`,
   ke:(m,w)=>[`Salam, presensi, penyampaian tujuan dan tata cara presentasi/asesmen (±10 menit).`,`Peserta didik mempresentasikan karya ${m}; peserta lain memberi tanggapan; dilanjutkan asesmen sumatif tertulis/praktik sesuai rubrik (±55 menit).`,`Guru memberikan penguatan dan umpan balik umum, peserta didik mengisi refleksi diri, rencana tindak lanjut (pengayaan/remedial), doa penutup (±15 menit).`],
   as:`Sumatif: penilaian presentasi/produk (rubrik) dan tes tertulis pemahaman materi; refleksi diri sebagai asesmen non-kognitif.`,
   rf:[`Sebagian besar siswa mencapai tujuan pembelajaran. Presentasi memakan waktu cukup banyak; pada siklus berikutnya jumlah penampil dibatasi. Remedial disiapkan bagi siswa belum tuntas.`,`Siswa menunjukkan percaya diri saat presentasi. Soal tes sebaiknya divariasikan agar lebih membedakan tingkat kemampuan.`],
   cp:[`Ananda G mencapai kompetensi tinggi dan layak diberi pengayaan. Ananda H belum tuntas dan dijadwalkan remedial.`,`Ketuntasan klasikal ±80%; siswa belum tuntas mendapat remedial, siswa tuntas mendapat pengayaan.`]}
];

function build(){
  const mapel = $('mapel').value.trim() || '—';
  const kelas = $('kelas').value.trim() || '—';
  const smt = $('smt').value;
  const m = $('materi').value.trim() || 'materi';
  const n = Math.max(1, Math.min(12, +$('n').value || 1));
  const w = $('waktu').value;
  let rows = '';
  for (let i = 0; i < n; i++){
    const si = n === 1 ? 0 : Math.round(i * 3 / (n - 1));
    const s = stages[si];
    const k = s.ke(m, w);
    const tm = s.tj(m);
    rows += `<tr>
<td class="c" contenteditable><span class="no">${i+1}</span></td>
<td contenteditable>Hari: ........<br>Tanggal: ..../..../20..</td>
<td contenteditable><b>Tujuan:</b> ${tm}<br><br><b>Materi:</b> ${s.mt(m)}</td>
<td contenteditable><b>Pendahuluan:</b> ${k[0]}<br><br><b>Inti:</b> ${k[1]}${sin()}<br><br><b>Penutup:</b> ${k[2]}</td>
<td contenteditable>${s.as.replace('materi', m)}</td>
<td contenteditable>${s.rf[i%2]}</td>
<td contenteditable>${s.cp[i%2]}</td></tr>`;
  }
  const metaHtml = `<div class="meta">
    <span>Mapel: ${esc(mapel)}</span>
    <span>Kelas/Fase: ${esc(kelas)}</span>
    <span>Semester: ${smt}</span>
    <span>Materi: ${esc(m)}</span>
    <span>Alokasi: ${esc(w)}</span>
    ${$('model').value.startsWith('Tanpa') ? '' : '<span>Model: ' + esc($('model').value) + '</span>'}
    ${$('cp').value.trim() ? '<span>CP: ' + esc($('cp').value) + '</span>' : ''}
    ${$('profil').value.trim() ? '<span>Profil Pelajar Pancasila: ' + esc($('profil').value) + '</span>' : ''}
  </div>`;
  const tableHtml = `<div class="scroll"><table id="tbl"><thead><tr>
    <th>Pertemuan ke-</th><th>Hari / Tanggal</th><th>Tujuan &amp; Materi Pembelajaran</th>
    <th>Kegiatan Pembelajaran</th><th>Penilaian</th><th>Refleksi Guru</th>
    <th>Catatan Perkembangan Peserta Didik</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  $('out').innerHTML = kop() + metaHtml + tableHtml + sign() +
    '<div class="hint noprint">Semua sel dapat disunting langsung. Sesuaikan contoh refleksi dan catatan siswa dengan kondisi kelas Anda.</div>';
}

function esc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  $('theme').textContent = t === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  try { localStorage.setItem('jg-theme', t); } catch(e){}
}

const FL = ['mapel','kelas','smt','materi','n','waktu','guru','nip','sekolah','tahun','kepsek','model','cp','profil','np'];
const MD = {
  'Problem Based Learning (PBL)':'orientasi pada masalah, pengorganisasian belajar, penyelidikan, penyajian hasil, serta analisis dan evaluasi proses',
  'Project Based Learning (PjBL)':'penentuan pertanyaan mendasar, perencanaan proyek, penyusunan jadwal, pelaksanaan proyek, penyajian hasil, dan evaluasi',
  'Discovery Learning':'stimulasi, identifikasi masalah, pengumpulan data, pengolahan data, pembuktian, dan generalisasi'
};

let ab = {}, cat = {};

function sin(){
  const m = $('model').value;
  return MD[m] ? `<br><i>Sintaks ${m}: ${MD[m]}.</i>` : '';
}
function kop(){
  const v = i => esc($(i).value.trim() || '........');
  return `<div class="kop"><h2>JURNAL GURU HARIAN</h2><div class="kg">
    <span>Nama Guru: <b>${v('guru')}</b></span>
    <span>NIP: <b>${v('nip')}</b></span>
    <span>Satuan Pendidikan: <b>${v('sekolah')}</b></span>
    <span>Tahun Ajaran: <b>${v('tahun')}</b></span></div></div>`;
}
function sign(){
  const v = i => esc($(i).value.trim() || '........................');
  return `<div class="sign">
    <div>Mengetahui,<br>Kepala Sekolah<br><br><br><br><b><u>${v('kepsek')}</u></b></div>
    <div>......................, ..../..../20..<br>Guru Mata Pelajaran<br><br><br><br><b><u>${v('guru')}</u></b></div></div>`;
}

function rp(){
  const names = $('names').value.split('\n').map(x => x.trim()).filter(Boolean);
  const n = Math.max(1, Math.min(60, +$('np').value || 1));
  let h = '<div class="scroll"><table style="min-width:600px"><thead><tr><th>No</th><th>Nama Siswa</th>';
  for (let i = 1; i <= n; i++) h += `<th>P${i}</th>`;
  h += '<th>Hadir</th><th>Catatan Perkembangan</th><th>Hapus</th></tr></thead><tbody>';
  names.forEach((nm, r) => {
    const a = ab[nm] = ab[nm] || [];
    let ok = 0, c = '';
    for (let i = 0; i < n; i++){
      const t = a[i] || 'H';
      if (t === 'H') ok++;
      c += `<td class="ab s${t}" data-n="${esc(nm)}" data-i="${i}">${t}</td>`;
    }
    h += `<tr><td>${r+1}</td><td>${esc(nm)}</td>${c}<td><b>${Math.round(ok/n*100)}%</b></td>
      <td><input data-cn="${esc(nm)}" value="${esc(cat[nm] || '')}" placeholder="Catatan..."></td>
      <td class="c"><button class="del noprint" data-del="${esc(nm)}" title="Hapus siswa">×</button></td></tr>`;
  });
  h += '</tbody></table></div>';
  $('ptab').innerHTML = names.length ? h : '<p class="hint">Tempel daftar nama siswa, lalu klik Buat Daftar.</p>';
}

function snap(){
  const f = {};
  FL.forEach(i => f[i] = $(i).value);
  return { f, out: $('out').innerHTML, names: $('names').value, ab, cat };
}
function apply(s){
  FL.forEach(i => { if (s.f[i] !== undefined) $(i).value = s.f[i]; });
  $('out').innerHTML = s.out;
  $('names').value = s.names || '';
  ab = s.ab || {};
  cat = s.cat || {};
  rp();
}
let tm;
function sv(){
  clearTimeout(tm);
  tm = setTimeout(() => {
    try { localStorage.setItem('jg-draft', JSON.stringify(snap())); } catch(e){}
  }, 400);
}

// Helper: convert nomor kolom (1=A, 2=B, ..., 27=AA) menjadi huruf
function colLetter(num){
  let s = '';
  while (num > 0){
    const mod = (num - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

// ========== EVENT LISTENERS ==========
$('go').onclick = build;
$('theme').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
$('print').onclick = () => window.print();
$('mkp').onclick = () => { rp(); sv(); };
$('np').oninput = () => { rp(); sv(); };

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelector('.wrap').dataset.tab = b.dataset.t;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('alt', x !== b));
  if (b.dataset.t === 'pr') rp();
});

$('ptab').addEventListener('click', e => {
  const d = e.target.closest('[data-del]');
  if (d){
    const nm = d.dataset.del;
    const L = $('names').value.split('\n');
    const k = L.findIndex(x => x.trim() === nm);
    if (k > -1) L.splice(k, 1);
    $('names').value = L.join('\n');
    if (!L.some(x => x.trim() === nm)) { delete ab[nm]; delete cat[nm]; }
    rp(); sv(); return;
  }
  const t = e.target.closest('.ab');
  if (!t) return;
  const nm = t.dataset.n, i = +t.dataset.i, o = ['H','S','I','A'], a = ab[nm];
  a[i] = o[(o.indexOf(a[i] || 'H') + 1) % 4];
  rp(); sv();
});

$('ptab').addEventListener('input', e => {
  const nm = e.target.dataset.cn;
  if (nm !== undefined){ cat[nm] = e.target.value; sv(); }
});

document.addEventListener('input', sv);

$('copy').onclick = async () => {
  const c = $('out').cloneNode(true);
  c.querySelectorAll('table').forEach(t => {
    t.setAttribute('border','1');
    t.setAttribute('cellpadding','5');
    t.style.borderCollapse = 'collapse';
  });
  const txt = $('out').innerText;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([c.innerHTML], {type:'text/html'}),
      'text/plain': new Blob([txt], {type:'text/plain'})
    })]);
    $('msg').textContent = 'Tersalin lengkap dengan kop dan tabel. Tempel (Ctrl+V) di Word atau Google Docs.';
  } catch(e){
    try {
      await navigator.clipboard.writeText(txt);
      $('msg').textContent = 'Tersalin sebagai teks.';
    } catch(e2){
      $('msg').textContent = 'Gagal menyalin. Blok tabel manual lalu Ctrl+C.';
    }
  }
};

// ========== SIMPAN WORD (.doc) ==========
$('saveWord').onclick = function(){
  const content = $('out').innerHTML;
  if (!content){ $('msg').textContent = '⚠️ Buat jurnal dulu sebelum menyimpan.'; return; }
  const mapel = $('mapel').value || 'Jurnal';
  const materi = $('materi').value || '';
  const html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><title>Jurnal Guru</title><style>" +
    "@page { size: A4 landscape; margin: 1.5cm; }" +
    "body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; }" +
    ".kop h2 { text-align: center; font-size: 16pt; margin: 0 0 8px; }" +
    ".kg { display: block; font-size: 11pt; margin-bottom: 10px; }" +
    ".kg span { display: inline-block; margin-right: 20px; }" +
    ".meta { margin-bottom: 10px; }" +
    ".meta span { display: inline-block; background: #eee; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 10pt; }" +
    "table { border-collapse: collapse; width: 100%; font-size: 10pt; }" +
    "th { background: #263b8f; color: #fff; padding: 6px; border: 1px solid #000; text-align: left; }" +
    "td { padding: 6px; border: 1px solid #000; vertical-align: top; }" +
    ".no { font-weight: bold; }" +
    ".sign { margin-top: 30px; text-align: center; }" +
    ".sign div { display: inline-block; width: 45%; vertical-align: top; }" +
    ".hint { display: none; }" +
    "i { color: #555; }" +
    "</style></head><body>" + content + "</body></html>";
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Jurnal_' + mapel.replace(/[^a-z0-9]/gi,'_') + '_' + materi.replace(/[^a-z0-9]/gi,'_') + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  $('msg').textContent = '✅ File Word (.doc) berhasil diunduh.';
};

// ========== SIMPAN EXCEL (.xls) ==========
$('saveExcel').onclick = function(){
  const tbl = $('tbl');
  if (!tbl){ $('msg').textContent = '⚠️ Buat jurnal dulu sebelum menyimpan Excel.'; return; }
  const rows = [];
  for (let i = 0; i < tbl.rows.length; i++){
    const row = [];
    for (let j = 0; j < tbl.rows[i].cells.length; j++){
      row.push(tbl.rows[i].cells[j].innerText.replace(/\s*\n\s*/g,' ').trim());
    }
    rows.push(row);
  }
  const ptab = $('ptab').querySelector('table');
  const presensiRows = [];
  if (ptab){
    for (let i = 0; i < ptab.rows.length; i++){
      const row = [];
      for (let j = 0; j < ptab.rows[i].cells.length; j++){
        const inp = ptab.rows[i].cells[j].querySelector('input');
        row.push(inp ? inp.value : ptab.rows[i].cells[j].innerText.trim());
      }
      presensiRows.push(row);
    }
  }
  const mapel = $('mapel').value || 'Jurnal';
  const materi = $('materi').value || '';
  let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><style>" +
    "table { border-collapse: collapse; }" +
    "th { background: #263b8f; color: #fff; padding: 5px; border: 1px solid #000; font-weight: bold; }" +
    "td { padding: 5px; border: 1px solid #000; vertical-align: top; }" +
    ".title { font-size: 14pt; font-weight: bold; text-align: center; }" +
    ".sub { font-size: 11pt; margin-bottom: 10px; }" +
    "</style></head><body>" +
    "<table><tr><td colspan='7' class='title'>JURNAL GURU HARIAN</td></tr>" +
    "<tr><td colspan='7' class='sub'>Mapel: " + esc($('mapel').value) + " | Kelas: " + esc($('kelas').value) + " | Semester: " + $('smt').value + " | Materi: " + esc($('materi').value) + "</td></tr>" +
    "<tr><td colspan='7'></td></tr></table>" +
    "<table border='1'><tr>";
  for (let j = 0; j < rows[0].length; j++) html += "<th>" + esc(rows[0][j]) + "</th>";
  html += "</tr>";
  for (let i = 1; i < rows.length; i++){
    html += "<tr>";
    for (let j = 0; j < rows[i].length; j++) html += "<td>" + esc(rows[i][j]) + "</td>";
    html += "</tr>";
  }
  html += "</table>";
  if (presensiRows.length > 0){
    html += "<br><br><table><tr><td class='title'>PRESENSI & CATATAN SISWA</td></tr></table><table border='1'>";
    for (let i = 0; i < presensiRows.length; i++){
      html += "<tr>";
      for (let j = 0; j < presensiRows[i].length; j++) html += "<td>" + esc(presensiRows[i][j]) + "</td>";
      html += "</tr>";
    }
    html += "</table>";
  }
  html += "</body></html>";
  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Jurnal_' + mapel.replace(/[^a-z0-9]/gi,'_') + '_' + materi.replace(/[^a-z0-9]/gi,'_') + '.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  $('msg').textContent = '✅ File Excel (.xls) berhasil diunduh.';
};

// ========== SIMPAN PRESENSI (.csv) ==========
$('savePresensi').onclick = function(){
  const names = $('names').value.split('\n').map(x => x.trim()).filter(Boolean);
  if (names.length === 0){
    $('msg').textContent = '⚠️ Isi daftar nama siswa dulu.';
    return;
  }
  const n = Math.max(1, Math.min(60, +$('np').value || 1));
  const mapel = $('mapel').value || 'Presensi';
  const kelas = $('kelas').value || '';
  const smt = $('smt').value || '';

  const lines = [];
  lines.push(['INFO', mapel, kelas, smt, n].map(csvCell).join(','));
  const header = ['No', 'Nama Siswa'];
  for (let i = 1; i <= n; i++) header.push('P' + i);
  header.push('Hadir', 'Catatan');
  lines.push(header.map(csvCell).join(','));

  names.forEach((nm, r) => {
    const a = ab[nm] || [];
    let ok = 0;
    const row = [r + 1, nm];
    for (let i = 0; i < n; i++){
      const t = a[i] || 'H';
      if (t === 'H') ok++;
      row.push(t);
    }
    row.push(Math.round(ok / n * 100) + '%');
    row.push(cat[nm] || '');
    lines.push(row.map(csvCell).join(','));
  });

  const csv = '\ufeff' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Presensi_' + mapel.replace(/[^a-z0-9]/gi, '_') + '_' + kelas.replace(/[^a-z0-9]/gi, '_') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  $('msg').textContent = '✅ File Presensi (.csv) berhasil diunduh. Buka langsung di Excel.';
};

function csvCell(v){
  const s = String(v == null ? '' : v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')){
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ========== SALIN PRESENSI UNTUK EXCEL (dengan RUMUS) ==========
$('copyPresensi').onclick = async function(){
  const names = $('names').value.split('\n').map(x => x.trim()).filter(Boolean);
  if (names.length === 0){
    $('msg').textContent = '⚠️ Isi daftar nama siswa dulu.';
    return;
  }
  const n = Math.max(1, Math.min(60, +$('np').value || 1));
  const mapel = $('mapel').value || 'Presensi';
  const kelas = $('kelas').value || '';
  const smt = $('smt').value || '';

  // Posisi kolom Excel:
  // A = No, B = Nama, C..(C+n-1) = P1..Pn, (C+n) = Hadir (%), (C+n+1) = Catatan
  const colStart = 'C';
  const colEnd = colLetter(3 + n - 1);
  const colHadir = colLetter(3 + n);
  const colCatatan = colLetter(3 + n + 1);

  // ===== 1. TEKS (TSV) =====
  const lines = [];
  lines.push('DAFTAR PRESENSI SISWA');
  lines.push('Mapel: ' + mapel + '\tKelas: ' + kelas + '\tSemester: ' + smt);
  lines.push('');
  const header = ['No', 'Nama Siswa'];
  for (let i = 1; i <= n; i++) header.push('P' + i);
  header.push('Hadir (%)', 'Catatan');
  lines.push(header.join('\t'));

  names.forEach((nm, r) => {
    const a = ab[nm] || [];
    const rowNum = r + 5;
    const row = [r + 1, nm];
    for (let i = 0; i < n; i++) row.push(a[i] || 'H');
    row.push('=COUNTIF(' + colStart + rowNum + ':' + colEnd + rowNum + ',"H")/COUNTA(' + colStart + rowNum + ':' + colEnd + rowNum + ')');
    row.push(cat[nm] || '');
    lines.push(row.join('\t'));
  });

  const text = lines.join('\n');

  // ===== 2. HTML untuk Excel =====
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt">';

  html += '<tr><td colspan="' + (n + 4) + '" style="font-size:14pt;font-weight:bold;text-align:center">DAFTAR PRESENSI SISWA</td></tr>';
  html += '<tr><td colspan="' + (n + 4) + '" style="text-align:center">Mapel: ' + esc(mapel) + ' | Kelas: ' + esc(kelas) + ' | Semester: ' + esc(smt) + '</td></tr>';
  html += '<tr><td colspan="' + (n + 4) + '"></td></tr>';

  // Header
  html += '<tr style="background:#263b8f;color:#fff;font-weight:bold">';
  html += '<td>No</td><td>Nama Siswa</td>';
  for (let i = 1; i <= n; i++) html += '<td>P' + i + '</td>';
  html += '<td>Hadir (%)</td><td>Catatan</td></tr>';

  // Data dengan RUMUS
  names.forEach((nm, r) => {
    const a = ab[nm] || [];
    const rowNum = r + 5; // baris Excel (3 baris judul + 1 header + 1 offset)
    html += '<tr>';
    html += '<td style="text-align:center">' + (r + 1) + '</td>';
    html += '<td>' + esc(nm) + '</td>';
    for (let i = 0; i < n; i++){
      html += '<td style="text-align:center">' + (a[i] || 'H') + '</td>';
    }
    // Rumus Excel + format persen
    const formula = '=COUNTIF(' + colStart + rowNum + ':' + colEnd + rowNum + ',"H")/COUNTA(' + colStart + rowNum + ':' + colEnd + rowNum + ')';
    html += '<td style="text-align:center;mso-number-format:\'0.0%\';num-format:\'0.0%\';background:#fff7cc">' + formula + '</td>';
    html += '<td>' + esc(cat[nm] || '') + '</td>';
    html += '</tr>';
  });

  html += '</table>';

  // ===== 3. Copy ke clipboard =====
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    })]);
    $('msg').textContent = '✅ Presensi tersalin dengan RUMUS Excel! Paste di Excel (Ctrl+V) lalu format kolom "Hadir (%)" sebagai persen.';
  } catch (e) {
    try {
      await navigator.clipboard.writeText(text);
      $('msg').textContent = '✅ Presensi tersalin sebagai teks (rumus mungkin tidak aktif). Coba pakai Chrome/Edge terbaru.';
    } catch (e2) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        $('msg').textContent = '✅ Presensi tersalin (mode kompatibilitas).';
      } catch (e3) {
        $('msg').textContent = '❌ Gagal menyalin. Blok manual tabel presensi lalu Ctrl+C.';
      }
      document.body.removeChild(ta);
    }
  }
};

// ========== INISIALISASI ==========
let saved = 'light';
try { saved = localStorage.getItem('jg-theme') || 'light'; } catch(e){}
setTheme(saved);
let dr = null;
try { dr = JSON.parse(localStorage.getItem('jg-draft') || 'null'); } catch(e){}
if (dr && dr.out) apply(dr); else build();