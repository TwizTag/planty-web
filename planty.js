
const SUPABASE_URL = 'https://zlfcigqpkrpikvurhibm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const seleccionados = new Set();

function renderMatriz() {
  const contenedor = document.getElementById('matriz');
  contenedor.innerHTML = '';

  for (let fila = 0; fila < 10; fila++) {
    for (let columna = 0; columna < 10; columna++) {
      const boton = document.createElement('button');
      boton.textContent = `${fila},${columna}`;
      boton.dataset.pos = `${fila}-${columna}`;

      if (seleccionados.has(boton.dataset.pos)) {
        boton.style.backgroundColor = '#4caf50';
        boton.style.color = 'white';
      } else {
        boton.style.backgroundColor = '#c3f0ca';
        boton.style.color = 'black';
      }

      boton.addEventListener('click', () => {
        const pos = boton.dataset.pos;
        if (seleccionados.has(pos)) {
          seleccionados.delete(pos);
        } else {
          seleccionados.add(pos);
        }
        renderMatriz();
        console.log('Seleccionados:', Array.from(seleccionados));
      });

      contenedor.appendChild(boton);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderMatriz();
});

