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

        function validarCPF(cpf) {
            cpf = cpf.replace(/[^\d]+/g, '');

            if (cpf.length !== 11) return false;
            if (/^(\d)\1+$/.test(cpf)) return false;

            let soma = 0;
            let resto;

            for (let i = 1; i <= 9; i++)
                soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);

            resto = (soma * 10) % 11;
            if (resto >= 10) resto = 0;
            if (resto !== parseInt(cpf.substring(9, 10))) return false;

            soma = 0;
            for (let i = 1; i <= 10; i++)
                soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);

            resto = (soma * 10) % 11;
            if (resto >= 10) resto = 0;
            if (resto !== parseInt(cpf.substring(10, 11))) return false;

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
                const n8nUrl = "https://donte-perinephrial-inappositely.ngrok-free.dev/webhook-test/211d627b-34ee-43a9-8454-836db8f4e2ef";

                const response = await fetch(n8nUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
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