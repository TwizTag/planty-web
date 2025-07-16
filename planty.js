// 🔑 Supabase
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // TU KEY
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🌱 DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  // Detectá si estás en la pantalla de login o en la de Planty
  if (window.location.pathname.includes('planty.html')) {
    verificarSesion(); // si no está logueado, redirige
    document.getElementById('enviar')?.addEventListener('click', enviarDatos);
    cargarCultivos();
  } else {
    // Login/Register
    document.querySelector('.login button')?.addEventListener('click', login);
    document.querySelector('.signup button')?.addEventListener('click', registrarYLogin);
  }
});

async function registrarYLogin(e) {
  e.preventDefault();
  const email = document.querySelector('.signup input[name="email"]').value;
  const password = document.querySelector('.signup input[name="pswd"]').value;

  const { error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    alert('Error al registrarse: ' + signUpError.message);
    return;
  }

  // Loguear automáticamente
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) {
    alert('Registrado, pero error al iniciar sesión: ' + loginError.message);
    return;
  }

  localStorage.setItem('planty_logged_in', 'true');
  window.location.href = 'planty.html';
}

async function login(e) {
  e.preventDefault();
  const email = document.querySelector('.login input[name="email"]').value;
  const password = document.querySelector('.login input[name="pswd"]').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
    return;
  }

  localStorage.setItem('planty_logged_in', 'true');
  window.location.href = 'planty.html';
}

function verificarSesion() {
  const loggedIn = localStorage.getItem('planty_logged_in');
  if (!loggedIn) {
    window.location.href = 'index.html'; // redirige al login
  }
}

function logout() {
  localStorage.removeItem('planty_logged_in');
  window.location.href = 'index.html';
}

// ================== MATRIZ ======================
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
  const { data, error } = await supabase.from('plantines').select('*');
  if (error) {
    console.error('Error al cargar:', error);
    return;
  }

  ocupados.clear();
  data.forEach(item => {
    const key = `${item.fila}-${item.columna}`;
    ocupados.set(key, item.cultivo);
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

        const cultivo = ocupados.get(key);
        boton.addEventListener('mouseenter', () => {
          tooltip.textContent = `🌱 Cultivo: ${cultivo}\n📍 Posición: ${fila}, ${columna}`;
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
  const datos = Array.from(seleccionados).map(pos => {
    const [fila, columna] = pos.split('-');
    return {
      fila: parseInt(fila),
      columna: parseInt(columna),
      cultivo
    };
  });

  if (datos.length === 0) {
    alert('¡No seleccionaste ninguna celda!');
    return;
  }

  const { error } = await supabase.from('plantines').insert(datos);

  if (error) {
    alert('Error al enviar: ' + error.message);
  } else {
    alert('Datos enviados correctamente 🌱');
    datos.forEach(d => {
      const key = `${d.fila}-${d.columna}`;
      ocupados.set(key, d.cultivo);
    });
    seleccionados.clear();
    renderMatriz();
  }
}

