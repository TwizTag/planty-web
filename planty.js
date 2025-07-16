// Configuración Supabase
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ocupados = new Map();
const seleccionados = new Set();
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
  if (tooltip) {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  }
});

async function obtenerUserId() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    console.error('No se pudo obtener usuario:', error);
    return null;
  }
  return user.id;
}

async function cargarCultivos() {
  const userId = await obtenerUserId();
  if (!userId) {
    alert('No estás autenticado. Por favor inicia sesión.');
    return;
  }

  const { data, error } = await supabaseClient
    .from('plantines')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error al cargar:', error);
    return;
  }

  ocupados.clear();
  data.forEach((item) => {
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
          if (tooltip) {
            tooltip.textContent = `🌱 Cultivo: ${cultivo}\n📍 Posición: ${fila}, ${columna}`;
            tooltip.style.display = 'block';
          }
        });
        boton.addEventListener('mouseleave', () => {
          if (tooltip) tooltip.style.display = 'none';
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

  if (!userId) {
    alert('Usuario no autenticado');
    return;
  }

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
    datos.forEach((d) => {
      const key = `${d.fila}-${d.columna}`;
      ocupados.set(key, d.cultivo);
    });
    seleccionados.clear();
    renderMatriz();
  }
}

// Función para crear cuenta y guardar username en tabla 'profiles'
async function crearCuenta(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    alert('Error en registro: ' + error.message);
    return false;
  }

  const userId = data.user?.id;

  if (!userId) {
    alert('Error: no se pudo obtener user id');
    return false;
  }

  const { error: profileError } = await supabaseClient
    .from('profiles')
    .insert([{ id: userId, username: username }]);

  if (profileError) {
    alert('Error al guardar perfil: ' + profileError.message);
    return false;
  }

  alert('Cuenta creada. Revisa tu email para confirmar.');
  return true;
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Error en login: ' + error.message);
    return false;
  }
  return true;
}

window.addEventListener('DOMContentLoaded', () => {
  // Para planty.html
  if (document.getElementById('enviar')) {
    cargarCultivos();
    document.getElementById('enviar').addEventListener('click', enviarDatos);
  }

  // Para index.html (login y registro)
  const formSignup = document.getElementById('form-signup');
  const formLogin = document.getElementById('form-login');

  if (formSignup && formLogin) {
    formSignup.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formSignup.email.value;
      const password = formSignup.password.value;
      const username = formSignup.username.value;
      const ok = await crearCuenta(email, password, username);
      if (ok) {
        const loginOk = await login(email, password);
        if (loginOk) {
          window.location.href = 'planty.html';
        }
      }
    });

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formLogin.email.value;
      const password = formLogin.password.value;
      const ok = await login(email, password);
      if (ok) {
        window.location.href = 'planty.html';
      }
    });
  }
});

