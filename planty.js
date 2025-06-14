// ✅ Este script se carga después de que supabase ya existe
const supabaseUrl = "https://zlfcigqpkrpikvurhibm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmNpZ3Fwa3JwaWt2dXJoaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTU2NTAsImV4cCI6MjA2NTQzMTY1MH0.PBHPTUAXix4g3LniLnPqbjnC5hkVTkPbUTGYOOrq14A";
const client = supabase.createClient(supabaseUrl, supabaseKey);

const matriz = document.getElementById("matriz");

const renderMatriz = async () => {
  const { data: ocupadas, error } = await client.from("plantines").select("*");
  if (error) {
    console.error("Error al traer datos:", error);
    return;
  }

  for (let fila = 0; fila < 10; fila++) {
    for (let columna = 0; columna < 10; columna++) {
      const celda = document.createElement("div");
      celda.className = "celda";

      const ocupada = ocupadas.find(p => p.fila === fila && p.columna === columna);
      if (ocupada) {
        celda.classList.add("ocupado");
        celda.textContent = "🌱";
        celda.title = ocupada.cultivo;
      } else {
        celda.addEventListener("click", async () => {
          const cultivo = prompt(`¿Qué vas a plantar en [${fila}, ${columna}]?`);
          if (!cultivo) return;

          const { error: insertError } = await client.from("plantines").insert([
            { fila, columna, cultivo }
          ]);
          if (insertError) {
            console.error("Error al insertar:", insertError);
          } else {
            location.reload();
          }
        });
      }

      matriz.appendChild(celda);
    }
  }
};

renderMatriz();
