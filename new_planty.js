// ==============================
// 🔧 CONFIGURACIÓN SUPABASE
// ==============================
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A'; // tu clave pública
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 👤 AUTENTICACIÓN
// ==============================

async function crearCuenta(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://planty-web.vercel.app/email-confirmed.html'
    }
  });

  if (error) {
    alert("❌ Error al registrar: " + error.message);
    return false;
  }

  // Guardar el username en la tabla profiles
  const userId = data.user?.id;
  if (!userId) return false;

  const { error: profileError } = await supabaseClient
    .from('profiles')
    .insert([{ id: userId, username }]);

  if (profileError) {
    alert('❌ Error al guardar perfil: ' + profileError.message);
    return false;
  }

  alert("✅ Cuenta creada. Confirmá tu email.");
  return true;
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert("❌ Error al iniciar sesión: " + error.message);
    return false;
  }

  const user = data.user;
  if (!user.email_confirmed_at) {
    alert("⚠️ Aún no confirmaste tu email.");
    await supabaseClient.auth.signOut();
    return false;
  }

  alert("🎉 Sesión iniciada.");
  window.location.href = 'login-planty.html'; // o 'planty.html'
  return true;
}

async function obtenerUserId() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

async function protegerPagina() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    window.location.href = 'index.html';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// ==============================
// 🌱 MATRIZ DE PLANTINES
// ==============================
const ocupados = new Map();
const seleccionados = new Set();
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
  if (tooltip) {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  }
});

async function cargarCultivos() {
  const userId = await obtenerUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from('plantines')
    .select('*')
    .eq('user_id', userId);

  if (error) return;

  ocupados.clear();
  data.forEach(({ fila, columna, cultivo }) => {
    ocupados.set(`${fila}-${columna}`, cultivo);
  });

  renderMatriz();
}

function renderMatriz() {
  const contenedor = document.getElementById('matriz');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 9; columna++) {
      const key = `${fila}-${columna}`;
      const boton = document.createElement('button');
      boton.dataset.pos = key;

      if (ocupados.has(key)) {
        boton.textContent = '❌';
        boton.style.backgroundColor = '#4caf50';
        boton.style.color = 'white';
        boton.disabled = true;

        boton.addEventListener('mouseenter', () => {
          tooltip.textContent = `🌱 Cultivo: ${ocupados.get(key)}\n📍 Posición: ${fila}, ${columna}`;
          tooltip.style.display = 'block';
        });
        boton.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      } else if (seleccionados.has(key)) {
        boton.textContent = '✅';
        boton.style.backgroundColor = '#2196f3';
        boton.style.color = 'white';
      } else {
        boton.textContent = `${fila},${columna}`;
        boton.style.backgroundColor = '#e0f7fa';
        boton.style.color = 'black';
      }

      boton.addEventListener('click', () => {
        if (ocupados.has(key)) return;
        if (seleccionados.has(key)) {
          seleccionados.delete(key);
        } else {
          seleccionados.add(key);
        }
        renderMatriz();
      });

      contenedor.appendChild(boton);
    }
  }
}

async function enviarDatos() {
  const cultivo = document.getElementById('cultivo').value;
  const userId = await obtenerUserId();
  if (!userId) return;

  const datos = Array.from(seleccionados).map((pos) => {
    const [fila, columna] = pos.split('-');
    return {
      fila: parseInt(fila),
      columna: parseInt(columna),
      cultivo,
      user_id: userId,
    };
  });

  if (datos.length === 0) {
    alert('¡No seleccionaste ninguna celda!');
    return;
  }

  const { error } = await supabaseClient.from('plantines').insert(datos);
  if (error) {
    alert('Error al enviar: ' + error.message);
  } else {
    alert('Datos enviados correctamente 🌱');
    datos.forEach((d) => ocupados.set(`${d.fila}-${d.columna}`, d.cultivo));
    seleccionados.clear();
    renderMatriz();
  }
}

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
window.addEventListener('DOMContentLoaded', async () => {
  const signupForm = document.querySelector('#form-signup');
  const loginForm = document.querySelector('#form-login');
  const enviarBtn = document.getElementById('enviar');
  const logoutBtn = document.getElementById('logout');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;
      const ok = await crearCuenta(email, password,);
      if (ok) {
        alert("Iniciá sesión desde el login una vez que confirmes el email.");
        window.location.href = "index.html";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
      await login(email, password);
    });
  }

  if (enviarBtn) {
    await protegerPagina();
    await cargarCultivos();
    enviarBtn.addEventListener('click', enviarDatos);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
