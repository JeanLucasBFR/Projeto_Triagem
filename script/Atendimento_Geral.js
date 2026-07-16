document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("formulario");

    const nomeInput = document.getElementById("nome");
    const cpfInput = document.getElementById("cpf");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");
    const btnFinalizar = document.querySelector(".btn.finalizar");

    // ✅ MÁSCARA DE CPF
    cpfInput.addEventListener("input", function () {
        let valor = cpfInput.value;

        valor = valor.replace(/\D/g, "");
        valor = valor.slice(0, 11);

        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

        cpfInput.value = valor;
    });

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

        // ✅ CPF SIMPLIFICADO (SÓ TAMANHO)
        function validarCPF(cpf) {
            cpf = cpf.replace(/\D/g, "");
            return cpf.length === 11;
        }

        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }

        if (!validarCPF(cpfInput.value)) {
            criarErro(cpfInput, "CPF deve ter 11 dígitos.");
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

            const dadosPaciente = {
                nome: nomeInput.value,
                cpf: cpfInput.value.replace(/\D/g, ""),
                data_nascimento: dataInput.value,
                sintomas: sintomasInput.value
            };

            const textoOriginalBotao = btnFinalizar.innerText;
            btnFinalizar.innerText = "Enviando...";
            btnFinalizar.disabled = true;

            try {
                const makeWebhookUrl = "https://hook.us2.make.com/kz8n4sulmws4bxitvfwpm3ey5mqhvsag";

                const response = await fetch(makeWebhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dadosPaciente)
                });

                if (response.ok) {
                    window.location.href = "Finalizado.html";
                } else {
                    alert("Erro ao enviar dados.");
                    btnFinalizar.innerText = textoOriginalBotao;
                    btnFinalizar.disabled = false;
                }

            } catch (error) {
                console.error("Erro:", error);
                alert("Erro de conexão.");
                btnFinalizar.innerText = textoOriginalBotao;
                btnFinalizar.disabled = false;
            }
        }
    });
});