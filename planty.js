const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formSignup = document.getElementById('form-signup');
const formLogin = document.getElementById('form-login');
const chk = document.getElementById('chk');

async function existeUsuario() {
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  if (error) {
    console.error('Error chequeando usuario:', error);
    return false;
  }
  return data.length > 0;
}

async function crearUsuario(usuario, email, password) {
  const { data, error } = await supabase.from('usuarios').insert([{ usuario, email, password }]);
  if (error) throw error;
  return data;
}

async function login(email, password) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).limit(1);
  if (error) throw error;
  if (data.length === 0) throw new Error('Usuario no encontrado');
  const user = data[0];
  if (user.password !== password) throw new Error('Contraseña incorrecta');
  return user;
}

window.addEventListener('DOMContentLoaded', async () => {
  const usuarioExiste = await existeUsuario();
  if (usuarioExiste) {
    chk.checked = true; // Mostrar login
  } else {
    chk.checked = false; // Mostrar signup
  }
});

formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = formSignup.username.value.trim();
  const email = formSignup.email.value.trim();
  const password = formSignup.password.value.trim();

  try {
    if (await existeUsuario()) {
      alert('Ya existe un usuario registrado. Solo podés iniciar sesión.');
      chk.checked = true;
      return;
    }
    await crearUsuario(usuario, email, password);
    alert('Usuario creado exitosamente. Ahora podés iniciar sesión.');
    chk.checked = true;
  } catch (error) {
    alert('Error al crear usuario: ' + error.message);
  }
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = formLogin.email.value.trim();
  const password = formLogin.password.value.trim();

  try {
    const user = await login(email, password);
    alert('Bienvenido ' + user.usuario + '!');
    window.location.href = 'planty.html'; // Redirige a tu app
  } catch (error) {
    alert('Error en login: ' + error.message);
  }
});

