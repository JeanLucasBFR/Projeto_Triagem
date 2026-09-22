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

    // ==========================================
    // 2. INTEGRAÇÃO DA IA (TEACHABLE MACHINE)
    // ==========================================
    const URL = "../models/"; // Caminho para a pasta onde os ficheiros da IA estão guardados
    let model, webcam, maxPredictions;
    
    // Variáveis de controlo
    const PERCENTAGEM_FLEXIVEL = 0.75; // Exige 75% de certeza
    const TEMPO_EXIGIDO_MS = 1500;     // O utente deve manter o sinal por 1.5 segundos
    
    // Controlo do "Lag Saudável" (Throttling de FPS da IA)
    const INTERVALO_PROCESSAMENTO_MS = 250; // Processa 4 vezes por segundo, estabilizando o gesto
    let ultimoTempoProcessamento = 0;

    let sintomaAtualEmAnalise = "";
    let inicioAnaliseSintoma = 0;
    let bloqueadoAte = 0; 

    function alterarResultado(texto) {
        if (resultado.textContent !== texto) {
            resultado.textContent = texto;
        }
    }

    function adicionarSintoma(sintomaDetectado) {
        const sintomasAtuais = sintomasInput.value.trim();
        const sintomaFormatado = sintomaDetectado.charAt(0).toUpperCase() + sintomaDetectado.slice(1).toLowerCase();

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

    async function iniciarModeloVisual() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        try {
            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();

            const flip = true;
            webcam = new tmImage.Webcam(640, 480, flip);
            await webcam.setup();
            await webcam.play();
            
            canvasElement.width = 640;
            canvasElement.height = 480;

            window.requestAnimationFrame(loopProcessamento);
            alterarResultado("IA Ativa. A aguardar sinais...");

        } catch (erro) {
            console.error("Erro na IA:", erro);
            alterarResultado("Falha ao carregar a Inteligência Artificial.");
        }
    }

    async function loopProcessamento() {
        webcam.update(); // Mantém o vídeo fluido na tela
        
        canvasCtx.drawImage(webcam.canvas, 0, 0, canvasElement.width, canvasElement.height);
        
        const agora = performance.now();
        
        // Aplica o intervalo de "lag controlado" para dar estabilidade ao dedo indicador
        if (agora - ultimoTempoProcessamento >= INTERVALO_PROCESSAMENTO_MS) {
            ultimoTempoProcessamento = agora;
            await preverSinal();
        }

        window.requestAnimationFrame(loopProcessamento);
    }

    async function preverSinal() {
        const agora = performance.now();
        
        if (agora < bloqueadoAte) return;

        const prediction = await model.predict(webcam.canvas);

        let melhorClasse = "";
        let maiorCerteza = 0;

        for (let i = 0; i < maxPredictions; i++) {
            if (prediction[i].probability > maiorCerteza) {
                maiorCerteza = prediction[i].probability;
                melhorClasse = prediction[i].className;
            }
        }

        if (maiorCerteza >= PERCENTAGEM_FLEXIVEL && melhorClasse.toLowerCase() !== "neutro") {
            
            if (sintomaAtualEmAnalise !== melhorClasse) {
                sintomaAtualEmAnalise = melhorClasse;
                inicioAnaliseSintoma = agora;
                alterarResultado(`A reconhecer: ${melhorClasse}... Mantenha.`);
            } 
            else {
                const tempoDecorrido = agora - inicioAnaliseSintoma;
                
                const progressoSegundos = ((TEMPO_EXIGIDO_MS - tempoDecorrido) / 1000).toFixed(1);
                if (progressoSegundos > 0) {
                    alterarResultado(`A confirmar ${melhorClasse}: ${progressoSegundos}s`);
                }

                if (tempoDecorrido >= TEMPO_EXIGIDO_MS) {
                    adicionarSintoma(melhorClasse);
                    alterarResultado(`Sintoma inserido: ${melhorClasse}!`);
                    
                    bloqueadoAte = performance.now() + 3000; 
                    sintomaAtualEmAnalise = "";
                }
            }
        } else {
            if (sintomaAtualEmAnalise !== "") {
                if (!window.tempoUltimaVezVisto) window.tempoUltimaVezVisto = agora;
                
                if (agora - window.tempoUltimaVezVisto > 400) {
                    sintomaAtualEmAnalise = "";
                    window.tempoUltimaVezVisto = null;
                    alterarResultado("A aguardar sinais...");
                }
            } else {
                alterarResultado("A aguardar sinais...");
            }
        }
    }

    iniciarModeloVisual();

    // ==========================================
    // 3. ENVIO PARA O SUPABASE (MANTIDO INTACTO)
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
            criarErro(sintomasInput, "Descreva os sintomas.");
            valido = false;
        }

        if (valido) {
            const urlParams = new URLSearchParams(window.location.search);
            const tipoFila = urlParams.get("tipo") || "G";

            const partesData = dataInput.value.split("/");
            const dataFormatadaBanco = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            const dadosPaciente = {
                nome: nomeInput.value,
                dataNasc: dataFormatadaBanco,
                sintomas: sintomasInput.value,
                tipo: tipoFila
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