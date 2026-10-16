/* =========================================================
   SISTEM ADMINISTRASI SURAT MENYURAT SEKOLAH
   File: app.js
   Deskripsi: Logika utama (auth, routing, CRUD, generator, export)
   Penulis: Muchammad Muarief, S. Pd.
   ========================================================= */

console.log('%c[SIMPEL SURAT] app.js mulai dimuat...', 'color:#1e40af;font-weight:bold');

document.addEventListener('DOMContentLoaded', function () {
  console.log('[SIMPEL SURAT] DOM siap.');

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

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /* =========================================================
     1. MODUL AUTENTIKASI (LOGIN / REGISTER)
     ========================================================= */
  const KEY_USERS   = 'smp_users_v1';
  const KEY_SESSION = 'smp_session_v1';

  let currentUser = null;

  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + '::' + password + '::' + salt);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  function readUsers() {
    try {
      const raw = localStorage.getItem(KEY_USERS);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('Gagal membaca daftar user:', e);
      return [];
    }
  }

  function writeUsers(arr) {
    try {
      localStorage.setItem(KEY_USERS, JSON.stringify(arr));
    } catch (e) {
      console.error('Gagal menyimpan user:', e);
      throw new Error('Penyimpanan browser penuh.');
    }
  }

  function writeSession(user) {
    try {
      localStorage.setItem(KEY_SESSION, JSON.stringify({
        userId: user.id,
        loginAt: Date.now()
      }));
    } catch (e) {
      console.warn('Gagal menyimpan sesi:', e);
    }
  }

  function clearSession() {
    try { localStorage.removeItem(KEY_SESSION); } catch (e) {}
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      if (!raw) return null;
      const sess = JSON.parse(raw);
      if (!sess || !sess.userId) return null;
      const user = readUsers().find(function (u) { return u.id === sess.userId; });
      return user || null;
    } catch (e) {
      return null;
    }
  }

  async function registerUser(nama, username, email, password) {
    const users = readUsers();

    const unameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();
    if (users.some(function (u) { return u.username.toLowerCase() === unameLower; })) {
      throw new Error('Username sudah dipakai. Coba yang lain.');
    }
    if (users.some(function (u) { return u.email.toLowerCase() === emailLower; })) {
      throw new Error('Email sudah terdaftar. Gunakan email lain atau login.');
    }

    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
    const passwordHash = await hashPassword(password, salt);

    const newUser = {
      id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36),
      nama: nama,
      username: username,
      email: email,
      salt: salt,
      passwordHash: passwordHash,
      createdAt: Date.now()
    };

    users.push(newUser);
    writeUsers(users);
    return newUser;
  }

  async function loginUser(identifier, password) {
    const users = readUsers();
    const idLower = identifier.toLowerCase();

    const user = users.find(function (u) {
      return u.username.toLowerCase() === idLower || u.email.toLowerCase() === idLower;
    });
    if (!user) throw new Error('Username/email tidak ditemukan.');

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) throw new Error('Password salah.');

    return user;
  }

  /* =========================================================
     2. UI AUTH
     ========================================================= */
  const authPage     = document.getElementById('authPage');
  const mainApp      = document.getElementById('mainApp');
  const tabLogin     = document.getElementById('tabLogin');
  const tabRegister  = document.getElementById('tabRegister');
  const formLogin    = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');

  function switchAuthTab(mode) {
    const isLogin = mode === 'login';
    formLogin.classList.toggle('hidden', !isLogin);
    formRegister.classList.toggle('hidden', isLogin);

    tabLogin.classList.toggle('auth-tab-active', isLogin);
    tabLogin.classList.toggle('auth-tab-inactive', !isLogin);
    tabRegister.classList.toggle('auth-tab-active', !isLogin);
    tabRegister.classList.toggle('auth-tab-inactive', isLogin);

    hideAuthMessages();
  }

  function hideAuthMessages() {
    ['loginError','registerError','registerSuccess'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function showAuthError(targetId, textId, msg) {
    const box = document.getElementById(targetId);
    const txt = document.getElementById(textId);
    if (!box || !txt) return;
    txt.textContent = msg;
    box.classList.remove('hidden');
    box.classList.add('shake');
    setTimeout(function () { box.classList.remove('shake'); }, 350);
  }

  function showAuthSuccess(targetId, textId, msg) {
    const box = document.getElementById(targetId);
    const txt = document.getElementById(textId);
    if (!box || !txt) return;
    txt.textContent = msg;
    box.classList.remove('hidden');
  }

  tabLogin.addEventListener('click', function () { switchAuthTab('login'); });
  tabRegister.addEventListener('click', function () { switchAuthTab('register'); });
  document.getElementById('linkToRegister').addEventListener('click', function () { switchAuthTab('register'); });
  document.getElementById('linkToLogin').addEventListener('click', function () { switchAuthTab('login'); });

  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = document.getElementById(this.dataset.target);
      if (!target) return;
      const isPwd = target.type === 'password';
      target.type = isPwd ? 'text' : 'password';
      this.innerHTML = isPwd
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    });
  });

  document.getElementById('regPassword').addEventListener('input', function () {
    const v = this.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const bar = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');

    let pct = 0, color = '#cbd5e1', label = 'Kekuatan password';
    if (v.length === 0) { pct = 0; color = '#cbd5e1'; label = 'Kekuatan password'; }
    else if (score <= 1) { pct = 25; color = '#ef4444'; label = 'Lemah'; }
    else if (score === 2) { pct = 50; color = '#f59e0b'; label = 'Cukup'; }
    else if (score === 3) { pct = 75; color = '#3b82f6'; label = 'Kuat'; }
    else { pct = 100; color = '#10b981'; label = 'Sangat kuat'; }

    bar.style.width = pct + '%';
    bar.style.backgroundColor = color;
    text.textContent = label;
    text.style.color = v.length ? color : '#94a3b8';
  });

  /* ---- SUBMIT: LOGIN ---- */
  formLogin.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAuthMessages();

    const identifier = val('loginIdentifier');
    const password   = document.getElementById('loginPassword').value;
    const btn        = document.getElementById('btnLogin');
    const original   = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>';

    try {
      const user = await loginUser(identifier, password);
      currentUser = user;
      writeSession(user);
      console.log('[SIMPEL SURAT] Login berhasil:', user.username);
      enterMainApp();
    } catch (err) {
      showAuthError('loginError', 'loginErrorText', err.message || 'Login gagal.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });

  /* ---- SUBMIT: REGISTER ---- */
  formRegister.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAuthMessages();

    const nama      = val('regNama');
    const username  = val('regUsername');
    const email     = val('regEmail');
    const password  = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const btn       = document.getElementById('btnRegister');
    const original  = btn.innerHTML;

    if (nama.length < 3) {
      return showAuthError('registerError', 'registerErrorText', 'Nama lengkap minimal 3 karakter.');
    }
    if (!/^[a-zA-Z0-9._]{4,20}$/.test(username)) {
      return showAuthError('registerError', 'registerErrorText',
        'Username harus 4-20 karakter, hanya huruf/angka/titik/garis bawah.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showAuthError('registerError', 'registerErrorText', 'Format email tidak valid.');
    }
    if (password.length < 6) {
      return showAuthError('registerError', 'registerErrorText', 'Password minimal 6 karakter.');
    }
    if (password !== password2) {
      return showAuthError('registerError', 'registerErrorText', 'Konfirmasi password tidak cocok.');
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>';

    try {
      const user = await registerUser(nama, username, email, password);
      console.log('[SIMPEL SURAT] Register berhasil:', user.username);

      showAuthSuccess('registerSuccess', 'registerSuccessText',
        'Akun berhasil dibuat! Mengalihkan ke halaman login...');

      formRegister.reset();
      document.getElementById('strengthBar').style.width = '0';
      document.getElementById('strengthText').textContent = 'Kekuatan password';

      setTimeout(function () {
        document.getElementById('loginIdentifier').value = user.username;
        document.getElementById('loginPassword').value = '';
        switchAuthTab('login');
        document.getElementById('loginPassword').focus();
      }, 1400);

    } catch (err) {
      showAuthError('registerError', 'registerErrorText', err.message || 'Registrasi gagal.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });

  /* =========================================================
     3. MASUK / KELUAR APLIKASI UTAMA
     ========================================================= */
  function enterMainApp() {
    authPage.classList.add('hidden');
    mainApp.classList.remove('hidden');

    const name = currentUser.nama || currentUser.username;
    document.getElementById('userNameSidebar').textContent = name;
    document.getElementById('userRoleSidebar').textContent = '@' + currentUser.username;
    document.getElementById('userNameHeader').textContent  = name;
    document.getElementById('userEmailHeader').textContent = currentUser.email;
    document.getElementById('userAvatarSidebar').textContent = initials(name);
    document.getElementById('userAvatarHeader').textContent  = initials(name);

    const pvTtdKiri = document.getElementById('pvTtdKiriNama');
    if (pvTtdKiri) pvTtdKiri.textContent = name;

    initMainApp();
  }

  function exitMainApp() {
    currentUser = null;
    clearSession();

    mainApp.classList.add('hidden');
    authPage.classList.remove('hidden');

    switchAuthTab('login');
    document.getElementById('loginPassword').value = '';

    ALL_PAGES.forEach(function (p) {
      const el = document.getElementById('page-' + p);
      if (el) el.classList.add('hidden');
    });
  }

  document.getElementById('btnLogout').addEventListener('click', function () {
    if (!confirm('Yakin ingin keluar dari akun ini?')) return;
    console.log('[SIMPEL SURAT] Logout user:', currentUser && currentUser.username);
    exitMainApp();
  });

  /* =========================================================
     4. LAPISAN DATA PER-USER (LocalStorage)
     ========================================================= */
  function dataKey(suffix) {
    if (!currentUser) return 'smp_guest_' + suffix;
    return 'smp_u' + currentUser.id + '_' + suffix;
  }

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
     5. ROUTING / NAVIGASI SPA
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
     6. SIDEBAR MOBILE
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
     7. PENGATURAN KOP SURAT + UPLOAD LOGO
     ========================================================= */
  const KOP_DEFAULT = {
    logo     : 'AL',
    logoImg  : '',
    yayasan  : 'YAYASAN PENDIDIKAN AL',
    sekolah  : 'SMP AL',
    alamat1  : 'Jl. Pendidikan No. 12, Kec. Menteng, Jakarta Pusat 10310',
    alamat2  : 'Telp. (021) 1234567 | Email: info@smpal.sch.id',
    kota     : 'Jakarta'
  };

  function readKop() {
    try {
      const raw = localStorage.getItem(dataKey('kop'));
      const obj = raw ? JSON.parse(raw) : {};
      return Object.assign({}, KOP_DEFAULT, obj || {});
    } catch (e) {
      return Object.assign({}, KOP_DEFAULT);
    }
  }

  function writeKop(kop) {
    try {
      localStorage.setItem(dataKey('kop'), JSON.stringify(kop));
    } catch (e) {
      console.warn('Gagal menyimpan kop:', e);
      alert('Gagal menyimpan pengaturan kop. Kemungkinan penyimpanan browser penuh.');
    }
  }

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

  function resizeImageDataUrl(dataUrl, maxSize, callback) {
    const img = new Image();
    img.onload = function () {
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/png'));
    };
    img.onerror = function () {
      console.error('[SIMPEL SURAT] Gagal memuat gambar.');
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  document.getElementById('kopLogoFile').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.indexOf(file.type) === -1) {
      alert('Format file tidak didukung. Gunakan JPG, JPEG, atau PNG.');
      this.value = ''; return;
    }
    if (file.size > 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 1 MB.');
      this.value = ''; return;
    }

    const reader = new FileReader();
    reader.onload = function (ev) {
      resizeImageDataUrl(ev.target.result, 256, function (resized) {
        const kop = readKop();
        kop.logoImg = resized;
        writeKop(kop);
        applyKopToPreview(kop);
        updateLogoPreviewBox(kop);
        console.log('[SIMPEL SURAT] Logo gambar tersimpan.');
      });
    };
    reader.onerror = function () { alert('Gagal membaca file.'); };
    reader.readAsDataURL(file);
    this.value = '';
  });

  document.getElementById('btnHapusLogoImg').addEventListener('click', function () {
    const kop = readKop();
    if (!kop.logoImg) { alert('Belum ada gambar logo.'); return; }
    if (!confirm('Hapus gambar logo dan kembali ke teks?')) return;
    kop.logoImg = '';
    writeKop(kop);
    applyKopToPreview(kop);
    updateLogoPreviewBox(kop);
  });

  document.getElementById('btnResetKop').addEventListener('click', function () {
    if (!confirm('Reset kop surat ke pengaturan awal?')) return;
    writeKop(KOP_DEFAULT);
    loadKopForm();
  });

  /* =========================================================
     8. CRUD SURAT MASUK
     ========================================================= */
  let editMasukId = null;

  function renderMasuk() {
    const keyword = (document.getElementById('cariMasuk').value || '').toLowerCase().trim();
    const all = readStore(dataKey('masuk'));

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
        (keyword ? 'Data tidak ditemukan.' : 'Belum ada data surat masuk.') +
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
    const key = dataKey('masuk');
    const record = {
      id: editMasukId || makeId('M'),
      nomor: val('inNomorMasuk'),
      tglDiterima: val('inTglDiterima'),
      tglSurat: val('inTglSurat'),
      pengirim: val('inPengirim'),
      perihal: val('inPerihal'),
      createdAt: Date.now()
    };
    const data = readStore(key);

    if (editMasukId) {
      const idx = data.findIndex(function (d) { return d.id === editMasukId; });
      if (idx > -1) {
        record.createdAt = data[idx].createdAt || Date.now();
        data[idx] = record;
      }
    } else {
      data.unshift(record);
    }

    writeStore(key, data);
    resetFormMasuk();
    renderAll();
  });

  function editMasuk(id) {
    const data = readStore(dataKey('masuk'));
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
    const key = dataKey('masuk');
    writeStore(key, readStore(key).filter(function (d) { return d.id !== id; }));
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
     9. CRUD SURAT KELUAR
     ========================================================= */
  let editKeluarId = null;

  function renderKeluar() {
    const keyword = (document.getElementById('cariKeluar').value || '').toLowerCase().trim();
    const all = readStore(dataKey('keluar'));

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
        (keyword ? 'Data tidak ditemukan.' : 'Belum ada data surat keluar.') +
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
    const key = dataKey('keluar');
    const record = {
      id: editKeluarId || makeId('K'),
      nomor: val('inNomorKeluar'),
      tanggal: val('inTglKeluar'),
      tujuan: val('inTujuan'),
      perihal: val('inPerihalKeluar'),
      createdAt: Date.now()
    };
    const data = readStore(key);

    if (editKeluarId) {
      const idx = data.findIndex(function (d) { return d.id === editKeluarId; });
      if (idx > -1) {
        record.createdAt = data[idx].createdAt || Date.now();
        data[idx] = record;
      }
    } else {
      data.unshift(record);
    }

    writeStore(key, data);
    resetFormKeluar();
    renderAll();
  });

  function editKeluar(id) {
    const data = readStore(dataKey('keluar'));
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
    const key = dataKey('keluar');
    writeStore(key, readStore(key).filter(function (d) { return d.id !== id; }));
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
     10. DASHBOARD
     ========================================================= */
  function renderDashboard() {
    const masuk  = readStore(dataKey('masuk'));
    const keluar = readStore(dataKey('keluar'));
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
     11. GENERATOR SURAT — LIVE PREVIEW
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
     12. EXPORT KE PDF
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
      console.log('[SIMPEL SURAT] PDF dibuat.');
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
     13. EXPORT KE WORD
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
        console.log('[SIMPEL SURAT] Word (.docx) dibuat.');
        return;
      } catch (err) {
        console.warn('html-docx-js gagal, pakai fallback .doc', err);
      }
    }

    const blob = new Blob(['\ufeff', htmlWord], { type: 'application/msword' });
    downloadBlob(blob, 'Surat_Resmi.doc');
    console.log('[SIMPEL SURAT] Word (.doc) dibuat.');
  });

  /* =========================================================
     14. INISIALISASI APLIKASI UTAMA
     ========================================================= */
  let mainAppInitialized = false;

  function renderAll() {
    renderDashboard();
    renderMasuk();
    renderKeluar();
  }

  function initMainApp() {
    if (mainAppInitialized) {
      renderAll();
      loadKopForm();
      updatePreview();
      navigateTo('dashboard');
      return;
    }

    try {
      loadKopForm();
      document.getElementById('genIsi').value = ISI_DEFAULT;
      updatePreview();
      renderAll();
      navigateTo('dashboard');

      if (window.innerWidth < 1024) sidebar.classList.add('-translate-x-full');
      mainAppInitialized = true;

      console.log('%c[SIMPEL SURAT] Aplikasi utama siap.', 'color:#059669;font-weight:bold');
    } catch (err) {
      console.error('[SIMPEL SURAT] Error init:', err);
    }
  }

  /* =========================================================
     15. BOOTSTRAP — CEK SESI SAAT HALAMAN DIMUAT
     ========================================================= */
  (function bootstrap() {
    const session = readSession();
    if (session) {
      console.log('[SIMPEL SURAT] Sesi ditemukan untuk:', session.username);
      currentUser = session;
      enterMainApp();
    } else {
      console.log('[SIMPEL SURAT] Tidak ada sesi. Menampilkan halaman login.');
      authPage.classList.remove('hidden');
      mainApp.classList.add('hidden');
    }
  })();
});