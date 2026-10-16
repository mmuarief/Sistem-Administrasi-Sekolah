/* =========================================================
   SISTEM ADMINISTRASI SURAT MENYURAT SEKOLAH
   File: app.js
   Deskripsi: Logika utama aplikasi (routing, CRUD, generator, export, upload logo)
   Penulis: Muchammad Muarief, S. Pd.
   ========================================================= */

console.log('%c[SIMPEL SURAT] app.js mulai dimuat...', 'color:#1e40af;font-weight:bold');

document.addEventListener('DOMContentLoaded', function () {
  console.log('[SIMPEL SURAT] DOM siap. Memulai inisialisasi...');

  /* =========================================================
     0. UTILITAS UMUM
     ========================================================= */
  const BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function formatTanggalIndo(iso) {
    if (!iso) return '-';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.getDate() + ' ' + BULAN_ID[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatWaktu(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    const jam = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + BULAN_ID[d.getMonth()].substring(0, 3) + ' ' + d.getFullYear() + ', ' + jam;
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* =========================================================
     1. ROUTING / NAVIGASI SPA
     ========================================================= */
  const PAGE_META = {
    'dashboard'    : { title: 'Dashboard',     subtitle: 'Ringkasan aktivitas surat menyurat sekolah' },
    'surat-masuk'  : { title: 'Surat Masuk',   subtitle: 'Kelola data surat masuk sekolah' },
    'surat-keluar' : { title: 'Surat Keluar',  subtitle: 'Kelola data surat keluar sekolah' },
    'buat-surat'   : { title: 'Buat Surat',    subtitle: 'Generator surat resmi dengan pratinjau langsung' }
  };

  const ALL_PAGES = ['dashboard', 'surat-masuk', 'surat-keluar', 'buat-surat'];

  function navigateTo(page) {
    if (!PAGE_META[page]) page = 'dashboard';
    console.log('[SIMPEL SURAT] Pindah ke halaman:', page);

    ALL_PAGES.forEach(function (p) {
      const el = document.getElementById('page-' + p);
      if (!el) return;
      if (p === page) {
        el.classList.remove('hidden');
        el.classList.add('page');
      } else {
        el.classList.add('hidden');
      }
    });

    document.getElementById('pageTitle').textContent = PAGE_META[page].title;
    document.getElementById('pageSubtitle').textContent = PAGE_META[page].subtitle;

    document.querySelectorAll('.nav-link').forEach(function (link) {
      const isActive = link.dataset.page === page;
      link.classList.toggle('bg-white/15', isActive);
      link.classList.toggle('text-white', isActive);
      link.classList.toggle('font-semibold', isActive);
      link.classList.toggle('text-blue-100', !isActive);
    });

    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'dashboard') renderDashboard();
    if (page === 'surat-masuk') renderMasuk();
    if (page === 'surat-keluar') renderKeluar();
    if (page === 'buat-surat') { loadKopForm(); updatePreview(); }
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();
    navigateTo(link.getAttribute('data-page'));
  });

  /* =========================================================
     2. SIDEBAR MOBILE
     ========================================================= */
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.getElementById('btnMenu');

  function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  }
  function closeSidebar() {
    if (window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    }
  }

  btnMenu.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) {
      overlay.classList.add('hidden');
      sidebar.classList.remove('-translate-x-full');
    } else {
      sidebar.classList.add('-translate-x-full');
    }
  });

  /* =========================================================
     3. LAPISAN DATA (LocalStorage)
     ========================================================= */
  const KEY_MASUK  = 'smpal_surat_masuk_v1';
  const KEY_KELUAR = 'smpal_surat_keluar_v1';
  const KEY_KOP    = 'smpal_kop_surat_v1';

  function readStore(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('Gagal membaca localStorage:', e);
      return [];
    }
  }

  function writeStore(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); }
    catch (e) { console.warn('Gagal menulis localStorage:', e); }
  }

  function makeId(prefix) {
    return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  /* =========================================================
     4. PENGATURAN KOP SURAT + UPLOAD LOGO
     ========================================================= */
  const KOP_DEFAULT = {
    logo     : 'AL',                                       // teks singkatan
    logoImg  : '',                                         // base64 gambar (kosong = pakai teks)
    yayasan  : 'YAYASAN PENDIDIKAN AL',
    sekolah  : 'SMP AL',
    alamat1  : 'Jl. Pendidikan No. 12, Kec. Menteng, Jakarta Pusat 10310',
    alamat2  : 'Telp. (021) 1234567 | Email: info@smpal.sch.id',
    kota     : 'Jakarta'
  };

  function readKop() {
    try {
      const raw = localStorage.getItem(KEY_KOP);
      const obj = raw ? JSON.parse(raw) : {};
      return Object.assign({}, KOP_DEFAULT, obj || {});
    } catch (e) {
      return Object.assign({}, KOP_DEFAULT);
    }
  }

  function writeKop(kop) {
    try {
      localStorage.setItem(KEY_KOP, JSON.stringify(kop));
    } catch (e) {
      console.warn('Gagal menyimpan kop (kemungkinan penuh):', e);
      alert('Gagal menyimpan pengaturan kop. Kemungkinan penyimpanan browser penuh.\n' +
            'Coba hapus logo gambar atau gunakan gambar yang lebih kecil.');
    }
  }

  /** Isi form input kop dengan nilai tersimpan */
  function loadKopForm() {
    const kop = readKop();
    document.getElementById('kopLogo').value    = kop.logo;
    document.getElementById('kopYayasan').value = kop.yayasan;
    document.getElementById('kopSekolah').value = kop.sekolah;
    document.getElementById('kopAlamat1').value = kop.alamat1;
    document.getElementById('kopAlamat2').value = kop.alamat2;
    document.getElementById('kopKota').value    = kop.kota;
    applyKopToPreview(kop);
    updateLogoPreviewBox(kop);
  }

  /** Terapkan nilai kop ke elemen pratinjau A4 */
  function applyKopToPreview(kop) {
    const pvLogo = document.getElementById('pvLogo');
    if (kop.logoImg) {
      pvLogo.innerHTML = '<img src="' + kop.logoImg + '" alt="Logo Sekolah">';
      pvLogo.style.fontSize = '';
    } else {
      const len = (kop.logo || '').length;
      const fontSize = len <= 2 ? '18pt' : (len === 3 ? '15pt' : '12pt');
      pvLogo.style.fontSize = fontSize;
      pvLogo.textContent = kop.logo || 'AL';
    }

    document.getElementById('pvYayasan').textContent = kop.yayasan || '';
    document.getElementById('pvSekolah').textContent = kop.sekolah || '';
    document.getElementById('pvAlamat1').textContent = kop.alamat1 || '';
    document.getElementById('pvAlamat2').textContent = kop.alamat2 || '';
    document.getElementById('pvKota').textContent    = kop.kota    || 'Jakarta';
  }

  /** Update preview bulat kecil di form */
  function updateLogoPreviewBox(kop) {
    const box = document.getElementById('logoPreviewBox');
    if (!box) return;
    if (kop.logoImg) {
      box.innerHTML = '<img src="' + kop.logoImg + '" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;" alt="Logo">';
    } else {
      box.textContent = kop.logo || 'AL';
    }
  }

  function getKopFromForm() {
    const current = readKop();
    return {
      logo    : val('kopLogo')    || KOP_DEFAULT.logo,
      logoImg : current.logoImg || '',
      yayasan : val('kopYayasan') || KOP_DEFAULT.yayasan,
      sekolah : val('kopSekolah') || KOP_DEFAULT.sekolah,
      alamat1 : val('kopAlamat1') || KOP_DEFAULT.alamat1,
      alamat2 : val('kopAlamat2') || KOP_DEFAULT.alamat2,
      kota    : val('kopKota')    || KOP_DEFAULT.kota
    };
  }

  /* Listener input teks pada field kop (live preview + auto-save) */
  ['kopLogo','kopYayasan','kopSekolah','kopAlamat1','kopAlamat2','kopKota'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      const kop = getKopFromForm();
      applyKopToPreview(kop);
      updateLogoPreviewBox(kop);
      writeKop(kop);
    });
  });

  /* Helper: resize gambar via canvas agar hemat localStorage */
  function resizeImageDataUrl(dataUrl, maxSize, callback) {
    const img = new Image();
    img.onload = function () {
      let w = img.width;
      let h = img.height;

      if (w > h) {
        if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
      } else {
        if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      callback(canvas.toDataURL('image/png'));
    };
    img.onerror = function () {
      console.error('[SIMPEL SURAT] Gagal memuat gambar untuk resize.');
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  /* Event: Upload Logo */
  document.getElementById('kopLogoFile').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.indexOf(file.type) === -1) {
      alert('Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.');
      this.value = '';
      return;
    }

    if (file.size > 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 1 MB.');
      this.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
      const rawDataUrl = ev.target.result;

      // Resize ke maksimal 256×256 px agar hemat localStorage
      resizeImageDataUrl(rawDataUrl, 256, function (resizedDataUrl) {
        const kop = readKop();
        kop.logoImg = resizedDataUrl;
        writeKop(kop);
        applyKopToPreview(kop);
        updateLogoPreviewBox(kop);
        console.log('[SIMPEL SURAT] Logo gambar berhasil diunggah & disimpan.');
      });
    };
    reader.onerror = function () {
      alert('Gagal membaca file. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);

    this.value = '';
  });

  /* Event: Hapus gambar logo */
  document.getElementById('btnHapusLogoImg').addEventListener('click', function () {
    const kop = readKop();
    if (!kop.logoImg) {
      alert('Belum ada gambar logo yang diunggah.');
      return;
    }
    if (!confirm('Hapus gambar logo dan kembali ke teks singkatan?')) return;
    kop.logoImg = '';
    writeKop(kop);
    applyKopToPreview(kop);
    updateLogoPreviewBox(kop);
    console.log('[SIMPEL SURAT] Gambar logo dihapus.');
  });

  /* Tombol reset kop surat */
  document.getElementById('btnResetKop').addEventListener('click', function () {
    if (!confirm('Reset kop surat ke pengaturan awal? (termasuk logo)')) return;
    writeKop(KOP_DEFAULT);
    loadKopForm();
    console.log('[SIMPEL SURAT] Kop surat direset ke default.');
  });

  /* =========================================================
     5. CRUD SURAT MASUK
     ========================================================= */
  let editMasukId = null;

  function renderMasuk() {
    const keyword = (document.getElementById('cariMasuk').value || '').toLowerCase().trim();
    const all = readStore(KEY_MASUK);

    const data = all.filter(function (d) {
      if (!keyword) return true;
      return [d.nomor, d.tglDiterima, d.tglSurat, d.pengirim, d.perihal]
        .join(' ').toLowerCase().includes(keyword);
    });

    const tbody = document.getElementById('bodyMasuk');

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="px-4 py-12 text-center text-slate-400 text-sm">' +
        '<i class="fa-regular fa-folder-open text-2xl block mb-2"></i>' +
        (keyword ? 'Data tidak ditemukan untuk pencarian tersebut.' : 'Belum ada data surat masuk.') +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function (d, i) {
      return '<tr class="border-t border-slate-100 hover:bg-blue-50/40 transition">' +
        '<td class="px-4 py-3 text-slate-400 text-xs">' + (i + 1) + '</td>' +
        '<td class="px-4 py-3 font-semibold text-slate-800">' + esc(d.nomor) + '</td>' +
        '<td class="px-4 py-3 text-slate-600 whitespace-nowrap">' + esc(formatTanggalIndo(d.tglDiterima)) + '</td>' +
        '<td class="px-4 py-3 text-slate-600 whitespace-nowrap">' + esc(formatTanggalIndo(d.tglSurat)) + '</td>' +
        '<td class="px-4 py-3 text-slate-600">' + esc(d.pengirim) + '</td>' +
        '<td class="px-4 py-3 text-slate-600">' + esc(d.perihal) + '</td>' +
        '<td class="px-4 py-3 text-right whitespace-nowrap">' +
          '<button type="button" data-action="edit-masuk" data-id="' + d.id + '" title="Edit" ' +
            'class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition mr-1">' +
            '<i class="fa-solid fa-pen text-xs"></i></button>' +
          '<button type="button" data-action="hapus-masuk" data-id="' + d.id + '" title="Hapus" ' +
            'class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">' +
            '<i class="fa-solid fa-trash text-xs"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  document.getElementById('formMasuk').addEventListener('submit', function (e) {
    e.preventDefault();

    const record = {
      id: editMasukId || makeId('M'),
      nomor: val('inNomorMasuk'),
      tglDiterima: val('inTglDiterima'),
      tglSurat: val('inTglSurat'),
      pengirim: val('inPengirim'),
      perihal: val('inPerihal'),
      createdAt: Date.now()
    };

    const data = readStore(KEY_MASUK);

    if (editMasukId) {
      const idx = data.findIndex(function (d) { return d.id === editMasukId; });
      if (idx > -1) {
        record.createdAt = data[idx].createdAt || Date.now();
        data[idx] = record;
      }
    } else {
      data.unshift(record);
    }

    writeStore(KEY_MASUK, data);
    resetFormMasuk();
    renderAll();
    console.log('[SIMPEL SURAT] Surat masuk disimpan:', record.nomor);
  });

  function editMasuk(id) {
    const data = readStore(KEY_MASUK);
    const d = data.find(function (x) { return x.id === id; });
    if (!d) return;

    editMasukId = id;
    document.getElementById('inNomorMasuk').value  = d.nomor || '';
    document.getElementById('inTglDiterima').value = d.tglDiterima || '';
    document.getElementById('inTglSurat').value    = d.tglSurat || '';
    document.getElementById('inPengirim').value    = d.pengirim || '';
    document.getElementById('inPerihal').value     = d.perihal || '';

    document.getElementById('btnSimpanMasuk').innerHTML = '<i class="fa-solid fa-check"></i><span>Update</span>';
    document.getElementById('btnBatalMasuk').classList.remove('hidden');
    document.getElementById('btnBatalMasuk').classList.add('inline-flex');

    document.getElementById('formMasuk').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hapusMasuk(id) {
    if (!confirm('Yakin ingin menghapus data surat masuk ini?')) return;
    const data = readStore(KEY_MASUK).filter(function (d) { return d.id !== id; });
    writeStore(KEY_MASUK, data);
    if (editMasukId === id) resetFormMasuk();
    renderAll();
  }

  function resetFormMasuk() {
    editMasukId = null;
    document.getElementById('formMasuk').reset();
    document.getElementById('btnSimpanMasuk').innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>Simpan</span>';
    document.getElementById('btnBatalMasuk').classList.add('hidden');
    document.getElementById('btnBatalMasuk').classList.remove('inline-flex');
  }

  document.getElementById('btnBatalMasuk').addEventListener('click', resetFormMasuk);
  document.getElementById('cariMasuk').addEventListener('input', renderMasuk);

  /* =========================================================
     6. CRUD SURAT KELUAR
     ========================================================= */
  let editKeluarId = null;

  function renderKeluar() {
    const keyword = (document.getElementById('cariKeluar').value || '').toLowerCase().trim();
    const all = readStore(KEY_KELUAR);

    const data = all.filter(function (d) {
      if (!keyword) return true;
      return [d.nomor, d.tanggal, d.tujuan, d.perihal]
        .join(' ').toLowerCase().includes(keyword);
    });

    const tbody = document.getElementById('bodyKeluar');

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-4 py-12 text-center text-slate-400 text-sm">' +
        '<i class="fa-regular fa-folder-open text-2xl block mb-2"></i>' +
        (keyword ? 'Data tidak ditemukan untuk pencarian tersebut.' : 'Belum ada data surat keluar.') +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function (d, i) {
      return '<tr class="border-t border-slate-100 hover:bg-emerald-50/40 transition">' +
        '<td class="px-4 py-3 text-slate-400 text-xs">' + (i + 1) + '</td>' +
        '<td class="px-4 py-3 font-semibold text-slate-800">' + esc(d.nomor) + '</td>' +
        '<td class="px-4 py-3 text-slate-600 whitespace-nowrap">' + esc(formatTanggalIndo(d.tanggal)) + '</td>' +
        '<td class="px-4 py-3 text-slate-600">' + esc(d.tujuan) + '</td>' +
        '<td class="px-4 py-3 text-slate-600">' + esc(d.perihal) + '</td>' +
        '<td class="px-4 py-3 text-right whitespace-nowrap">' +
          '<button type="button" data-action="edit-keluar" data-id="' + d.id + '" title="Edit" ' +
            'class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition mr-1">' +
            '<i class="fa-solid fa-pen text-xs"></i></button>' +
          '<button type="button" data-action="hapus-keluar" data-id="' + d.id + '" title="Hapus" ' +
            'class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">' +
            '<i class="fa-solid fa-trash text-xs"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  document.getElementById('formKeluar').addEventListener('submit', function (e) {
    e.preventDefault();

    const record = {
      id: editKeluarId || makeId('K'),
      nomor: val('inNomorKeluar'),
      tanggal: val('inTglKeluar'),
      tujuan: val('inTujuan'),
      perihal: val('inPerihalKeluar'),
      createdAt: Date.now()
    };

    const data = readStore(KEY_KELUAR);

    if (editKeluarId) {
      const idx = data.findIndex(function (d) { return d.id === editKeluarId; });
      if (idx > -1) {
        record.createdAt = data[idx].createdAt || Date.now();
        data[idx] = record;
      }
    } else {
      data.unshift(record);
    }

    writeStore(KEY_KELUAR, data);
    resetFormKeluar();
    renderAll();
    console.log('[SIMPEL SURAT] Surat keluar disimpan:', record.nomor);
  });

  function editKeluar(id) {
    const data = readStore(KEY_KELUAR);
    const d = data.find(function (x) { return x.id === id; });
    if (!d) return;

    editKeluarId = id;
    document.getElementById('inNomorKeluar').value   = d.nomor || '';
    document.getElementById('inTglKeluar').value     = d.tanggal || '';
    document.getElementById('inTujuan').value        = d.tujuan || '';
    document.getElementById('inPerihalKeluar').value = d.perihal || '';

    document.getElementById('btnSimpanKeluar').innerHTML = '<i class="fa-solid fa-check"></i><span>Update</span>';
    document.getElementById('btnBatalKeluar').classList.remove('hidden');
    document.getElementById('btnBatalKeluar').classList.add('inline-flex');

    document.getElementById('formKeluar').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hapusKeluar(id) {
    if (!confirm('Yakin ingin menghapus data surat keluar ini?')) return;
    const data = readStore(KEY_KELUAR).filter(function (d) { return d.id !== id; });
    writeStore(KEY_KELUAR, data);
    if (editKeluarId === id) resetFormKeluar();
    renderAll();
  }

  function resetFormKeluar() {
    editKeluarId = null;
    document.getElementById('formKeluar').reset();
    document.getElementById('btnSimpanKeluar').innerHTML = '<i class="fa-solid fa-floppy-disk"></i><span>Simpan</span>';
    document.getElementById('btnBatalKeluar').classList.add('hidden');
    document.getElementById('btnBatalKeluar').classList.remove('inline-flex');
  }

  document.getElementById('btnBatalKeluar').addEventListener('click', resetFormKeluar);
  document.getElementById('cariKeluar').addEventListener('input', renderKeluar);

  /* Event delegation untuk tombol Edit/Hapus */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id     = btn.getAttribute('data-id');
    if (action === 'edit-masuk')  editMasuk(id);
    if (action === 'hapus-masuk') hapusMasuk(id);
    if (action === 'edit-keluar') editKeluar(id);
    if (action === 'hapus-keluar') hapusKeluar(id);
  });

  /* =========================================================
     7. DASHBOARD
     ========================================================= */
  function renderDashboard() {
    const masuk  = readStore(KEY_MASUK);
    const keluar = readStore(KEY_KELUAR);
    const now    = new Date();

    const bulanIni = keluar.filter(function (d) {
      if (!d.tanggal) return false;
      const t = new Date(d.tanggal + 'T00:00:00');
      return !isNaN(t.getTime()) &&
             t.getMonth() === now.getMonth() &&
             t.getFullYear() === now.getFullYear();
    }).length;

    document.getElementById('statMasuk').textContent  = masuk.length;
    document.getElementById('statKeluar').textContent = keluar.length;
    document.getElementById('statBulan').textContent  = bulanIni;

    const aktivitas = [];

    masuk.forEach(function (d) {
      aktivitas.push({
        tipe: 'masuk',
        nomor: d.nomor || '-',
        teks: 'Surat masuk dari ' + (d.pengirim || '-') + ' — ' + (d.perihal || '-'),
        waktu: d.createdAt || 0
      });
    });

    keluar.forEach(function (d) {
      aktivitas.push({
        tipe: 'keluar',
        nomor: d.nomor || '-',
        teks: 'Surat keluar ke ' + (d.tujuan || '-') + ' — ' + (d.perihal || '-'),
        waktu: d.createdAt || 0
      });
    });

    aktivitas.sort(function (a, b) { return b.waktu - a.waktu; });
    const tampil = aktivitas.slice(0, 6);
    const tbody = document.getElementById('bodyAktivitas');

    if (tampil.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-5 py-12 text-center text-slate-400 text-sm">' +
        '<i class="fa-regular fa-clock text-2xl block mb-2"></i>Belum ada aktivitas tercatat.</td></tr>';
      return;
    }

    tbody.innerHTML = tampil.map(function (a) {
      const badge = a.tipe === 'masuk'
        ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">' +
          '<i class="fa-solid fa-arrow-down"></i>Masuk</span>'
        : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">' +
          '<i class="fa-solid fa-arrow-up"></i>Keluar</span>';

      return '<tr class="border-t border-slate-100 hover:bg-slate-50 transition">' +
        '<td class="px-5 py-3">' + badge + '</td>' +
        '<td class="px-5 py-3 font-semibold text-slate-700">' + esc(a.nomor) + '</td>' +
        '<td class="px-5 py-3 text-slate-600">' + esc(a.teks) + '</td>' +
        '<td class="px-5 py-3 text-right text-slate-400 text-xs whitespace-nowrap">' + esc(formatWaktu(a.waktu)) + '</td>' +
      '</tr>';
    }).join('');
  }

  /* =========================================================
     8. GENERATOR SURAT — LIVE PREVIEW
     ========================================================= */
  const ISI_DEFAULT =
  'Sehubungan dengan akan dilaksanakannya kegiatan Sosialisasi Program Sekolah Tahun Pelajaran 2025/2026, ' +
  'maka kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali Siswa pada:\n\n' +
  'Hari/Tanggal : Sabtu, 15 Maret 2025\n' +
  'Waktu        : 08.00 WIB s.d. selesai\n' +
  'Tempat       : Aula SMP Al\n\n' +
  'Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.';

  function updatePreview() {
    const nomor   = val('genNomor');
    const tanggal = val('genTanggal');
    const tujuan  = val('genTujuan');
    const perihal = val('genPerihal');
    const isi     = document.getElementById('genIsi').value;

    document.getElementById('pvNomor').textContent   = nomor   || '........................................';
    document.getElementById('pvPerihal').textContent = perihal || '........................................';
    document.getElementById('pvTujuan').textContent  = tujuan  || '........................................';

    if (tanggal) {
      document.getElementById('pvTanggal').textContent = formatTanggalIndo(tanggal);
    } else {
      const now = new Date();
      document.getElementById('pvTanggal').textContent =
        now.getDate() + ' ' + BULAN_ID[now.getMonth()] + ' ' + now.getFullYear();
    }

    const isiAman = esc(isi.trim() || ISI_DEFAULT).replace(/\n/g, '<br>');
    document.getElementById('pvIsi').innerHTML = isiAman;
  }

  ['genNomor', 'genTanggal', 'genTujuan', 'genPerihal', 'genIsi'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', updatePreview);
    document.getElementById(id).addEventListener('change', updatePreview);
  });

  document.getElementById('btnResetGen').addEventListener('click', function () {
    document.getElementById('genNomor').value   = '';
    document.getElementById('genTanggal').value = '';
    document.getElementById('genTujuan').value  = '';
    document.getElementById('genPerihal').value = '';
    document.getElementById('genIsi').value     = ISI_DEFAULT;
    updatePreview();
  });

  /* =========================================================
     9. EXPORT KE PDF
     ========================================================= */
  document.getElementById('btnPdf').addEventListener('click', async function () {
    const paper = document.getElementById('paperA4');
    const btn   = this;
    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>';

    const prevShadow = paper.style.boxShadow;
    const prevBorder = paper.style.border;
    paper.style.boxShadow = 'none';
    paper.style.border = 'none';

    const opsi = {
      margin: 0,
      filename: 'Surat_Resmi.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        windowWidth: paper.scrollWidth
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(opsi).from(paper).save();
      console.log('[SIMPEL SURAT] PDF berhasil dibuat.');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      paper.style.boxShadow = prevShadow;
      paper.style.border = prevBorder;
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });

  /* =========================================================
     10. EXPORT KE WORD (.doc / .docx)
     ========================================================= */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  document.getElementById('btnWord').addEventListener('click', function () {
    const kontenSurat = document.getElementById('docContent').outerHTML;
    const docCSS = document.getElementById('docStyles').innerHTML;

    const htmlWord =
      '<!DOCTYPE html>' +
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
            'xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>Surat Resmi</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument>' +
      '<w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/>' +
      '</w:WordDocument></xml><![endif]-->' +
      '<style>' +
      '@page { size: A4 portrait; margin: 2cm 2.5cm; }' +
      'body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; }' +
      docCSS +
      '</style></head><body>' + kontenSurat + '</body></html>';

    if (window.htmlDocx && typeof window.htmlDocx.asBlob === 'function') {
      try {
        const blob = window.htmlDocx.asBlob(htmlWord);
        downloadBlob(blob, 'Surat_Resmi.docx');
        console.log('[SIMPEL SURAT] Word (.docx) berhasil dibuat.');
        return;
      } catch (err) {
        console.warn('html-docx-js gagal, memakai fallback .doc', err);
      }
    }

    const blob = new Blob(['\ufeff', htmlWord], { type: 'application/msword' });
    downloadBlob(blob, 'Surat_Resmi.doc');
    console.log('[SIMPEL SURAT] Word (.doc) berhasil dibuat.');
  });

  /* =========================================================
     11. INISIALISASI APLIKASI
     ========================================================= */
  function renderAll() {
    renderDashboard();
    renderMasuk();
    renderKeluar();
  }

  try {
    loadKopForm();
    document.getElementById('genIsi').value = ISI_DEFAULT;
    updatePreview();
    renderAll();
    navigateTo('dashboard');

    if (window.innerWidth < 1024) sidebar.classList.add('-translate-x-full');

    console.log('%c[SIMPEL SURAT] Inisialisasi BERHASIL. Nav links ditemukan: ' +
      document.querySelectorAll('.nav-link').length, 'color:#059669;font-weight:bold');
  } catch (err) {
    console.error('%c[SIMPEL SURAT] Error saat inisialisasi:', 'color:#dc2626;font-weight:bold', err);
  }
});