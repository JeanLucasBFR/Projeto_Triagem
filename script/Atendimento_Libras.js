document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formulario");
    const nomeInput = document.getElementById("nome");
    const dataInput = document.getElementById("data");
    const sintomasInput = document.getElementById("sintomas");
    const btnFinalizar = document.querySelector(".btn.finalizar");
    const teclas = document.querySelectorAll(".tecla");

    const canvasElement = document.getElementById("canvasElement");
    const canvasCtx = canvasElement.getContext("2d");
    const resultado = document.getElementById("resultado");

    // ==========================================
    // 1. CONFIGURAÇÃO DO TECLADO VIRTUAL E FORMULÁRIO
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

    // ==========================================
    // 2. MEDIAPIPE - DOR DE CABEÇA E FEBRE
    // ==========================================

    let holisticLandmarker = null;
    let videoElement = null;
    let ultimoResultadoMediaPipe = null;
    let ultimoTempoProcessamento = 0;

    let historicoAproximacao = [];
    let ultimaVezMaoEmF = 0;
    let inicioConfirmacaoFebre = 0;
    let bloqueadoAte = 0;

    const INTERVALO_PROCESSAMENTO_MS = 100;

    // Dor de cabeça
    const JANELA_MOVIMENTO_MS = 1200;
    const APROXIMACAO_MINIMA = 0.35;
    const DISTANCIA_FINAL_MAXIMA = 0.30;

    // Febre
    const TEMPO_CONFIRMACAO_FEBRE_MS = 1200;
    const DISTANCIA_CENTRO_PULSO_MAX = 0.65;
    const DISTANCIA_DEDO_PULSO_MAX = 1.25;
    const ABERTURA_POLEGAR_INDICADOR_MAX = 1.40;

    const TEMPO_BLOQUEIO_MS = 3000;

    const CONEXOES_MAO = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17]
    ];

    function alterarResultado(texto) {
        if (resultado.textContent !== texto) {
            resultado.textContent = texto;
        }
    }

    function adicionarSintoma(sintomaDetectado) {
        const sintomasAtuais = sintomasInput.value.trim();

        const sintomaFormatado =
            sintomaDetectado.charAt(0).toUpperCase() +
            sintomaDetectado.slice(1).toLowerCase();

        if (sintomasAtuais.toLowerCase().includes(sintomaFormatado.toLowerCase())) {
            return;
        }

        if (sintomasAtuais === "") {
            sintomasInput.value = sintomaFormatado;
        } else {
            sintomasInput.value = sintomasAtuais + ", " + sintomaFormatado;
        }

        sintomasInput.dispatchEvent(new Event("input"));
        sintomasInput.focus();
    }

    function distancia(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;

        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function pontoMedio(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }

    // ==========================================
    // DOR DE CABEÇA
    // ==========================================

    function maoEstaEmF(landmarks) {
        if (!landmarks || landmarks.length < 21) return false;

        const tamanhoPalma = distancia(landmarks[0], landmarks[9]);
        if (tamanhoPalma === 0) return false;

        const distanciaPolegarIndicador =
            distancia(landmarks[4], landmarks[8]) / tamanhoPalma;

        const polegarIndicadorJuntos =
            distanciaPolegarIndicador < 0.55;

        const medioEstendido =
            distancia(landmarks[12], landmarks[0]) >
            distancia(landmarks[10], landmarks[0]) * 1.08;

        const anelarEstendido =
            distancia(landmarks[16], landmarks[0]) >
            distancia(landmarks[14], landmarks[0]) * 1.08;

        const mindinhoEstendido =
            distancia(landmarks[20], landmarks[0]) >
            distancia(landmarks[18], landmarks[0]) * 1.05;

        return (
            polegarIndicadorJuntos &&
            medioEstendido &&
            anelarEstendido &&
            mindinhoEstendido
        );
    }

    function obterPontoDoF(landmarks) {
        return pontoMedio(landmarks[4], landmarks[8]);
    }

    function obterCaixaRosto(faceLandmarks) {
        let minX = 1;
        let minY = 1;
        let maxX = 0;
        let maxY = 0;

        faceLandmarks.forEach(ponto => {
            minX = Math.min(minX, ponto.x);
            minY = Math.min(minY, ponto.y);
            maxX = Math.max(maxX, ponto.x);
            maxY = Math.max(maxY, ponto.y);
        });

        return { minX, minY, maxX, maxY };
    }

    function expandirCaixaCabeca(caixaRosto) {
        const largura = caixaRosto.maxX - caixaRosto.minX;
        const altura = caixaRosto.maxY - caixaRosto.minY;

        return {
            minX: caixaRosto.minX - largura * 0.30,
            maxX: caixaRosto.maxX + largura * 0.30,
            minY: caixaRosto.minY - altura * 0.30,
            maxY: caixaRosto.maxY + altura * 0.20
        };
    }

    function distanciaAteCaixa(ponto, caixa) {
        let dx = 0;
        let dy = 0;

        if (ponto.x < caixa.minX) {
            dx = caixa.minX - ponto.x;
        } else if (ponto.x > caixa.maxX) {
            dx = ponto.x - caixa.maxX;
        }

        if (ponto.y < caixa.minY) {
            dy = caixa.minY - ponto.y;
        } else if (ponto.y > caixa.maxY) {
            dy = ponto.y - caixa.maxY;
        }

        return Math.sqrt(dx * dx + dy * dy);
    }

    function resetarMovimentoCabeca() {
        historicoAproximacao = [];
    }

    function analisarDorDeCabeca(deteccao, agora) {
        const rosto = deteccao.faceLandmarks?.[0];

        const maos = [
            ...(deteccao.leftHandLandmarks || []),
            ...(deteccao.rightHandLandmarks || [])
        ];

        if (!rosto) {
            resetarMovimentoCabeca();
            alterarResultado("Posicione o rosto na câmera.");
            return;
        }

        if (maos.length === 0) {
            resetarMovimentoCabeca();
            alterarResultado("Mostre a mão para a câmera.");
            return;
        }

        const maoEmF = maos.find(maoEstaEmF);

        if (!maoEmF) {
            if (agora - ultimaVezMaoEmF > 300) {
                resetarMovimentoCabeca();
            }

            alterarResultado("Faça o sinal de dor de cabeça ou febre.");
            return;
        }

        ultimaVezMaoEmF = agora;

        const caixaRosto = obterCaixaRosto(rosto);
        const caixaCabeca = expandirCaixaCabeca(caixaRosto);
        const pontoF = obterPontoDoF(maoEmF);

        const larguraRosto = Math.max(
            caixaRosto.maxX - caixaRosto.minX,
            0.001
        );

        const distanciaCabeca =
            distanciaAteCaixa(pontoF, caixaCabeca) /
            larguraRosto;

        historicoAproximacao.push({
            tempo: agora,
            distancia: distanciaCabeca
        });

        historicoAproximacao =
            historicoAproximacao.filter(item =>
                agora - item.tempo <= JANELA_MOVIMENTO_MS
            );

        if (historicoAproximacao.length < 2) {
            alterarResultado(
                "Mão em F detectada. Aponte em direção à cabeça."
            );
            return;
        }

        const primeiro = historicoAproximacao[0];

        const aproximacao =
            primeiro.distancia -
            distanciaCabeca;

        const tempoMovimento =
            agora -
            primeiro.tempo;

        if (
            tempoMovimento >= 300 &&
            aproximacao >= APROXIMACAO_MINIMA &&
            distanciaCabeca <= DISTANCIA_FINAL_MAXIMA
        ) {
            adicionarSintoma("Dor de cabeça");

            alterarResultado(
                "Sintoma reconhecido: Dor de cabeça!"
            );

            bloqueadoAte =
                agora +
                TEMPO_BLOQUEIO_MS;

            resetarMovimentoCabeca();
            return;
        }

        alterarResultado(
            "Mão em F detectada. Movimente em direção à cabeça."
        );
    }

    // ==========================================
    // FEBRE
    // ==========================================

    function configuracaoFebre(maoAtiva, outraMao) {
        if (
            !maoAtiva ||
            !outraMao ||
            maoAtiva.length < 21 ||
            outraMao.length < 21
        ) {
            return false;
        }

        const tamanhoPalmaAtiva =
            distancia(
                maoAtiva[0],
                maoAtiva[9]
            );

        const tamanhoPalmaOutra =
            distancia(
                outraMao[0],
                outraMao[9]
            );

        if (
            tamanhoPalmaAtiva === 0 ||
            tamanhoPalmaOutra === 0
        ) {
            return false;
        }

        /*
            Mão ativa:
            4 = ponta do polegar
            8 = ponta do indicador

            Outra mão:
            0 = pulso
        */

        const pontaPolegar =
            maoAtiva[4];

        const pontaIndicador =
            maoAtiva[8];

        const pulsoOutraMao =
            outraMao[0];

        const centroPolegarIndicador =
            pontoMedio(
                pontaPolegar,
                pontaIndicador
            );

        /*
            Normalizamos usando o tamanho da mão.

            Assim a pessoa pode estar mais perto ou
            mais longe da câmera.
        */

        const distanciaCentroPulso =
            distancia(
                centroPolegarIndicador,
                pulsoOutraMao
            ) /
            tamanhoPalmaOutra;

        const distanciaPolegarPulso =
            distancia(
                pontaPolegar,
                pulsoOutraMao
            ) /
            tamanhoPalmaOutra;

        const distanciaIndicadorPulso =
            distancia(
                pontaIndicador,
                pulsoOutraMao
            ) /
            tamanhoPalmaOutra;

        const aberturaPolegarIndicador =
            distancia(
                pontaPolegar,
                pontaIndicador
            ) /
            tamanhoPalmaAtiva;

        /*
            Para considerar "Febre":

            - o centro entre indicador e polegar
              precisa estar perto do outro pulso;

            - polegar e indicador precisam estar
              próximos do pulso;

            - indicador e polegar não podem estar
              absurdamente abertos.
        */

        return (
            distanciaCentroPulso <=
                DISTANCIA_CENTRO_PULSO_MAX &&

            distanciaPolegarPulso <=
                DISTANCIA_DEDO_PULSO_MAX &&

            distanciaIndicadorPulso <=
                DISTANCIA_DEDO_PULSO_MAX &&

            aberturaPolegarIndicador <=
                ABERTURA_POLEGAR_INDICADOR_MAX
        );
    }

    function analisarFebre(deteccao, agora) {
        const maoEsquerda =
            deteccao.leftHandLandmarks?.[0];

        const maoDireita =
            deteccao.rightHandLandmarks?.[0];

        /*
            Para esta primeira versão,
            exigimos que as duas mãos estejam detectadas.
        */

        if (!maoEsquerda || !maoDireita) {
            inicioConfirmacaoFebre = 0;
            return false;
        }

        /*
            Testamos as duas possibilidades:

            direita envolvendo pulso esquerdo

            OU

            esquerda envolvendo pulso direito.
        */

        const direitaNoPulsoEsquerdo =
            configuracaoFebre(
                maoDireita,
                maoEsquerda
            );

        const esquerdaNoPulsoDireito =
            configuracaoFebre(
                maoEsquerda,
                maoDireita
            );

        const febreDetectada =
            direitaNoPulsoEsquerdo ||
            esquerdaNoPulsoDireito;

        if (!febreDetectada) {
            inicioConfirmacaoFebre = 0;
            return false;
        }

        /*
            Se encontramos a configuração de febre,
            não deixamos a lógica da dor de cabeça
            tentar reconhecer o mesmo frame.
        */

        resetarMovimentoCabeca();

        if (inicioConfirmacaoFebre === 0) {
            inicioConfirmacaoFebre = agora;

            alterarResultado(
                "Possível sinal de febre. Mantenha a mão envolvendo o pulso."
            );

            return true;
        }

        const tempoDecorrido =
            agora -
            inicioConfirmacaoFebre;

        const restante =
            Math.max(
                0,
                (
                    TEMPO_CONFIRMACAO_FEBRE_MS -
                    tempoDecorrido
                ) / 1000
            );

        if (
            tempoDecorrido <
            TEMPO_CONFIRMACAO_FEBRE_MS
        ) {
            alterarResultado(
                `A confirmar febre: ${restante.toFixed(1)}s`
            );

            return true;
        }

        adicionarSintoma("Febre");

        alterarResultado(
            "Sintoma reconhecido: Febre!"
        );

        bloqueadoAte =
            agora +
            TEMPO_BLOQUEIO_MS;

        inicioConfirmacaoFebre = 0;

        return true;
    }

    function analisarSinais(deteccao, agora) {
        if (agora < bloqueadoAte) {
            return;
        }

        /*
            Febre tem prioridade porque utiliza
            as duas mãos próximas uma da outra.
        */

        if (analisarFebre(deteccao, agora)) {
            return;
        }

        analisarDorDeCabeca(
            deteccao,
            agora
        );
    }

    // ==========================================
    // DESENHAR MÃO
    // ==========================================

    function desenharMao(landmarks) {
        canvasCtx.lineWidth = 2;

        CONEXOES_MAO.forEach(conexao => {
            const pontoA =
                landmarks[conexao[0]];

            const pontoB =
                landmarks[conexao[1]];

            const ax =
                (1 - pontoA.x) *
                canvasElement.width;

            const ay =
                pontoA.y *
                canvasElement.height;

            const bx =
                (1 - pontoB.x) *
                canvasElement.width;

            const by =
                pontoB.y *
                canvasElement.height;

            canvasCtx.beginPath();
            canvasCtx.moveTo(ax, ay);
            canvasCtx.lineTo(bx, by);
            canvasCtx.strokeStyle = "#00ff88";
            canvasCtx.stroke();
        });

        landmarks.forEach(ponto => {
            const x =
                (1 - ponto.x) *
                canvasElement.width;

            const y =
                ponto.y *
                canvasElement.height;

            canvasCtx.beginPath();

            canvasCtx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            canvasCtx.fillStyle = "#ffffff";
            canvasCtx.fill();
        });
    }

    // ==========================================
    // DESENHAR REGIÃO DA CABEÇA
    // ==========================================

    function desenharCaixaCabeca(caixa) {
        const x =
            (1 - caixa.maxX) *
            canvasElement.width;

        const y =
            caixa.minY *
            canvasElement.height;

        const largura =
            (
                caixa.maxX -
                caixa.minX
            ) *
            canvasElement.width;

        const altura =
            (
                caixa.maxY -
                caixa.minY
            ) *
            canvasElement.height;

        canvasCtx.strokeStyle = "#00aaff";
        canvasCtx.lineWidth = 2;

        canvasCtx.strokeRect(
            x,
            y,
            largura,
            altura
        );
    }

    // ==========================================
    // MARCAR OS PULSOS
    // ==========================================

    function desenharMarcadorPulso(landmarks) {
        const pulso =
            landmarks?.[0];

        if (!pulso) {
            return;
        }

        const x =
            (1 - pulso.x) *
            canvasElement.width;

        const y =
            pulso.y *
            canvasElement.height;

        canvasCtx.beginPath();

        canvasCtx.arc(
            x,
            y,
            9,
            0,
            Math.PI * 2
        );

        canvasCtx.strokeStyle = "#ffd400";
        canvasCtx.lineWidth = 3;
        canvasCtx.stroke();
    }

    // ==========================================
    // DESENHAR DETECÇÕES
    // ==========================================

    function desenharDeteccoes(deteccao) {
        if (!deteccao) {
            return;
        }

        const maos = [
            ...(deteccao.leftHandLandmarks || []),
            ...(deteccao.rightHandLandmarks || [])
        ];

        maos.forEach(mao => {
            desenharMao(mao);

            /*
                Círculo amarelo no pulso.

                Isso vai ajudar bastante a calibrar
                o reconhecimento da febre.
            */

            desenharMarcadorPulso(mao);
        });

        const rosto =
            deteccao.faceLandmarks?.[0];

        if (rosto) {
            const caixaRosto =
                obterCaixaRosto(rosto);

            const caixaCabeca =
                expandirCaixaCabeca(
                    caixaRosto
                );

            desenharCaixaCabeca(
                caixaCabeca
            );
        }
    }

    // ==========================================
    // PROCESSAR FRAME DO MEDIAPIPE
    // ==========================================

    function processarMediaPipe(agora) {
        if (!holisticLandmarker) {
            return;
        }

        const deteccao =
            holisticLandmarker.detectForVideo(
                videoElement,
                agora
            );

        ultimoResultadoMediaPipe =
            deteccao;

        analisarSinais(
            deteccao,
            agora
        );
    }

    // ==========================================
    // LOOP DA CÂMERA
    // ==========================================

    function loopMediaPipe() {
        if (
            !videoElement ||
            videoElement.readyState < 2
        ) {
            window.requestAnimationFrame(
                loopMediaPipe
            );

            return;
        }

        canvasCtx.clearRect(
            0,
            0,
            canvasElement.width,
            canvasElement.height
        );

        canvasCtx.save();

        canvasCtx.translate(
            canvasElement.width,
            0
        );

        canvasCtx.scale(
            -1,
            1
        );

        canvasCtx.drawImage(
            videoElement,
            0,
            0,
            canvasElement.width,
            canvasElement.height
        );

        canvasCtx.restore();

        const agora =
            performance.now();

        if (
            agora -
            ultimoTempoProcessamento >=
            INTERVALO_PROCESSAMENTO_MS
        ) {
            ultimoTempoProcessamento =
                agora;

            processarMediaPipe(
                agora
            );
        }

        desenharDeteccoes(
            ultimoResultadoMediaPipe
        );

        window.requestAnimationFrame(
            loopMediaPipe
        );
    }

    // ==========================================
    // INICIAR MEDIAPIPE
    // ==========================================

    async function iniciarMediaPipe() {
        try {
            alterarResultado(
                "A carregar MediaPipe..."
            );

            const {
                FilesetResolver,
                HolisticLandmarker
            } = await import(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm"
            );

            const vision =
                await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
                );

            holisticLandmarker =
                await HolisticLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task"
                        },

                        runningMode: "VIDEO",

                        minFaceDetectionConfidence: 0.6,
                        minFacePresenceConfidence: 0.6,
                        minPoseDetectionConfidence: 0.5,
                        minPosePresenceConfidence: 0.5,
                        minHandLandmarksConfidence: 0.6
                    }
                );

            videoElement =
                document.createElement(
                    "video"
                );

            videoElement.autoplay = true;
            videoElement.muted = true;
            videoElement.playsInline = true;

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: {
                            ideal: 640
                        },

                        height: {
                            ideal: 480
                        },

                        facingMode: "user"
                    },

                    audio: false
                });

            videoElement.srcObject =
                stream;

            await videoElement.play();

            canvasElement.width =
                640;

            canvasElement.height =
                480;

            alterarResultado(
                "MediaPipe ativo. Faça o sinal de dor de cabeça ou febre."
            );

            window.requestAnimationFrame(
                loopMediaPipe
            );

        } catch (erro) {
            console.error(
                "Erro no MediaPipe:",
                erro
            );

            alterarResultado(
                "Falha ao iniciar o MediaPipe."
            );
        }
    }

    iniciarMediaPipe();

    // ==========================================
    // 3. ENVIO PARA O SUPABASE (MANTIDO INTACTO)
    // ==========================================

    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyZmpuem52ZnJvZmVkbm9leGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDUwMDgsImV4cCI6MjA5OTYyMTAwOH0.aYkwoAOjq9WzY8ZId4KvgxZbsBpCZPbUQU6oUjVLkBs";

    const functionUrl =
        "https://drfjnznvfrofednoexgq.supabase.co/functions/v1/triagem_manchester";

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

            const partes =
                nome.split(" ");

            const regex =
                /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

            return partes.length >= 2 && regex.test(nome);
        }

        if (!validarNome(nomeInput.value)) {
            criarErro(
                nomeInput,
                "Digite nome e sobrenome válido."
            );

            valido = false;
        }

        if (
            !dataInput.value ||
            dataInput.value.length < 10
        ) {
            criarErro(
                dataInput,
                "Informe a data de nascimento completa."
            );

            valido = false;
        }

        if (
            sintomasInput.value.trim() === ""
        ) {
            criarErro(
                sintomasInput,
                "Descreva os sintomas."
            );

            valido = false;
        }

        if (valido) {
            const urlParams =
                new URLSearchParams(
                    window.location.search
                );

            const tipoFila =
                urlParams.get("tipo") || "G";

            const partesData =
                dataInput.value.split("/");

            const dataFormatadaBanco =
                `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            const dadosPaciente = {
                nome: nomeInput.value,
                dataNasc: dataFormatadaBanco,
                sintomas: sintomasInput.value,
                tipo: tipoFila
            };

            const textoOriginalBotao =
                btnFinalizar.innerText;

            btnFinalizar.innerText =
                "A enviar...";

            btnFinalizar.disabled =
                true;

            try {
                const response =
                    await fetch(
                        functionUrl,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${supabaseAnonKey}`
                            },

                            body:
                                JSON.stringify(
                                    dadosPaciente
                                )
                        }
                    );

                if (response.ok) {
                    const resultado =
                        await response.json();

                    window.location.href =
                        `Finalizado.html?id=${resultado.id}`;

                } else {
                    const erroDoServidor =
                        await response.text();

                    alert(
                        "Erro do servidor: " +
                        erroDoServidor
                    );

                    btnFinalizar.innerText =
                        textoOriginalBotao;

                    btnFinalizar.disabled =
                        false;
                }

            } catch (error) {
                console.error(
                    "Erro:",
                    error
                );

                alert(
                    "Erro de conexão com o servidor."
                );

                btnFinalizar.innerText =
                    textoOriginalBotao;

                btnFinalizar.disabled =
                    false;
            }
        }
    });
});