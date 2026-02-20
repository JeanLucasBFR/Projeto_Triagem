// Configuração do Supabase (Mesmas chaves que você usou no n8n)
const SUPABASE_URL = "https://swpaftahzzcoqusppcvz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGFmdGFoenpjb3F1c3BwY3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDQxODMsImV4cCI6MjA4NzE4MDE4M30.YkjkCg5ppycNay0EmZEEZJU9JmTRSkpsFBbyH6HL5Ck"; // Aqui você usa a 'anon public' do Supabase

async function carregarDados() {
    try {
        // Busca os últimos 10 pacientes ordenados pelo ID mais novo
        const response = await fetch(`${SUPABASE_URL}/rest/v1/triagens?select=*&order=id.desc&limit=10`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const pacientes = await response.json();

        if (pacientes.length > 0) {
            // 1. ATUALIZA O DESTAQUE (O primeiro da lista)
            const ultimo = pacientes[0];
            document.getElementById("destaque-senha").innerText = ultimo.senha;
            document.getElementById("destaque-nome").innerText = ultimo.nome;
            
            // Sorteia um guichê para o destaque se não tiver no banco
            document.getElementById("destaque-guiche").innerText = `Guichê ${0}`;

            // 2. ATUALIZA A LISTA DOS PRÓXIMOS (Do segundo em diante)
            const listaElemento = document.getElementById("lista-pacientes");
            listaElemento.innerHTML = ""; // Limpa a lista atual

            pacientes.slice(1).forEach(paciente => {
                const gravidadeClass = mapearClasseGravidade(paciente.gravidade);
                
                const htmlRow = `
                    <div class="grid-row">
                        <div style="font-weight: bold;">${paciente.senha}</div>
                        <div>${paciente.nome}</div>
                        <div><span class="badge ${gravidadeClass}">${paciente.gravidade}</span></div>
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