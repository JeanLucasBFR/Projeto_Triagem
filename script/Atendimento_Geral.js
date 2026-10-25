document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formulario");
    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");
    const btnFinalizar = document.querySelector(".btn.finalizar");

    function formatarNome(texto) {
        return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
            return letra.toUpperCase();
        });
    }

    function formatarSintomas(texto) {
        if (!texto) return "";

        let min = texto.toLowerCase();

        return min.replace(/(^\s*|[.!?,]\s*|\n\s*)([a-zà-öø-ÿ])/g, function (match, separador, letra) {
            return separador + letra.toUpperCase();
        });
    }

    nomeInput.addEventListener("input", function () {
        this.value = formatarNome(this.value);
    });

    sintomasInput.addEventListener("input", function () {
        this.value = formatarSintomas(this.value);
    });

    // === CONFIGURAÇÕES DO SUPABASE ===
    // Cole sua chave Anon/Public aqui
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs";

    // URL da Função que você acabou de dar o deploy
    const functionUrl = "https://drfjnznvfrofednoexgq.supabase.co/functions/v1/triagem_manchester";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        let valido = true;

        document.querySelectorAll(".erro").forEach(el => el.remove());

        function criarErro(input, mensagem) {
            const small = document.createElement("small");
            small.classList.add("erro");
            small.style.color = "red";
            small.textContent = mensagem;
            input.parentElement.appendChild(small);
        }

        function validarNome(nome) {
            nome = nome.trim();
            const partes = nome.split(" ");
            const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
            return partes.length >= 2 && regex.test(nome);
        }

        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }

        if (!dataInput.value) {
            criarErro(dataInput, "Informe a data de nascimento.");
            valido = false;
        }

        if (sintomasInput.value.trim() === "") {
            criarErro(sintomasInput, "Descreva os sintomas.");
            valido = false;
        }

        if (valido) {
            const urlParams = new URLSearchParams(window.location.search);
            const tipoFila = urlParams.get('tipo') || 'G';
            const inicioTriagem = Number(sessionStorage.getItem("inicioTriagem"));

            let tempoTriagemSegundos = null;

            if (inicioTriagem && !Number.isNaN(inicioTriagem)) {
                tempoTriagemSegundos = Math.floor((Date.now() - inicioTriagem) / 1000);
            }

            const dadosPaciente = {
                nome: nomeInput.value,
                dataNasc: dataInput.value,
                sintomas: sintomasInput.value,
                tipo: tipoFila,
                tempoTriagemSegundos: tempoTriagemSegundos
            };

            console.log("Dados enviados:", dadosPaciente);

            const textoOriginalBotao = btnFinalizar.innerText;
            btnFinalizar.innerText = "Enviando...";
            btnFinalizar.disabled = true;

            try {
                // Requisição apontando para a Edge Function
                const response = await fetch(functionUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseAnonKey}`
                    },
                    body: JSON.stringify(dadosPaciente)
                });

                if (response.ok) {
                    const resultado = await response.json();

                    window.location.href = `Finalizado.html?id=${resultado.id}`;
                } else {
                    // Isso vai capturar o texto exato do erro que a Função devolveu
                    const erroDoServidor = await response.text();
                    alert("Erro do servidor: " + erroDoServidor);

                    btnFinalizar.innerText = textoOriginalBotao;
                    btnFinalizar.disabled = false;
                }

            } catch (error) {
                console.error("Erro:", error);
                alert("Erro de conexão com o servidor.");
                btnFinalizar.innerText = textoOriginalBotao;
                btnFinalizar.disabled = false;
            }
        }
    });
});