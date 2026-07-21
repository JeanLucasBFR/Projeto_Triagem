const SUPABASE_URL = "https://drfjnznvfrofednoexgq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs"; 

async function carregarDadosMonitor() {
    try {
        // 1. BUSCA O PACIENTE EM DESTAQUE (O último que recebeu o status "chamado")
        const respChamado = await fetch(`${SUPABASE_URL}/rest/v1/paciente?status=eq.chamado&select=*&order=id.desc&limit=1`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        const pacientesChamados = await respChamado.json();

        if (pacientesChamados.length > 0) {
            const destaque = pacientesChamados[0];
            document.getElementById("destaque-senha").innerText = destaque.senha || "---";
            document.getElementById("destaque-nome").innerText = destaque.nome;
            document.getElementById("destaque-guiche").innerText = "Recepção"; // Guichê fixo na tela
        }

        // 2. BUSCA A LISTA DE ESPERA (Pacientes com status vazio/null)
        const respFila = await fetch(`${SUPABASE_URL}/rest/v1/paciente?status=is.null&select=*&order=id.asc&limit=6`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        const pacientesFila = await respFila.json();

        const listaElemento = document.getElementById("lista-pacientes");
        listaElemento.innerHTML = "";

        pacientesFila.forEach(paciente => {
            const gravidadeTexto = paciente.gravidade || "Comum";
            const gravidadeClass = mapearClasseGravidade(gravidadeTexto);
            
            const htmlRow = `
                <div class="grid-row">
                    <div style="font-weight: bold;">${paciente.senha || "-"}</div>
                    <div>${paciente.nome}</div>
                    <div><span class="badge ${gravidadeClass}">${gravidadeTexto}</span></div>
                </div>
            `;
            listaElemento.innerHTML += htmlRow;
        });

    } catch (error) {
        console.error("Erro ao carregar o monitor:", error);
    }
}

function mapearClasseGravidade(gravidade) {
    const g = gravidade.toLowerCase();
    if (g.includes("urgente")) return "bg-urgente";
    if (g.includes("preferencial")) return "bg-atencao";
    return "bg-comum";
}

// Monitor atualiza a cada 3 segundos
setInterval(carregarDadosMonitor, 3000);
carregarDadosMonitor();