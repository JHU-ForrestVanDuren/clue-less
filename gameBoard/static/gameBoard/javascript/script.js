const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
let socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

const dealButton = document.getElementById('deal');

dealButton.addEventListener('click', async ()=> {
    try {

        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const response = await fetch(`/game/deal/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Cards added to players');

        socket.send(JSON.stringify({
            'type': 'draw'
        }));

    } catch (error) {
        console.error(error);
    }
})

socket.onopen = function(e) {
    console.log("Websocket connection established.");
};

socket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const type = data['type'];

    if (type == 'chat') {
    
        let noHistory = document.getElementById('noHistory');
        
        if (noHistory != null) {
            noHistory.remove();
        }

        
        const chatBox = document.getElementById('messagesBox');
        const newMessage = document.createElement("p");
        newMessage.textContent = data['message'];
        newMessage.classList.add('messages');
        chatBox.appendChild(newMessage);
        console.log("Received message");
    } else if (type == 'draw') {
        getHand();
    } else if (type == 'suggestion') {
        promptForCard(data);
    }

}

socket.onclose = function(e) {
    console.log("Websocket connection closed");
}

async function getHand() {
    try {

        const response = await fetch(`/game/getHand`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        addHandToPlayer(data.hand)

        console.log('Cards delt');

    } catch (error) {
        console.error(error);
    } 
}

function addHandToPlayer(hand) {

    handDiv = document.getElementById('handPopup');
    for (card of hand) {
        const cardP = document.createElement("p");
        cardP.textContent = card;
        cardP.classList.add('card');
        handDiv.appendChild(cardP);
    }


}

function promptForCard(suggestion) {
    //TODO: Actual logic for showing a card if you have a match
    playerId = getCookie('playerId');
    sender = suggestion['sender']
    if (playerId != sender) {
        alert(suggestion['message'].room + " " + suggestion['message'].weapon + " " + suggestion['message'].character);
    }
    
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}