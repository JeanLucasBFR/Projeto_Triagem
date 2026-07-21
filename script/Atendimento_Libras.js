document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector(".formulario");

    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");

 

    form.addEventListener("submit", function (e) {

        e.preventDefault(); 
        let valido = true;

        // Remove mensagens antigas
        document.querySelectorAll(".erro").forEach(el => el.remove());

        function criarErro(input, mensagem) {
            const small = document.createElement("small");
            small.classList.add("erro");
            small.textContent = mensagem;
            input.parentElement.appendChild(small);
        }

        function validarNome(nome) {
            nome = nome.trim();
            const partes = nome.split(" ");
            const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
            return partes.length >= 2 && regex.test(nome);
        }



        // ===== VALIDAR NOME =====
        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }


        // ===== VALIDAR DATA =====
        if (!dataInput.value) {
            criarErro(dataInput, "Informe a data de nascimento.");
            valido = false;
        }

        // ===== VALIDAR SINTOMAS =====
        if (sintomasInput.value.trim() === "") {
            criarErro(sintomasInput, "Descreva os sintomas.");
            valido = false;
        }

        // ===== REDIRECIONAMENTO =====
        if (valido) {
            window.location.href = "Finalizado.html";
        }

    });

});