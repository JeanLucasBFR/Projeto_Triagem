document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formulario");
    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");
    const btnFinalizar = document.querySelector(".btn.finalizar");
    const teclas = document.querySelectorAll(".tecla");

    const videoElement = document.getElementById("videoElement");
    const canvasElement = document.getElementById("canvasElement");
    const canvasCtx = canvasElement.getContext("2d");
    const resultado = document.getElementById("resultado");

    teclas.forEach(tecla => {
        if (tecla.classList.contains("apagar") || tecla.classList.contains("espaco")) {
            return;
        }

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

        return min.replace(/(^\s*|[.!?]\s+|\n\s*)([a-zà-öø-ÿ])/g, function (match, separador, letra) {
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

    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs";
    const functionUrl = "https://drfjnznvfrofednoexgq.supabase.co/functions/v1/triagem_manchester";

    function distancia(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function dedoAberto(landmarks, ponta, articulacao) {
        return landmarks[ponta].y < landmarks[articulacao].y;
    }

    function maoEm1(landmarks) {
        const indicadorAberto = dedoAberto(landmarks, 8, 6);
        const medioAberto = dedoAberto(landmarks, 12, 10);
        const anelarAberto = dedoAberto(landmarks, 16, 14);
        const mindinhoAberto = dedoAberto(landmarks, 20, 18);

        return indicadorAberto &&
               !medioAberto &&
               !anelarAberto &&
               !mindinhoAberto;
    }

    function maoDor(landmarks) {
        const indicadorAberto = dedoAberto(landmarks, 8, 6);
        const anelarAberto = dedoAberto(landmarks, 16, 14);
        const mindinhoAberto = dedoAberto(landmarks, 20, 18);

        const larguraMao = distancia(landmarks[5], landmarks[17]);
        const distanciaPolegarMedio = distancia(landmarks[4], landmarks[12]);
        const distanciaNormalizada = distanciaPolegarMedio / larguraMao;

        return indicadorAberto &&
               anelarAberto &&
               mindinhoAberto &&
               distanciaNormalizada < 0.48;
    }

    function distanciaPolegarMedioNormalizada(landmarks) {
        const larguraMao = distancia(landmarks[5], landmarks[17]);

        if (larguraMao === 0) {
            return 0;
        }

        return distancia(landmarks[4], landmarks[12]) / larguraMao;
    }

    function tamanhoRosto(face) {
        if (!face || !face[33] || !face[263]) {
            return 0;
        }

        return distancia(face[33], face[263]);
    }

    function pertoDaTesta(landmarks, face) {
        if (!face || !face[10]) {
            return false;
        }

        const escalaRosto = tamanhoRosto(face);

        if (escalaRosto === 0) {
            return false;
        }

        const pontaIndicador = landmarks[8];
        const testa = face[10];

        const distanciaTesta = distancia(pontaIndicador, testa);

        return distanciaTesta < escalaRosto * 0.95;
    }

    function maoPertoDaCabeca(landmarks, face) {
        if (!face || !face[10]) {
            return false;
        }

        const escalaRosto = tamanhoRosto(face);

        if (escalaRosto === 0) {
            return false;
        }

        const indicador = landmarks[8];
        const centroMao = landmarks[9];
        const testa = face[10];

        const distanciaIndicador = distancia(indicador, testa);
        const distanciaCentro = distancia(centroMao, testa);

        return Math.min(distanciaIndicador, distanciaCentro) < escalaRosto * 1.65;
    }

    let ultimoRosto = null;

    let estadoSinal = "AGUARDANDO_1";
    let faseMovimento = "FECHADO";
    let quantidadeMovimentos = 0;
    let inicioReconhecimento = 0;
    let bloqueadoAte = 0;

    function alterarResultado(texto) {
        if (resultado.textContent !== texto) {
            resultado.textContent = texto;
        }
    }

    function resetarReconhecimento() {
        estadoSinal = "AGUARDANDO_1";
        faseMovimento = "FECHADO";
        quantidadeMovimentos = 0;
        inicioReconhecimento = 0;
    }

    function adicionarDorCabeca() {
        const sintomasAtuais = sintomasInput.value.trim();

        if (sintomasAtuais.toLowerCase().includes("dor de cabeça")) {
            return;
        }

        if (sintomasAtuais === "") {
            sintomasInput.value = "Dor de cabeça";
        } else {
            sintomasInput.value = sintomasAtuais + ", Dor de cabeça";
        }

        sintomasInput.dispatchEvent(new Event("input"));
        sintomasInput.focus();
    }

    function confirmarDorCabeca() {
        adicionarDorCabeca();

        quantidadeMovimentos = 3;
        alterarResultado("Dor de cabeça identificada");

        bloqueadoAte = performance.now() + 2500;

        resetarReconhecimento();

        setTimeout(function () {
            if (performance.now() >= bloqueadoAte) {
                alterarResultado("Posicione o indicador na testa");
            }
        }, 2600);
    }

    function processarReconhecimento(landmarks, face) {
        const agora = performance.now();

        if (agora < bloqueadoAte) {
            return;
        }

        if (!face) {
            resetarReconhecimento();
            alterarResultado("Rosto não detectado");
            return;
        }

        if (!landmarks) {
            if (estadoSinal !== "AGUARDANDO_1" && inicioReconhecimento > 0 && agora - inicioReconhecimento > 1500) {
                resetarReconhecimento();
            }

            if (estadoSinal === "AGUARDANDO_1") {
                alterarResultado("Posicione o indicador na testa");
            }

            return;
        }

        if (inicioReconhecimento > 0 && agora - inicioReconhecimento > 5000) {
            resetarReconhecimento();
        }

        if (estadoSinal === "AGUARDANDO_1") {
            if (maoEm1(landmarks) && pertoDaTesta(landmarks, face)) {
                estadoSinal = "INDICADOR_TESTA";
                inicioReconhecimento = agora;

                alterarResultado("Indicador detectado na testa");
            }

            return;
        }

        if (estadoSinal === "INDICADOR_TESTA") {
            if (maoEm1(landmarks) && pertoDaTesta(landmarks, face)) {
                if (agora - inicioReconhecimento > 150) {
                    estadoSinal = "AGUARDANDO_DOR";
                    inicioReconhecimento = agora;

                    alterarResultado("Agora faça o movimento da dor");
                }
            } else if (agora - inicioReconhecimento > 1000) {
                resetarReconhecimento();
                alterarResultado("Posicione o indicador na testa");
            }

            return;
        }

        if (estadoSinal === "AGUARDANDO_DOR") {
            if (!maoPertoDaCabeca(landmarks, face)) {
                if (agora - inicioReconhecimento > 1500) {
                    resetarReconhecimento();
                    alterarResultado("Posicione o indicador na testa");
                }

                return;
            }

            if (maoDor(landmarks)) {
                estadoSinal = "MOVIMENTO";
                faseMovimento = "FECHADO";
                quantidadeMovimentos = 0;
                inicioReconhecimento = agora;

                alterarResultado("Faça o movimento repetidamente");
            }

            return;
        }

        if (estadoSinal === "MOVIMENTO") {
            if (!maoPertoDaCabeca(landmarks, face)) {
                if (agora - inicioReconhecimento > 2000) {
                    resetarReconhecimento();
                    alterarResultado("Sinal interrompido. Tente novamente");
                }

                return;
            }

            const distanciaNormalizada = distanciaPolegarMedioNormalizada(landmarks);

            if (faseMovimento === "FECHADO" && distanciaNormalizada > 0.72) {
                faseMovimento = "ABERTO";

                quantidadeMovimentos++;

                if (quantidadeMovimentos >= 3) {
                    confirmarDorCabeca();
                    return;
                }

                alterarResultado(`Movimento detectado: ${quantidadeMovimentos}/3`);
            }

            if (faseMovimento === "ABERTO" && distanciaNormalizada < 0.45) {
                faseMovimento = "FECHADO";
            }

            if (agora - inicioReconhecimento > 4000) {
                resetarReconhecimento();
                alterarResultado("Não reconhecido. Tente novamente");
            }
        }
    }

    if (
        typeof Hands === "undefined" ||
        typeof FaceMesh === "undefined" ||
        typeof Camera === "undefined"
    ) {
        alterarResultado("Erro ao carregar MediaPipe");
    } else {
        const hands = new Hands({
            locateFile: function (file) {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(function (results) {
            canvasElement.width = 640;
            canvasElement.height = 480;

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.image) {
                canvasCtx.drawImage(
                    results.image,
                    0,
                    0,
                    canvasElement.width,
                    canvasElement.height
                );
            }

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];

                drawConnectors(
                    canvasCtx,
                    landmarks,
                    HAND_CONNECTIONS,
                    {
                        color: "#2563eb",
                        lineWidth: 3
                    }
                );

                drawLandmarks(
                    canvasCtx,
                    landmarks,
                    {
                        color: "#ef4444",
                        lineWidth: 1,
                        radius: 4
                    }
                );

                if (ultimoRosto && ultimoRosto[10]) {
                    const testa = ultimoRosto[10];

                    canvasCtx.beginPath();
                    canvasCtx.arc(
                        testa.x * canvasElement.width,
                        testa.y * canvasElement.height,
                        7,
                        0,
                        Math.PI * 2
                    );
                    canvasCtx.fillStyle = "#22c55e";
                    canvasCtx.fill();
                }

                processarReconhecimento(
                    landmarks,
                    ultimoRosto
                );
            } else {
                processarReconhecimento(
                    null,
                    ultimoRosto
                );
            }

            canvasCtx.restore();
        });

        const faceMesh = new FaceMesh({
            locateFile: function (file) {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(function (results) {
            if (
                results.multiFaceLandmarks &&
                results.multiFaceLandmarks.length > 0
            ) {
                ultimoRosto = results.multiFaceLandmarks[0];
            } else {
                ultimoRosto = null;
            }
        });

        const camera = new Camera(videoElement, {
            onFrame: async function () {
                try {
                    await hands.send({
                        image: videoElement
                    });

                    await faceMesh.send({
                        image: videoElement
                    });
                } catch (error) {
                    console.error("Erro ao processar câmera:", error);
                }
            },
            width: 640,
            height: 480
        });

        try {
            camera.start();
        } catch (error) {
            console.error("Erro ao iniciar câmera:", error);
            alterarResultado("Não foi possível iniciar a câmera");
        }
    }

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
            criarErro(sintomasInput, "Descreva os sintomas.");
            valido = false;
        }

        if (valido) {
            const urlParams = new URLSearchParams(window.location.search);
            const tipoFila = urlParams.get("tipo") || "G";

            const partesData = dataInput.value.split("/");

            const dataFormatadaBanco =
                `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            const dadosPaciente = {
                nome: nomeInput.value,
                dataNasc: dataFormatadaBanco,
                sintomas: sintomasInput.value,
                tipo: tipoFila
            };

            const textoOriginalBotao = btnFinalizar.innerText;

            btnFinalizar.innerText = "Enviando...";
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
                    window.location.href = "Finalizado.html";
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