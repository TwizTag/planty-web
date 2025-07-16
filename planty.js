const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A'; // tu key real

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Celdas ya guardadas en Supabase
const ocupados = new Map(); // { "fila-columna": "cultivo" }

// Celdas seleccionadas para enviar
const seleccionados = new Set(); // "fila-columna"

async function cargarCultivos() {
  const { data, error } = await supabaseClient.from('plantines').select('*');
  if (error) {
    console.error('Error al cargar:', error);
    return;
  }

  data.forEach(item => {
    const key = `${item.fila}-${item.columna}`;
    ocupados.set(key, item.cultivo);
  });

  renderMatriz();
}

function renderMatriz() {
  const contenedor = document.getElementById('matriz');
  contenedor.innerHTML = '';

  for (let fila = 0; fila < 9; fila++) {
    const filaDiv = document.createElement('div');
    filaDiv.style.display = 'flex';

    for (let columna = 0; columna < 8; columna++) {
      const key = `${fila}-${columna}`;
      const boton = document.createElement('button');
      boton.textContent = ocupados.has(key) ? ocupados.get(key) : `${fila},${columna}`;
      boton.dataset.pos = key;
      boton.style.margin = '2px';
      boton.style.width = '60px';
      boton.style.height = '60px';

      if (ocupados.has(key)) {
        boton.style.backgroundColor = '#4caf50';
        boton.style.color = 'white';
        boton.disabled = true;
      } else if (seleccionados.has(key)) {
        boton.style.backgroundColor = '#2196f3';
        boton.style.color = 'white';
      } else {
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

      filaDiv.appendChild(boton);
    }

    contenedor.appendChild(filaDiv);
  }
}

async function enviarDatos() {
  const cultivo = document.getElementById('cultivo').value;

  const datos = Array.from(seleccionados).map(pos => {
    const [fila, columna] = pos.split('-');
    return { fila: parseInt(fila), columna: parseInt(columna), cultivo };
  });

  if (datos.length === 0) {
    alert('No seleccionaste ninguna celda!');
    return;
  }

  const { error } = await supabaseClient.from('plantines').insert(datos);

  if (error) {
    console.error('Error al enviar a Supabase:', error);
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

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('enviar').addEventListener('click', enviarDatos);
  cargarCultivos();
});
