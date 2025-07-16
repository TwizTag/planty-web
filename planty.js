// Inicialización de Supabase
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado local
const ocupados = new Map(); // "fila-columna" => cultivo
const seleccionados = new Set(); // celdas seleccionadas

// Tooltip personalizado
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
  tooltip.style.left = `${e.pageX + 10}px`;
  tooltip.style.top = `${e.pageY + 10}px`;
});

// Cargar cultivos guardados desde Supabase
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

// Dibujar matriz de 8 filas x 9 columnas
function renderMatriz() {
  const contenedor = document.getElementById('matriz');
  contenedor.innerHTML = '';

  for (let fila = 0; fila < 8; fila++) {
    for (let columna = 0; columna < 9; columna++) {
      const key = `${fila}-${columna}`;
      const boton = document.createElement('button');
      boton.dataset.pos = key;

      if (ocupados.has(key)) {
        // ❌ Ocupado
        boton.textContent = '❌';
        boton.style.backgroundColor = '#4caf50';
        boton.style.color = 'white';
        boton.disabled = true;

        const cultivo = ocupados.get(key);
        boton.addEventListener('mouseenter', () => {
          tooltip.textContent = `🌱 Cultivo: ${cultivo}\n 📍 Posición: ${fila}, ${columna}`;
          tooltip.style.display = 'block';
        });
        boton.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });

      } else if (seleccionados.has(key)) {
        // ✅ Seleccionado para plantar
        boton.textContent = '✅';
        boton.style.backgroundColor = '#2196f3';
        boton.style.color = 'white';
      } else {
        // 🟦 Libre
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

// Enviar cultivos seleccionados a Supabase
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

// Iniciar todo cuando la página carga
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('enviar').addEventListener('click', enviarDatos);
  cargarCultivos();
});

