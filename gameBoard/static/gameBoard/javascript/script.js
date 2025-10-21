const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
let socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

const dealButton = document.getElementById('deal');
const renderButton = document.getElementById('render');

let playerNumber = getCookie('playerNumber');
let playerId = getCookie('playerId');
let playerCharacter = getCookie('playerCharacter').replace(/[""]/g, '');
let turnNumber = getCookie('turnNumber');
let gameStarted = getCookie('gameStarted') == 'true';
let hasMoved = getCookie('hasMoved') == 'true';
let currentRoomIsHallway = getCookie('currentRoomIsHallway') == 'true';
let currentRoom = getCookie('currentRoom');

if (playerNumber == 1 && !gameStarted) {
    dealButton.style.display = 'inline-block';
}

dealButton.addEventListener('click', async ()=> {
    try {

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

        dealButton.style.display = 'none';

    } catch (error) {
        console.error(error);
    }
})

renderButton.addEventListener('click', async ()=> {
    try {
        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const response = await fetch(`/game/getPositions/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        renderPositions(data)
    } catch (error) {
        console.error(error);
    }
    getValidMoves();
})


socket.onopen = async function(e) {
    console.log("Websocket connection established.");
    try {

        const response = await fetch(`/game/getPositions/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
     
        socket.send(JSON.stringify({
            'type': 'move',
            'message': data
        }));
       
    } catch (error) {
        console.error(error);
    }
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
        const who = data['sender_character']
        newMessage.textContent = `${who}: ${data['message']}`;
        newMessage.classList.add('messages');
        chatBox.appendChild(newMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        console.log("Received message");
    } else if (type == 'draw') {
        document.cookie = "gameStarted=true";
        getHand();
    } else if (type == 'suggestion') {
        if (playerNumber == data['matchedPlayerNumber']){
            promptForCard(data);
        }
    } else if (type == 'accusation') {
        relayAccusationResult(data);
    } else if (type == 'move') {
        renderPositions(data['message']);
        if (playerNumber == turnNumber) {
            currentRoom = data['message'][playerId]['position'];
            currentRoomIsHallway = currentRoom.includes('-');
            document.cookie = `currentRoomIsHallway=${currentRoomIsHallway}`;
            document.cookie = `currentRoom=${currentRoom}`;

            if (!hasMoved) {
                getValidMoves();
            } else if (!currentRoomIsHallway) {
                makeSuggestionButton.style.display = 'inline-block'
            }
        }
    } else if (type == 'suggestionResponse') {
        if (playerNumber == turnNumber) {
            const suggestionResponseDiv = document.createElement('div');
            suggestionResponseDiv.classList.add('showCard');

            const card = document.createElement('p');
            card.innerText = data['senderCharacter'] + " shows you " + data['message'];

            document.body.appendChild(suggestionResponseDiv);
            suggestionResponseDiv.appendChild(card);
        }
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

async function getPositions() {
    try {
        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const response = await fetch(`/game/getPositions/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        renderPositions(data)
    } catch (error) {
        console.error(error);
    }
}

async function getValidMoves() {
    try {
        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const response = await fetch(`/game/getValidMoves/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        renderValidMoves(data)
    } catch (error) {
        console.error(error);
    }
}

function renderPositions(positions) {
    document.querySelectorAll('.player-dot').forEach(dot => dot.remove());
    document.querySelectorAll(`[tag*="room"]`).forEach(element => {
        element.classList.remove('active-room');
        element.classList.remove('valid-move');
    });

    const playerColors = {
        'Miss Scarlet': '#d00000',
        'Colonel Mustard': '#e1ad01',
        'Mrs. White': '#5e5e5eff',
        'Mr. Green': '#006400',
        'Mrs. Peacock': '#0077b6',
        'Professor Plum': '#7b2cbf'
    };

    for (const [id, positionDict] of Object.entries(positions)) {
        roomTag = positionDict["position"]
        const roomElement = document.getElementById(roomTag);
        if (!roomElement) continue;

        const color = playerColors[positionDict["character"]] || '#000';

        // Create dot element
        const dot = document.createElement('div');
        dot.classList.add('player-dot');
        dot.style.backgroundColor = color;

        // Append to the room
        roomElement.appendChild(dot);
    }
}

const moveHandlersByRoom = new Map();

function makeMoveHandler(roomId) {
    return async function handleMoveForRoom(event) {
        try {
            const roomElement = event.currentTarget;
            const clickedRoomId = roomElement.id;

            const currentPath = window.location.pathname;
            const gameId = currentPath.substring(currentPath.lastIndexOf('/') + 1);

            const player = getCookie("playerId");

            const response = await fetch(`/game/movePlayer/${gameId}/${player}/${clickedRoomId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            document.cookie = "hasMoved=true";
            hasMoved = true;

            socket.send(JSON.stringify({
                'type': 'move',
                'message': data
            }));

            renderPositions(data);
            
        } catch (error) {
            console.error('handleMoveForRoom error for', roomId, error);
        }
    };
}

function renderValidMoves(roomsJSON) {
    const validList = roomsJSON["validRooms"] || [];

    clearValidMoves();

    for (let i = 0; i < validList.length; i++) {
        const id = validList[i];
        const roomElement = document.getElementById(id);
        if (!roomElement) continue;

        roomElement.classList.add('valid-move');

        const handler = makeMoveHandler(id);
        moveHandlersByRoom.set(id, handler);

        roomElement.addEventListener('click', handler);
    }
}

function clearValidMoves() {
    for (const [roomId, handler] of moveHandlersByRoom.entries()) {
        const el = document.getElementById(roomId);
        if (el) {
            el.classList.remove('valid-move');
            el.removeEventListener('click', handler);
        }
    }
    moveHandlersByRoom.clear();
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

function promptForCard(suggestionData) {
    //TODO: Actual logic for showing a card if you have a match
    playerId = getCookie('playerId');
    sender = suggestionData['sender']
    if (playerId != sender) {
        suggestion = suggestionData['message'];
        // alert(suggestion['message'].room + " " + suggestion['message'].weapon + " " + suggestion['message'].character);
        matches = [];
        cards = document.getElementsByClassName('card');
        const showCardDiv = document.createElement('div');
        showCardDiv.classList.add('showCard');
        document.body.appendChild(showCardDiv);
        for (let card of cards) {
            if (card.innerHTML.trim() == suggestion.room.trim() || card.innerHTML.trim() == suggestion.weapon.trim() || card.innerHTML.trim() == suggestion.character.trim()) {
                const matchedCardDiv = document.createElement('div');
                const matchedCard = document.createElement('p');
                const showCardButton = document.createElement('button');
                matchedCard.innerHTML = card.innerHTML.trim();
                showCardButton.classList.add('showCardButton');
                showCardButton.innerHTML = "Show this card";
                matchedCardDiv.appendChild(matchedCard);
                matchedCardDiv.appendChild(showCardButton);
                showCardDiv.appendChild(matchedCardDiv);

                showCardButton.addEventListener("click", ()=> {
                    
                    socket.send(JSON.stringify({
                        'type': 'suggestionResponse',
                        'message': matchedCard.innerHTML,
                        'senderCharacter': playerCharacter
                    }));
                })
            }
        }
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
    const cookies = document.cookie.split('; ')
    .map(c => c.split('='))
    .map(([key, value]) => [key, decodeURIComponent(value)]);

    const match = cookies.find(([key]) => key === name);
    return match ? match[1] : null;
}
