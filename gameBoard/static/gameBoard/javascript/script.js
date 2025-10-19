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
    } else if (type == 'accusation') {
        relayAccusationResult(data);
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

function relayAccusationResult(accusation) {

    playerId = getCookie('playerId');
    sender = accusation['sender'];
    win = accusation['win'];

    if (win) {
        if (playerId != sender) {
            alert(`Player: ${playerId}\n Won the game!`);
        } else {
            alert('You won the game!');
        }
    } else {
        if (playerId != sender) {
            alert(`Player: ${playerId}\n Lost the game.`);
        } else {
            alert("You lost the game.")
        }
    }
}

function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        cookie = cookie.trim();
        splitCookie = cookie.split('=');
        
        if (splitCookie[0].trim() == name) {
            return splitCookie[1].trim();
        }
    }
    return null;
}