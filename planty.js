
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ocupados = new Map();
const seleccionados = new Set();
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
  tooltip.style.left = `${e.pageX + 10}px`;
  tooltip.style.top = `${e.pageY + 10}px`;
});

async function cargarCultivos() {
  try {
    const { data, error } = await supabaseClient.from('plantines').select('*');
    if (error) throw error;
    console.log("📦 Datos cargados desde Supabase:", data);
    console.log("🐛 Error (si hubo):", error);


    ocupados.clear();
    data.forEach(item => {
      const key = `${item.fila}-${item.columna}`;
      ocupados.set(key, item.cultivo);
    });

    renderMatriz(); // ⚠️ Solo se llama cuando ocupados está actualizado
  } catch (err) {
    console.error('Error al cargar:', err);
  }
}

function renderMatriz() {
  const contenedor = document.getElementById('matriz');
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
