const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A'; // clave pública

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM listo, Supabase:", supabaseClient);

  const loginForm = document.querySelector('.login form');
  const signupForm = document.querySelector('.signup form');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signupForm.querySelector('input[name="email"]').value;
    const password = signupForm.querySelector('input[name="password"]').value;

    const { error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      alert("Registrado correctamente ✅");
      localStorage.setItem("planty_logged_in", "true");
      window.location.href = "planty.html";
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value;
    const password = loginForm.querySelector('input[name="password"]').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Error al iniciar sesión: " + error.message);
    } else {
      alert("Sesión iniciada 🎉");
      localStorage.setItem("planty_logged_in", "true");
      window.location.href = "planty.html";
    }
  });
});
