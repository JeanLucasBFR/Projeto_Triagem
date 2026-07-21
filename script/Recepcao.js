const SUPABASE_URL = "https://drfjnznvfrofednoexgq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs"; 

async function carregarDadosRecepcao() {
    try {
        // Busca apenas pacientes onde o status é vazio (is.null)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/paciente?status=is.null&select=*&order=id.asc`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const pacientes = await response.json();
        const listaElemento = document.getElementById("lista-pacientes");
        listaElemento.innerHTML = ""; 

        pacientes.forEach(paciente => {
            const gravidadeTexto = paciente.gravidade || "Comum";
            const gravidadeClass = mapearClasseGravidade(gravidadeTexto);
            
            const htmlRow = `
                <div class="grid-row">
                    <div style="font-weight: bold;">${paciente.senha || "-"}</div>
                    <div>${paciente.nome}</div>
                    <div><span class="badge ${gravidadeClass}">${gravidadeTexto}</span></div>
                    <div style="text-align: center;">
                        <button class="btn-chamar" onclick="chamarPaciente(${paciente.id}, '${paciente.nome}')">
                            Chamar
                        </button>
                    </div>
                </div>
            `;
            listaElemento.innerHTML += htmlRow;
        });
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Quando a recepcionista clica no botão:
// Quando a recepcionista clica no botão:
async function chamarPaciente(pacienteId, pacienteNome) {
    if (!confirm(`Chamar o paciente: ${pacienteNome}?`)) return;

    try {
        // PASSO 1: Tira o paciente anterior do telão (Muda de 'chamado' para 'atendido')
        await fetch(`${SUPABASE_URL}/rest/v1/paciente?status=eq.chamado`, {
            method: 'PATCH',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                status: "atendido"
            })
        });

        // PASSO 2: Chama o paciente atual (Muda de nulo para 'chamado')
        const response = await fetch(`${SUPABASE_URL}/rest/v1/paciente?id=eq.${pacienteId}`, {
            method: 'PATCH',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                status: "chamado"
            })
        });

        if (response.ok) {
            carregarDadosRecepcao(); // Atualiza a tela da recepção
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

function mapearClasseGravidade(gravidade) {
    const g = gravidade.toLowerCase();
    if (g.includes("urgente")) return "bg-urgente";
    if (g.includes("preferencial")) return "bg-atencao";
    return "bg-comum";
}

setInterval(carregarDadosRecepcao, 5000);
carregarDadosRecepcao();