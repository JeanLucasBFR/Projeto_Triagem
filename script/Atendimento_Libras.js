document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formulario");
    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");
    const btnFinalizar = document.querySelector(".btn.finalizar");
    const teclas = document.querySelectorAll(".tecla");

    // ==========================================
    // 1. CONFIGURAÇÃO DO TECLADO E FORMULÁRIO
    // ==========================================

    teclas.forEach(tecla => {
        if (tecla.classList.contains("apagar") || tecla.classList.contains("espaco")) return;

        const letra = tecla.querySelector(".letra");
        const sinal = tecla.querySelector(".sinal");

        if (!letra || !sinal) return;

        const caractere = letra.textContent.trim();
        const imagem = document.createElement("img");

        imagem.src = `../libras/${caractere}.png`;
        imagem.alt = `Sinal de Libras ${caractere}`;

        sinal.innerHTML = "";
        sinal.appendChild(imagem);
    });

    if (dataInput) {
        dataInput.type = "text";
        dataInput.placeholder = "DD/MM/AAAA";
        dataInput.maxLength = 10;
    }

    let campoFocado = nomeInput;

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

    function aplicarMascaraData(valor) {
        let apenasNumeros = valor.replace(/\D/g, "");
        apenasNumeros = apenasNumeros.slice(0, 8);

        if (apenasNumeros.length >= 5) {
            return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
        } else if (apenasNumeros.length >= 3) {
            return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
        }

        return apenasNumeros;
    }

    nomeInput.addEventListener("input", function () {
        this.value = formatarNome(this.value);
    });

    sintomasInput.addEventListener("input", function () {
        this.value = formatarSintomas(this.value);
    });

    dataInput.addEventListener("input", function () {
        this.value = aplicarMascaraData(this.value);
    });

    [nomeInput, dataInput, sintomasInput].forEach(input => {
        if (input) {
            input.addEventListener("focus", function () {
                campoFocado = this;
                atualizarEstadoTeclas();
            });
        }
    });

    function atualizarEstadoTeclas() {
        teclas.forEach(tecla => {
            if (tecla.classList.contains("apagar") || tecla.classList.contains("espaco")) {
                tecla.disabled = false;
                tecla.style.opacity = "1";
                tecla.style.cursor = "pointer";
                return;
            }

            const caractere = tecla.querySelector(".letra")?.textContent;
            const ehNumero = /^[0-9]$/.test(caractere);
            const ehLetra = /^[A-Z]$/i.test(caractere);

            let habilitado = true;

            if (campoFocado === nomeInput) {
                habilitado = ehLetra;
            } else if (campoFocado === dataInput) {
                habilitado = ehNumero;
            } else if (campoFocado === sintomasInput) {
                habilitado = true;
            }

            tecla.disabled = !habilitado;
            tecla.style.opacity = habilitado ? "1" : "0.35";
            tecla.style.cursor = habilitado ? "pointer" : "not-allowed";
        });
    }

    teclas.forEach(tecla => {
        tecla.addEventListener("click", function () {
            if (tecla.classList.contains("apagar")) {
                if (!campoFocado) return;

                campoFocado.value = campoFocado.value.slice(0, -1);

                if (campoFocado === nomeInput) {
                    campoFocado.value = formatarNome(campoFocado.value);
                } else if (campoFocado === sintomasInput) {
                    campoFocado.value = formatarSintomas(campoFocado.value);
                } else if (campoFocado === dataInput) {
                    campoFocado.value = aplicarMascaraData(campoFocado.value);
                }

                campoFocado.focus();
                return;
            }

            if (tecla.classList.contains("espaco")) {
                if (!campoFocado || campoFocado === dataInput) return;

                campoFocado.value += " ";
                campoFocado.focus();
                return;
            }

            if (!campoFocado || tecla.disabled) return;

            const caractere = tecla.querySelector(".letra")?.textContent;

            if (!caractere) return;

            if (campoFocado === nomeInput) {
                campoFocado.value = formatarNome(campoFocado.value + caractere);
            } else if (campoFocado === dataInput) {
                if (campoFocado.value.length < 10) {
                    campoFocado.value = aplicarMascaraData(campoFocado.value + caractere);
                }
            } else if (campoFocado === sintomasInput) {
                campoFocado.value = formatarSintomas(campoFocado.value + caractere);
            }

            campoFocado.focus();
        });
    });

    atualizarEstadoTeclas();

    // ==========================================
    // 2. SELEÇÃO VISUAL DE SINTOMAS EM LIBRAS
    // ==========================================

    const modalSintomas = document.getElementById("modalSintomas");
    const fecharSintomas = document.getElementById("fecharSintomas");
    const confirmarSintomas = document.getElementById("confirmarSintomas");
    const limparSintomas = document.getElementById("limparSintomas");
    const cardsSintomas = document.querySelectorAll(".card-sintoma");

    let sintomasTemporarios = [];

    function obterSintomasAtuais() {
        if (!sintomasInput.value.trim()) return [];

        return sintomasInput.value
            .split(",")
            .map(sintoma => sintoma.trim())
            .filter(sintoma => sintoma !== "");
    }

    function atualizarCardsSintomas() {
        cardsSintomas.forEach(card => {
            const sintoma = card.dataset.sintoma;

            const selecionado = sintomasTemporarios.some(item =>
                item.toLowerCase() === sintoma.toLowerCase()
            );

            card.classList.toggle("selecionado", selecionado);

            const textoBotao = card.querySelector(".selecionar-sintoma");

            if (textoBotao) {
                textoBotao.textContent = selecionado ? "Selecionado ✓" : "Selecionar";
            }
        });
    }

    function abrirModalSintomas() {
        sintomasTemporarios = obterSintomasAtuais();

        atualizarCardsSintomas();

        modalSintomas.classList.add("ativo");
        document.body.classList.add("modal-aberto");
    }

    function alternarSintoma(sintoma) {
        const indice = sintomasTemporarios.findIndex(item =>
            item.toLowerCase() === sintoma.toLowerCase()
        );

        if (indice === -1) {
            sintomasTemporarios.push(sintoma);
        } else {
            sintomasTemporarios.splice(indice, 1);
        }

        atualizarCardsSintomas();
    }

    sintomasInput.addEventListener("click", function () {
        campoFocado = sintomasInput;
        atualizarEstadoTeclas();
        abrirModalSintomas();
    });

    sintomasInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            abrirModalSintomas();
        }
    });

    cardsSintomas.forEach(card => {
        const botaoSelecionar = card.querySelector(".selecionar-sintoma");

        if (!botaoSelecionar) return;

        botaoSelecionar.addEventListener("click", function () {
            const sintoma = card.dataset.sintoma;

            if (!sintoma) return;

            alternarSintoma(sintoma);
        });
    });

    confirmarSintomas.addEventListener("click", function () {
        sintomasInput.value = sintomasTemporarios.join(", ");
        sintomasInput.value = formatarSintomas(sintomasInput.value);
        sintomasInput.dispatchEvent(new Event("input"));

        fecharModalSintomas();
    });

    limparSintomas.addEventListener("click", function () {
        sintomasTemporarios = [];
        atualizarCardsSintomas();
    });

    // ==========================================
    // 3. CONTROLE DOS VÍDEOS
    // ==========================================

    const videosSintomas = document.querySelectorAll(".video-sintoma");
    const botoesPlay = document.querySelectorAll(".btn-play-video");

    function mostrarBotaoPlay(video) {
        const container = video.closest(".video-container");

        if (!container) return;

        const botao = container.querySelector(".btn-play-video");

        if (botao) {
            botao.classList.remove("oculto");
        }
    }

    function esconderBotaoPlay(video) {
        const container = video.closest(".video-container");

        if (!container) return;

        const botao = container.querySelector(".btn-play-video");

        if (botao) {
            botao.classList.add("oculto");
        }
    }

    function pausarOutrosVideos(videoAtual) {
        videosSintomas.forEach(video => {
            if (video !== videoAtual) {
                video.pause();
                mostrarBotaoPlay(video);
            }
        });
    }

    function pararTodosVideos() {
        videosSintomas.forEach(video => {
            video.pause();
            video.currentTime = 0;
            mostrarBotaoPlay(video);
        });
    }

    botoesPlay.forEach(botao => {
        botao.addEventListener("click", function () {
            const container = this.closest(".video-container");

            if (!container) return;

            const video = container.querySelector(".video-sintoma");

            if (!video) return;

            pausarOutrosVideos(video);

            video.play()
                .then(() => {
                    esconderBotaoPlay(video);
                })
                .catch(error => {
                    console.error("Erro ao reproduzir vídeo:", error);
                    mostrarBotaoPlay(video);
                });
        });
    });

    videosSintomas.forEach(video => {

        video.addEventListener("click", function () {
            if (!this.paused) {
                this.pause();
                mostrarBotaoPlay(this);
            }
        });

        video.addEventListener("ended", function () {
            this.currentTime = 0;
            mostrarBotaoPlay(this);
        });

    });

    // ==========================================
    // 4. FECHAMENTO DO MODAL
    // ==========================================

    function fecharModalSintomas() {
        pararTodosVideos();

        modalSintomas.classList.remove("ativo");
        document.body.classList.remove("modal-aberto");
    }

    fecharSintomas.addEventListener("click", function () {
        fecharModalSintomas();
    });

    modalSintomas.addEventListener("click", function (event) {
        if (event.target === modalSintomas) {
            fecharModalSintomas();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modalSintomas.classList.contains("ativo")) {
            fecharModalSintomas();
        }
    });

    // ==========================================
    // 5. ENVIO PARA O SUPABASE
    // ==========================================

    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs";

    const functionUrl = "https://drfjnznvfrofednoexgq.supabase.co/functions/v1/triagem_manchester";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        let valido = true;

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

        if (!validarNome(nomeInput.value)) {
            criarErro(nomeInput, "Digite nome e sobrenome válido.");
            valido = false;
        }

        if (!dataInput.value || dataInput.value.length < 10) {
            criarErro(dataInput, "Informe a data de nascimento completa.");
            valido = false;
        }

        if (sintomasInput.value.trim() === "") {
            criarErro(sintomasInput, "Selecione pelo menos um sintoma.");
            valido = false;
        }

        if (valido) {
            const urlParams = new URLSearchParams(window.location.search);
            const tipoFila = urlParams.get("tipo") || "L";

            const inicioTriagem = Number(sessionStorage.getItem("inicioTriagem"));

            let tempoTriagemSegundos = null;

            if (inicioTriagem && !Number.isNaN(inicioTriagem)) {
                tempoTriagemSegundos = Math.floor((Date.now() - inicioTriagem) / 1000);
            }

            const partesData = dataInput.value.split("/");
            const dataFormatadaBanco = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            const dadosPaciente = {
                nome: nomeInput.value,
                dataNasc: dataFormatadaBanco,
                sintomas: sintomasInput.value,
                tipo: tipoFila,
                tempoTriagemSegundos: tempoTriagemSegundos
            };

            const textoOriginalBotao = btnFinalizar.innerText;

            btnFinalizar.innerText = "A enviar...";
            btnFinalizar.disabled = true;

            try {
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