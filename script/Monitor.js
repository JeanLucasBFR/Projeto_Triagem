const SUPABASE_URL = "https://drfjnznvfrofednoexgq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs"; 

// Caminho atualizado apontando para a pasta 'sounds'
const audio = new Audio('../sounds/chamada_monitor_hospitalar.wav');
let ultimaSenhaChamada = ""; 

async function carregarDadosMonitor() {
    try {
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
            document.getElementById("destaque-guiche").innerText = "Recepção";

            // Compara se a SENHA atual é diferente da última senha que tocou
            if (ultimaSenhaChamada !== destaque.senha) {
                audio.play().catch(err => console.log("Clique na tela para liberar o áudio!"));
                ultimaSenhaChamada = destaque.senha; // Atualiza a memória com a nova senha
            }
        }

        // 2. BUSCA A LISTA DE ESPERA
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
            const gravidadeTexto = paciente.gravidade || "Verde";
            const gravidadeClass = mapearClasseGravidade(gravidadeTexto);
            
            listaElemento.innerHTML += `
                <div class="grid-row">
                    <div style="font-weight: bold;">${paciente.senha || "-"}</div>
                    <div>${paciente.nome}</div>
                    <div><span class="badge ${gravidadeClass}">${gravidadeTexto}</span></div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Erro ao carregar o monitor:", error);
    }
}

function mapearClasseGravidade(gravidade) {
    if (!gravidade) return "bg-verde";
    const g = gravidade.toLowerCase().trim();
    
    if (g.includes("vermelho")) return "bg-vermelho";
    if (g.includes("laranja")) return "bg-laranja";
    if (g.includes("amarelo")) return "bg-amarelo";
    if (g.includes("azul")) return "bg-azul";
    if (g.includes("verde")) return "bg-verde";
    
    return "bg-verde";
}

setInterval(carregarDadosMonitor, 3000);
carregarDadosMonitor();