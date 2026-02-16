document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("formulario");

    form.addEventListener("submit", function (e) {

        let valido = true;

        const nomeInput = document.getElementById("nome");
        const cpfInput = document.getElementById("cpf");
        const dataInput = document.getElementById("data");
        const sintomasInput = document.getElementById("sintomas");

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

        // ===== BLOQUEIA ENVIO =====
        if (!valido) {
            e.preventDefault();
        } else {
            e.preventDefault(); // impede envio real
            window.location.href = "Finalizado.html";
        }


    });

});