const pacientes = [
  { nome: "João Silva", senha: "A001", gravidade: "Grave" },
  { nome: "Maria Souza", senha: "B002", gravidade: "Média" },
  { nome: "Pedro Lima", senha: "C003", gravidade: "Leve" }
];

const lista = document.getElementById("lista");
const senhaAtual = document.getElementById("senhaAtual");

// renderiza tabela
function renderizar() {
  lista.innerHTML = "";

  pacientes.forEach((p, index) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.senha}</td>
      <td>${p.gravidade}</td>
      <td><button onclick="chamar(${index})">Chamar</button></td>
    `;

    lista.appendChild(linha);
  });
}

// botão chamar
function chamar(index) {
  const paciente = pacientes[index];

  // mostra na tela
  senhaAtual.innerText = paciente.senha;

  // remove da fila
  pacientes.splice(index, 1);

  renderizar();
}

// inicia
renderizar();