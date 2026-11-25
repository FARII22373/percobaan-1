/* SIP-Salaman static authentication for GitHub Pages + Supabase Auth */
(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const configMissing =
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_URL.includes("YOUR-PROJECT-REF") ||
    cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

  let client = null;
  if (!configMissing && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  function showMessage(message, type) {
    const box = document.getElementById("authMessage");
    if (!box) return;
    box.hidden = false;
    box.className = "alert " + (type === "success" ? "alert-success" : "alert-error");
    box.textContent = message;
  }

  function displayName(user) {
    if (!user) return "Pengguna";
    const meta = user.user_metadata || {};
    return meta.username || user.email || "Pengguna";
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function guardProtectedPage() {
    if (document.body.dataset.authRequired !== "true") return;
    if (configMissing || !client) {
      document.body.innerHTML =
        '<main style="font:16px Arial;max-width:720px;margin:10vh auto;padding:24px">' +
        '<h2>Konfigurasi Supabase belum lengkap</h2>' +
        '<p>Isi SUPABASE_URL dan SUPABASE_ANON_KEY pada file <code>config.js</code>, lalu unggah ulang ke GitHub.</p></main>';
      return;
    }
    try {
      const session = await getSession();
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      document.querySelectorAll("[data-user-name]").forEach((el) => {
        el.textContent = displayName(session.user);
      });
    } catch (error) {
      console.error("Session check failed:", error);
      window.location.replace("login.html");
    }
  }

  function setLoginMode(mode) {
    const isRegister = mode === "register";
    const title = document.getElementById("formTitle");
    if (!title) return;
    document.getElementById("formDescription").textContent = isRegister
      ? "Buat akun untuk mengakses layanan SIP."
      : "Masukkan email dan kata sandi untuk melanjutkan ke SIP.";
    title.textContent = isRegister ? "Daftar Akun Baru" : "Masuk ke Akun";
    document.getElementById("usernameGroup").hidden = !isRegister;
    document.getElementById("confirmGroup").hidden = !isRegister;
    document.getElementById("passwordHelp").hidden = !isRegister;
    document.getElementById("password").autocomplete = isRegister ? "new-password" : "current-password";
    document.getElementById("confirm_password").required = isRegister;
    document.getElementById("username").required = isRegister;
    document.getElementById("submitButton").textContent = isRegister
      ? "Daftar Sekarang"
      : "Masuk ke Dashboard";
    document.getElementById("switchMode").innerHTML = isRegister
      ? 'Sudah mempunyai akun? <a href="login.html" id="modeLink">Masuk Sekarang</a>'
      : 'Belum mempunyai akun? <a href="login.html?mode=register" id="modeLink">Daftar Sekarang</a>';
    const url = new URL(window.location.href);
    if (isRegister) url.searchParams.set("mode", "register");
    else url.searchParams.delete("mode");
    history.replaceState({}, "", url);
  }

  async function initLoginPage() {
    if (!document.body.dataset.loginPage) return;
    let mode = new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register" : "login";
    setLoginMode(mode);

    if (configMissing || !client) {
      showMessage("Supabase belum dikonfigurasi. Isi URL project dan publishable/anon key pada config.js.", "error");
    } else {
      try {
        const session = await getSession();
        if (session) {
          window.location.replace("index.html");
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    document.getElementById("switchMode").addEventListener("click", function (event) {
      const link = event.target.closest("#modeLink");
      if (!link) return;
      event.preventDefault();
      mode = mode === "register" ? "login" : "register";
      setLoginMode(mode);
      const msg = document.getElementById("authMessage");
      if (msg) msg.hidden = true;
    });

    document.getElementById("authForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!client) {
        showMessage("Supabase belum dikonfigurasi. Periksa file config.js.", "error");
        return;
      }

      const button = document.getElementById("submitButton");
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const username = document.getElementById("username").value.trim();
      const confirm = document.getElementById("confirm_password").value;
      const isRegister = new URLSearchParams(window.location.search).get("mode") === "register";

      if (isRegister) {
        if (!/^[a-zA-Z0-9_]{4,30}$/.test(username)) {
          showMessage("Username harus 4–30 karakter, berupa huruf, angka, atau underscore.", "error");
          return;
        }
        if (password.length < 8) {
          showMessage("Kata sandi minimal 8 karakter.", "error");
          return;
        }
        if (password !== confirm) {
          showMessage("Konfirmasi kata sandi tidak sesuai.", "error");
          return;
        }
      }

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Memproses...";
      try {
        if (isRegister) {
          const redirectTo = window.location.origin + window.location.pathname.replace(/[^/]*$/, "index.html");
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: { username },
              emailRedirectTo: redirectTo
            }
          });
          if (error) throw error;
          if (data.session) {
            showMessage("Pendaftaran berhasil. Mengalihkan ke dashboard...", "success");
            window.location.replace("index.html");
          } else {
            showMessage("Pendaftaran berhasil. Silakan periksa email untuk konfirmasi akun, lalu masuk kembali.", "success");
            setLoginMode("login");
          }
        } else {
          const { error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          showMessage("Login berhasil. Mengalihkan ke dashboard...", "success");
          window.location.replace("index.html");
        }
      } catch (error) {
        console.error("Supabase Auth:", error);
        let message = error.message || "Terjadi kesalahan autentikasi.";
        if (/Invalid login credentials/i.test(message)) message = "Email atau kata sandi tidak sesuai.";
        if (/User already registered/i.test(message)) message = "Email sudah terdaftar. Silakan masuk.";
        showMessage(message, "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  async function initLogout() {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        if (!client) {
          window.location.replace("login.html");
          return;
        }
        try {
          await client.auth.signOut();
        } catch (error) {
          console.error("Logout error:", error);
        }
        window.location.replace("login.html");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await guardProtectedPage();
    await initLoginPage();
    await initLogout();
  });

  window.SIPAuth = {
    get client() { return client; },
    getSession,
    signOut: () => client ? client.auth.signOut() : Promise.resolve()
  };
})();
