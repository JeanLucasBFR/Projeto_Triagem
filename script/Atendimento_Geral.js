document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("formulario");

    form.addEventListener("submit", async function (e) {
        
        e.preventDefault(); 

        let valido = true;

        const nomeInput = document.getElementById("nome");
        const cpfInput = document.getElementById("cpf");
        const dataInput = document.getElementById("data");
        const sintomasInput = document.getElementById("sintomas");
        const gravidadeInput = document.getElementById("gravidade"); 
        const senhaInput = document.getElementById("senha");         
        const btnFinalizar = document.querySelector(".btn.finalizar");

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

        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }

        if (!validarCPF(cpfInput.value)) {
            criarErro(cpfInput, "CPF inválido.");
            valido = false;
        }

        if (!dataInput.value) {
            criarErro(dataInput, "Informe a data de nascimento.");
            valido = false;
        }

        if (sintomasInput.value.trim() === "") {
            criarErro(sintomasInput, "Escolha os sintomas.");
            valido = false;
        }

        // Validando os campos de teste para não quebrar o envio
        if (gravidadeInput.value.trim() === "") {
            criarErro(gravidadeInput, "Preencha a gravidade.");
            valido = false;
        }

        if (senhaInput.value.trim() === "") {
            criarErro(senhaInput, "Preencha a senha.");
            valido = false;
        }

        if (valido) {
            
            // 1. Monta o pacote de dados pegando TUDO do HTML
            const dadosPaciente = {
                nome: nomeInput.value,
                cpf: cpfInput.value,
                data_nascimento: dataInput.value,
                sintomas: sintomasInput.value,
                gravidade: gravidadeInput.value, // Vem do seu input
                senha: senhaInput.value          // Vem do seu input
            };

            const textoOriginalBotao = btnFinalizar.innerText;
            btnFinalizar.innerText = "Enviando...";
            btnFinalizar.disabled = true;

            try {
                // 3. A URL do nosso maestro
                const n8nUrl = "http://localhost:5678/webhook-test/211d627b-34ee-43a9-8454-836db8f4e2ef";

                const response = await fetch(n8nUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dadosPaciente)
                });

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