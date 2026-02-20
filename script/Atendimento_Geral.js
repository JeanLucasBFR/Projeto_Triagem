document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("formulario");

    // Adicionado 'async' aqui para permitir a comunicação com o n8n
    form.addEventListener("submit", async function (e) {
        
        e.preventDefault(); // Já bloqueamos o recarregamento padrão logo de cara

        let valido = true;

        const nomeInput = document.getElementById("nome");
        const cpfInput = document.getElementById("cpf");
        const dataInput = document.getElementById("data");
        const sintomasInput = document.getElementById("sintomas");
        const btnFinalizar = document.querySelector(".btn.finalizar"); // Pegando o botão para mudar o texto depois

        // Remove mensagens antigas
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

        function validarCPF(cpf) {
            cpf = cpf.replace(/[^\d]+/g, '');
            if (cpf.length !== 11) return false;
            if (/^(\d)\1+$/.test(cpf)) return false;
            return true;
        }

        // ===== VALIDAR NOME =====
        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }

        // ===== VALIDAR CPF =====
        if (!validarCPF(cpfInput.value)) {
            criarErro(cpfInput, "CPF inválido.");
            valido = false;
        }

        // ===== VALIDAR DATA =====
        if (!dataInput.value) {
            criarErro(dataInput, "Informe a data de nascimento.");
            valido = false;
        }

        // ===== VALIDAR SINTOMAS =====
        if (sintomasInput.value.trim() === "") {
            criarErro(sintomasInput, "Escolha os sintomas.");
            valido = false;
        }

        // ===== SE PASSOU NA VALIDAÇÃO, ENVIA PARA O N8N =====
        if (valido) {
            
            // 1. Monta o pacote de dados
            const dadosPaciente = {
                nome: nomeInput.value,
                cpf: cpfInput.value,
                data_nascimento: dataInput.value,
                sintomas: sintomasInput.value
            };

            // 2. Dá um feedback visual pro usuário não clicar duas vezes
            const textoOriginalBotao = btnFinalizar.innerText;
            btnFinalizar.innerText = "Enviando...";
            btnFinalizar.disabled = true;

            try {
                // 3. A URL do nosso maestro
                const n8nUrl = "https://1a2b-3c4d.ngrok-free.app/webhook-test/211d627b-34ee-43a9-8454-836db8f4e2ef";

                // 4. Faz o disparo via POST
                const response = await fetch(n8nUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dadosPaciente)
                });

                // 5. Se o n8n der "OK", vai pra tela de finalizado
                if (response.ok) {
                    window.location.href = "Finalizado.html";
                } else {
                    alert("Erro ao enviar dados para a triagem.");
                    btnFinalizar.innerText = textoOriginalBotao;
                    btnFinalizar.disabled = false;
                }

            } catch (error) {
                console.error("Erro na requisição:", error);
                alert("Erro de conexão. O n8n está rodando?");
                btnFinalizar.innerText = textoOriginalBotao;
                btnFinalizar.disabled = false;
            }
        }
    });
});