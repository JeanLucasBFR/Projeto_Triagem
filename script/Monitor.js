// Substitua pelas credenciais do seu NOVO projeto do Supabase
const SUPABASE_URL = "https://drfjnznvfrofednoexgq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs"; 

async function carregarDados() {
    try {
        // Busca os últimos 10 pacientes na tabela "Paciente" ordenados pelo ID mais novo
        const response = await fetch(`${SUPABASE_URL}/rest/v1/Paciente?select=*&order=id.desc&limit=10`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const pacientes = await response.json();

        if (pacientes.length > 0) {
            // 1. ATUALIZA O DESTAQUE (O primeiro da lista)
            const ultimo = pacientes[0];
            
            // Tratamento caso a senha não venha (exibe 'Aguardando' se for undefined)
            document.getElementById("destaque-senha").innerText = ultimo.senha || "Aguardando";
            document.getElementById("destaque-nome").innerText = ultimo.nome;
            
            // Sorteia um guichê para o destaque se não tiver no banco
            document.getElementById("destaque-guiche").innerText = `Guichê ${Math.floor(Math.random() * 5) + 1}`; // Ajustado para não ser sempre 0

            // 2. ATUALIZA A LISTA DOS PRÓXIMOS (Do segundo em diante)
            const listaElemento = document.getElementById("lista-pacientes");
            listaElemento.innerHTML = ""; // Limpa a lista atual

            pacientes.slice(1).forEach(paciente => {
                // Garante que se a gravidade vier vazia, não quebre o script
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
        }
    } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
    }
}

// Função auxiliar para bater com as cores do seu CSS
function mapearClasseGravidade(gravidade) {
    const g = gravidade.toLowerCase();
    if (g.includes("urgente")) return "bg-urgente";
    if (g.includes("preferencial")) return "bg-atencao";
    return "bg-comum";
}

// Atualiza o monitor a cada 5 segundos
setInterval(carregarDados, 5000);
carregarDados(); // Carrega assim que abrir a página