const SUPABASE_URL = "https://drfjnznvfrofednoexgq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs"; 

async function carregarDadosRecepcao() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/paciente?status=is.null&select=*`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const pacientes = await response.json();
        const listaElemento = document.getElementById("lista-pacientes");
        listaElemento.innerHTML = ""; 

        // Regra de Ordenação: 1º Vermelho, 2º Senhas com P (Preferencial), 3º Ordem de chegada (ID)
        pacientes.sort((a, b) => {
            const gravidadeA = (a.gravidade || "").toLowerCase();
            const gravidadeB = (b.gravidade || "").toLowerCase();
            
            const senhaA = (a.senha || "").toUpperCase();
            const senhaB = (b.senha || "").toUpperCase();

            const isVermelhoA = gravidadeA.includes("vermelho");
            const isVermelhoB = gravidadeB.includes("vermelho");

            const isPrefA = senhaA.startsWith("P");
            const isPrefB = senhaB.startsWith("P");

            // 1. Prioridade absoluta para Vermelho
            if (isVermelhoA && !isVermelhoB) return -1;
            if (!isVermelhoA && isVermelhoB) return 1;

            // 2. Segunda prioridade para Preferenciais (P) que não sejam vermelhos
            if (isPrefA && !isPrefB) return -1;
            if (!isPrefA && isPrefB) return 1;

            // 3. Demais casos: ordem de chegada (ID menor primeiro)
            return a.id - b.id;
        });

        pacientes.forEach(paciente => {
            const gravidadeTexto = paciente.gravidade || "Verde";
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
    if (!gravidade) return "bg-verde";
    const g = gravidade.toLowerCase().trim();
    
    if (g.includes("vermelho")) return "bg-vermelho";
    if (g.includes("laranja")) return "bg-laranja";
    if (g.includes("amarelo")) return "bg-amarelo";
    if (g.includes("azul")) return "bg-azul";
    return "bg-verde"; 
}

setInterval(carregarDadosRecepcao, 5000);
carregarDadosRecepcao();