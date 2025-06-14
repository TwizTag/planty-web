const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Celdas ya ocupadas
const seleccionados = new Map(); // { "fila-columna": "cultivo" }

async function cargarCultivos() {
  const { data, error } = await supabaseClient.from('plantines').select('*');
  if (error) {
    console.error('Error al cargar desde Supabase:', error);
    return;
  }

  data.forEach(item => {
    const key = `${item.fila}-${item.columna}`;
    seleccionados.set(key, item.cultivo);
  });

  renderMatriz();
}

async function guardarCultivo(fila, columna, cultivo) {
  const { data, error } = await supabaseClient
    .from('plantines')
    .insert([{ fila, columna, cultivo }]);

  if (error) {
    console.error('Error al guardar en Supabase:', error);
  } else {
    console.log('Cultivo guardado:', data);
  }
}

function renderMatriz() {
  const contenedor = document.getElementById('matriz');
  contenedor.innerHTML = '';

  for (let fila = 0; fila < 10; fila++) {
    const filaDiv = document.createElement('div');
    filaDiv.style.display = 'flex';

    for (let columna = 0; columna < 10; columna++) {
      const boton = document.createElement('button');
      const key = `${fila}-${columna}`;
      boton.textContent = seleccionados.has(key) ? seleccionados.get(key) : `${fila},${columna}`;
      boton.dataset.pos = key;
      boton.style.margin = '2px';
      boton.style.width = '60px';
      boton.style.height = '60px';

      if (seleccionados.has(key)) {
        boton.style.backgroundColor = '#4caf50'; // verde oscuro
        boton.style.color = 'white';
        boton.disabled = true; // desactivado si ya está ocupado
      } else {
        boton.style.backgroundColor = '#c3f0ca'; // verde claro
        boton.style.color = 'black';
      }

      boton.addEventListener('click', () => {
        const cultivoSeleccionado = document.getElementById('cultivo').value;
        seleccionados.set(key, cultivoSeleccionado);
        guardarCultivo(fila, columna, cultivoSeleccionado);
        renderMatriz(); // recarga la matriz
      });

      filaDiv.appendChild(boton);
    }

    contenedor.appendChild(filaDiv);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  cargarCultivos();
});
