let visibility = "Público"; // Inicializa como público
let recipient = "Todos"; // Inicializa com o destinatário "Todos"
let userName = ""; // Nome do usuário
let isSending = false; // Variável para verificar se está enviando

// Alterna a sidebar
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const navbar = document.getElementById("navbar");
    const bottomBar = document.getElementById("bottom-bar");

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active"); // Ativa/desativa o overlay

    // Aplica ou remove o desfoque
    if (sidebar.classList.contains("active")) {
        navbar.classList.add("blur");
        bottomBar.classList.add("blur");
    } else {
        navbar.classList.remove("blur");
        bottomBar.classList.remove("blur");
    }
}

// Fechar a sidebar ao clicar no overlay
document.getElementById("overlay").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");

    // Remove o desfoque ao fechar
    document.getElementById("navbar").classList.remove("blur");
    document.getElementById("bottom-bar").classList.remove("blur");
});

// Atualiza o destinatário
function updateRecipient() {
    const contactRadio = document.querySelector('input[name="contact"]:checked');
    if (contactRadio) {
        recipient = contactRadio.value;
    }
    updateMessageStatus();
}

// Atualiza a visibilidade
function updateVisibility() {
    const publicOption = document.querySelector('input[name="visibility"][value="public"]');
    visibility = publicOption.checked ? "Público" : "Privado";
    updateMessageStatus();

    // Atualiza o texto de visibilidade na interface
    const visibilityLabel = document.getElementById("visibility-label");
    visibilityLabel.textContent = `Visibilidade: ${visibility}`;
}

// Atualiza o status na parte inferior
function updateMessageStatus() {
    const input = document.getElementById("message-input");
    input.placeholder = `Escreva aqui... Enviando para ${recipient} (${visibility})`;
}

// Busca a lista de participantes
function fetchParticipants() {
    fetch("https://mock-api.driven.com.br/api/v6/uol/participants/d466a4bb-957e-4e20-832e-2a6f5a50c69b")
        .then((response) => response.json())
        .then((participants) => {
            const contactsDiv = document.querySelector(".contacts");
            contactsDiv.innerHTML = ""; // Limpa a lista anterior

            // Adiciona opção "Todos"
            const allOption = document.createElement("label");
            allOption.innerHTML = `
                <input type="radio" name="contact" value="Todos" checked>
                <ion-icon name="people-outline" class="icon-left"></ion-icon> Todos
            `;
            contactsDiv.appendChild(allOption);

            // Adiciona participantes dinamicamente
            participants.forEach((participant) => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="radio" name="contact" value="${participant.name}">
                    <ion-icon name="person-outline" class="icon-left"></ion-icon> ${participant.name}
                `;
                contactsDiv.appendChild(label);
            });

            // Adiciona evento de mudança de destinatário
            document.querySelectorAll('input[name="contact"]').forEach((radio) => {
                radio.addEventListener("change", updateRecipient);
            });
        })
        .catch((error) => console.error("Erro ao buscar participantes:", error));
}

// Função para enviar mensagens
function sendMessage() {
    if (isSending) return; // Impede múltiplos envios
    isSending = true; // Marca que está enviando a mensagem

    const messageInput = document.getElementById("message-input");
    const messageText = messageInput.value;

    if (!messageText.trim()) {
        alert("A mensagem não pode estar vazia.");
        isSending = false;
        return;
    }

    const type = visibility === "Privado" ? "private_message" : "message";

    const messageData = {
        from: userName,
        to: recipient,
        text: messageText,
        type: type,
    };

    fetch("https://mock-api.driven.com.br/api/v6/uol/messages/d466a4bb-957e-4e20-832e-2a6f5a50c69b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
    })
        .then((response) => {
            if (response.ok) {
                // Se for privado, adiciona cor de fundo
                const messageColor = visibility === "Privado" ? "rgba(220, 220, 220, 1)" : "";
                addChatLog(`${userName} para ${recipient}: ${messageText}`, messageColor);
                messageInput.value = "";
            } else {
                console.error("Erro ao enviar mensagem.");
            }
        })
        .catch((error) => console.error("Erro ao enviar mensagem:", error))
        .finally(() => {
            isSending = false; // Marca que terminou o envio
        });
}

// Adiciona mensagens ao log do chat
function addChatLog(message, color) {
    const chatLog = document.getElementById("chat-log");
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = "chat-entry";
    entry.textContent = `(${timestamp}) ${message}`;
    
    // Se houver cor, aplica ao fundo da mensagem
    if (color) {
        entry.style.backgroundColor = color;
    }

    chatLog.appendChild(entry);
    chatLog.scrollTop = chatLog.scrollHeight; // Rolagem automática
}

// Função para adicionar mensagens de "status" ou "entrada" e "saída"
function addParticipantEntry(name) {
    addChatLog(`${name} entrou no chat`, "rgba(220, 220, 220, 1)"); // Cor de fundo para "entrou"
}

// Função para adicionar mensagens de "status" ou "entrada" e "saída"
function addParticipantExit(name) {
    addChatLog(`${name} saiu do chat`, "rgba(220, 220, 220, 1)"); // Cor de fundo para "saiu"
}

// Função para buscar e exibir mensagens
function fetchMessages() {
    fetch("https://mock-api.driven.com.br/api/v6/uol/messages/d466a4bb-957e-4e20-832e-2a6f5a50c69b")
        .then((response) => response.json())
        .then((messages) => {
            const chatLog = document.getElementById("chat-log");
            chatLog.innerHTML = ""; // Limpa o log do chat

            // Processa cada mensagem recebida
            messages.forEach((message) => {
                const entry = document.createElement("div");
                entry.className = "chat-entry";

                // Monta a mensagem baseada no tipo
                if (message.type === "status") {
                    entry.textContent = `(${message.time}) ${message.from} ${message.text}`;
                    entry.style.backgroundColor = "rgba(220, 220, 220, 1)"; // Cor de fundo para status
                } else if (message.type === "message") {
                    entry.textContent = `(${message.time}) ${message.from} para ${message.to}: ${message.text}`;
                    // Mensagem pública sem cor de fundo
                    entry.style.backgroundColor = ""; 
                } else if (
                    message.type === "private_message" &&
                    (message.to === userName || message.from === userName)
                ) {
                    entry.textContent = `(${message.time}) ${message.from} (reservadamente) para ${message.to}: ${message.text}`;
                    entry.style.fontStyle = "italic"; // Destaque para mensagens privadas
                    entry.style.backgroundColor = "rgba(220, 220, 220, 1)"; // Mensagem privada
                }

                chatLog.appendChild(entry); // Adiciona a mensagem ao chat
            });

            // Rolagem automática para a última mensagem
            chatLog.scrollTop = chatLog.scrollHeight;
        })
        .catch((error) => {
            console.error("Erro ao buscar mensagens:", error);
        });
}

// Mantém conexão ativa
function keepConnectionAlive() {
    setInterval(() => {
        fetch("https://mock-api.driven.com.br/api/v6/uol/status/d466a4bb-957e-4e20-832e-2a6f5a50c69b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName }),
        }).catch((error) => console.error("Erro ao enviar status de conexão:", error));
    }, 5000);
}

// Pede o nome do usuário
function askUserName() {
    userName = prompt("Qual é o seu nome?");

    function trySendUserName() {
        fetch("https://mock-api.driven.com.br/api/v6/uol/participants/d466a4bb-957e-4e20-832e-2a6f5a50c69b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName }),
        })
            .then((response) => {
                if (response.ok) {
                    keepConnectionAlive();
                } else {
                    alert(`O nome "${userName}" já está em uso.`);
                    askUserName();
                }
            })
            .catch(() => askUserName());
    }

    trySendUserName();
}

// Configuração inicial
window.onload = () => {
    askUserName();
    fetchParticipants();
    setInterval(fetchParticipants, 10000);
    setInterval(fetchMessages, 3000);
};
