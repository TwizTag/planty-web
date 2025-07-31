const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A'; // tu clave pública

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM listo, Supabase:", supabaseClient);

  if (error || !data.user) {
    // El usuario no está logueado → lo mando al login
    window.location.href = "index.html"; // o donde tengas tu login
    return;
  }

  console.log("✅ Usuario logueado:", data.user.email);
  cargarCultivos(); // o lo que tengas que ejecutar

  document.getElementById('logout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html"; // volver al login
});

  const loginForm = document.querySelector('.login form');
  const signupForm = document.querySelector('.signup form');

  // Registro (sign up)
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupForm.querySelector('input[name="email"]').value;
    const password = signupForm.querySelector('input[name="password"]').value;

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://planty-web.vercel.app/email-confirmed.html' // ⬅️ importante para redirigir luego de confirmar
      }
    });

    if (error) {
      alert("❌ Error al registrar: " + error.message);
    } else {
      alert("✅ Registrado correctamente. Revisá tu email para confirmar la cuenta.");
      // No redirigimos aún hasta que confirme el email
    }
  });

  // Login (sign in)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value;
    const password = loginForm.querySelector('input[name="password"]').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      alert("❌ Error al iniciar sesión: " + error.message);
      return;
    }

    const user = data.user;

    if (!user.email_confirmed_at) {
      alert("⚠️ Aún no confirmaste tu email. Revisá tu bandeja de entrada.");
      await supabaseClient.auth.signOut();
      return;
    }

    alert("🎉 Sesión iniciada con éxito.");
    localStorage.setItem("planty_logged_in", "true");
    window.location.href = "login-planty.html"; // o planty.html si preferís
  });
});

