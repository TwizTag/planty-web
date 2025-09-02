// ==============================
// 🔧 CONFIGURACIÓN SUPABASE
// ==============================
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const modoDemo = urlParams.get('demo') === 'true';

// ==============================
// 👤 AUTENTICACIÓN
// ==============================

async function crearCuenta(email, password) {
  // 1️⃣ Verificar si ya existe un usuario en la tabla usuario_permitido
  const { data: usuarios, error: errorConsulta } = await supabaseClient
    .from('usuario_permitido')
    .select('*');

  if (errorConsulta) {
    alert("❌ Error al verificar usuario permitido: " + errorConsulta.message);
    return false;
  }

  if (usuarios.length > 0) {
    alert("🚫 Ya existe un usuario registrado. No se permiten más cuentas.");
    return false;
  }

  // 2️⃣ Registrar usuario en Auth
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

  // 3️⃣ Insertar en usuario_permitido para marcarlo como único autorizado
  const user = data.user;
  const { error: errorInsert } = await supabaseClient
    .from('usuario_permitido')
    .insert([{ id: user.id, email: user.email }]);

  if (errorInsert) {
    alert("❌ Error al guardar usuario permitido: " + errorInsert.message);
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
    alert("⚠️ Aún no confirmaste tu email. Revisa la bandeja de entrada.");
    await supabaseClient.auth.signOut();
    return false;
  }

  alert("🎉 Sesión iniciada.");
  return true;
}

async function obtenerUserId() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

async function protegerPagina() {
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') return; // Si está demo=true, no hace nada, deja pasar
  
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    window.location.href = 'index.html'; // Redirige a login si no está autenticado
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
let cultivoSeleccionado = null; // Variable global para el cultivo activo

document.addEventListener('mousemove', (e) => {
  if (tooltip) {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  }
});

async function cargarCultivos() {

  if (modoDemo) {
    // En demo cargamos todos los plantines sin filtro
    const { data, error } = await supabaseClient
      .from('plantines')
      .select('*');

    if (error) {
      console.error("Error al cargar cultivos:", error.message);
      return;
    }

    ocupados.clear();
    data.forEach(({ fila, columna, cultivo }) => {
      ocupados.set(`${fila - 1}-${columna - 1}`, cultivo);
    });

    renderMatriz();
    return;
  }
  
  const userId = await obtenerUserId();
  if (!userId) return;

  const { data, error } = await supabaseClient
    .from('plantines')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error("Error al cargar cultivos:", error.message);
    return;
  }

  ocupados.clear();
  data.forEach(({ fila, columna, cultivo }) => {
    ocupados.set(`${fila}-${columna}`, cultivo);
  });

  renderMatriz();
}


function renderMatriz() {
  console.log("Renderizando matriz");
  const contenedor = document.getElementById('matriz');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  for (let columna = 0; columna < 9; columna++) {
    for (let fila = 0; fila < 8; fila++) {
      const key = `${fila}-${columna}`; // 🔹 key definida aquí
      const boton = document.createElement("button");
      boton.dataset.fila = fila;
      boton.dataset.columna = columna;

      if (ocupados.has(key)) {
        boton.textContent = '❌';
        boton.style.backgroundColor = '#4caf50';
        boton.style.color = 'white';
        boton.disabled = true;

        boton.addEventListener('mouseenter', () => {
          tooltip.textContent = `🌱 Cultivo: ${ocupados.get(key)}\n📍 Posición: ${fila + 1}, ${columna + 1}`;
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
        boton.textContent = `${fila + 1},${columna + 1}`;
        boton.style.backgroundColor = '#e0f7fa';
        boton.style.color = 'black';
      }

      boton.addEventListener('click', () => {
        if (ocupados.has(key)) return;
        if (!cultivoSeleccionado) {
          alert('Por favor seleccioná un cultivo antes de elegir celdas.');
          return;
        }
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
  if (!cultivoSeleccionado) {
    alert('Seleccioná un cultivo antes de enviar datos.');
    return;
  }

  const userId = await obtenerUserId();
  if (!userId) {
    alert("Usuario no autenticado");
    return;
  }

  const datos = Array.from(seleccionados).map(pos => {
  const [fila, columna] = pos.split('-');
    return {
      fila: parseInt(fila),
      columna: parseInt(columna),
      cultivo: cultivoSeleccionado,
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
    datos.forEach(d => ocupados.set(`${d.fila}-${d.columna}`, d.cultivo));
    seleccionados.clear();
    renderMatriz();
  }
}

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
window.addEventListener('DOMContentLoaded', async () => {
  const signupForm = document.querySelector('#register-form');
  const loginForm = document.querySelector('#login-form');
  const enviarBtn = document.getElementById('enviar');
  const logoutBtn = document.getElementById('logout');

  const userBtn = document.getElementById('user-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', () => {
      userDropdown.classList.toggle('hidden');
      userBtn.classList.toggle('active'); // Para girar flecha
    });

    // Opcional: para cerrar el dropdown si hacés click fuera
    document.addEventListener('click', (e) => {
      if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
        userBtn.classList.remove('active');
      }
    });
  }

  // Selección de cultivo al hacer click en el nombre
  document.querySelectorAll('.cultivo-nombre').forEach(el => {
    el.addEventListener('click', () => {
      // Deseleccionar todos
      document.querySelectorAll('.cultivo-nombre').forEach(n => n.classList.remove('selected'));

      // Seleccionar el clickeado
      el.classList.add('selected');

      cultivoSeleccionado = el.parentElement.getAttribute('data-cultivo');
      console.log('Cultivo seleccionado:', cultivoSeleccionado);
    });
  });

  // Mostrar/ocultar info de cultivo al clickear la flecha
  document.querySelectorAll('.toggle-info').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita que dispare la selección del cultivo
      const infoDiv = btn.parentElement.nextElementSibling;
      if (infoDiv.style.display === 'block') {
        infoDiv.style.display = 'none';
        btn.textContent = '➡️';
      } else {
        infoDiv.style.display = 'block';
        btn.textContent = '⬇️';
      }
    });
  });

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signupForm.email.value;
      const password = signupForm.password.value;
      const ok = await crearCuenta(email, password);
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
      const ok = await login(email, password);
      if (ok) {
        window.location.href = 'login-planty.html'; // o 'planty.html'
      }
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

