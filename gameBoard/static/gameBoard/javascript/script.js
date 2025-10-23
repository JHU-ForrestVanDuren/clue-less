const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
const socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

const dealButton = document.getElementById('deal');
const renderButton = document.getElementById('render');
const boardAndChat = document.getElementById('boardAndChat');
const gameNotificationsDiv = document.getElementById('gameNotifications');

let playerNumber = getCookie('playerNumber');
let playerId = getCookie('playerId');
let playerCharacter = getCookie('playerCharacter').replace(/[""]/g, '');
let turnNumber = getCookie('turnNumber');
let gameStarted = getCookie('gameStarted') == 'true';
let hasMoved = getCookie('hasMoved') == 'true';
let currentRoomIsHallway = getCookie('currentRoomIsHallway') == 'true';
let currentRoom = getCookie('currentRoom');
let currentTurnPlayer = getCookie('currentTurnPlayer').replace(/[""]/g, '');
let yourTurnString = 'It\'s your turn. Click one of the highlited rooms to move.';

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
                gameNotificationsDiv.innerHTML = "";
                addToGameStateDisplay(yourTurnString);
            } else if (!currentRoomIsHallway) {
                let suggestionResponse = getCookie('suggestionResponse');
                let endOfTurn = getCookie('endOfTurn') == 'true';

                if (!endOfTurn) {
                    makeSuggestionButton.classList.remove('suggestDisabled');
                }
                
                if (suggestionResponse != null) {
                    if (suggestionResponse == 'none') {
                        gameNotificationsDiv.innerHTML = "";
                        addToGameStateDisplay('No match, Make an accusation or end your turn', 'End Turn').addEventListener("click", endTurnEvent);;
                    } else {
                        suggestionResponse = suggestionResponse.split(',');
                        gameNotificationsDiv.innerHTML = "";
                        addToGameStateDisplay(`${suggestionResponse[0]} shows you ${suggestionResponse[1]}`, 'End Turn').addEventListener("click", endTurnEvent);;
                    }
                } else {
                    gameNotificationsDiv.innerHTML = "";
                    const textDiv = document.createElement('div');
                    const text = document.createElement('p');
                    text.innerText = "Make a suggestion or accusation";
                    textDiv.appendChild(text);
                    gameNotificationsDiv.appendChild(textDiv);
                }
            } else {
                gameNotificationsDiv.innerHTML = "";
                addToGameStateDisplay("Make an accusation or end your turn", 'End Turn').addEventListener("click", endTurnEvent);;
            }
        } else {
            let suggestionMatches = getCookie('suggestionMatches');
            if (suggestionMatches != null) {
                suggestionMatches = suggestionMatches.split(',');
                
                gameNotificationsDiv.innerHTML = ""; 

                for (let i = 0; i < suggestionMatches.length -1; i++) {
                    addToGameStateDisplay(suggestionMatches[i], "Show this card").addEventListener("click", (event)=> {
                        showCardEvent(event, suggestionMatches[i]);
                    });                  
                }
            } else {
                gameNotificationsDiv.innerHTML = "";
                addToGameStateDisplay(`It's ${currentTurnPlayer}s turn`);
            }              
        }
    } else if (type == 'suggestionResponse') {
        if (playerNumber == turnNumber) {
            gameNotificationsDiv.innerHTML = "";
            addToGameStateDisplay(`${data['senderCharacter']} show you  ${data['message']}`, 'End Turn').addEventListener("click", endTurnEvent);;

            document.cookie = 'endOfTurn=true';
            document.cookie = `suggestionResponse=${data['senderCharacter']},${data['message']}`;
        }
    } else if (type == 'endTurn') {
        turnNumber = data['message'];
        document.cookie = `turnNumber=${turnNumber}`;
        currentTurnPlayer = data['currentTurnPlayer'];
        document.cookie = `currentTurnPlayer=${currentTurnPlayer}`;

        if (playerNumber == turnNumber) {
            accusationButton.style.opacity = "1";
            accusationButton.addEventListener("click", accusationButtonClickEvent);
            getValidMoves();
            gameNotificationsDiv.innerHTML = "";
            addToGameStateDisplay(yourTurnString);
        } else {
            accusationButton.style.opacity = ".5";
            accusationButton.removeEventListener("click", accusationButtonClickEvent);
            gameNotificationsDiv.innerHTML = "";
            addToGameStateDisplay(`It's ${currentTurnPlayer}s turn`);
        }
    }
}

socket.onclose = function(e) {
    console.log("Websocket connection closed");
}

function addToGameStateDisplay(text, buttonText) {
    const innerDiv = document.createElement('div');
    const textP = document.createElement('p');
    textP.innerText = text;
    innerDiv.appendChild(textP);
    gameNotificationsDiv.appendChild(innerDiv);

    if (buttonText != null) {
        const button = document.createElement('button');
        button.innerText = buttonText;
        innerDiv.appendChild(button);
        return button;
    }

    return null;
}

async function endTurnEvent() {
    try {
        console.log('end turn event');
        const response = await fetch(`endTurn/${gameId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        hasMoved = false;
        document.cookie = `hasMoved=${hasMoved}`;

        document.cookie = `endOfTurn=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = 'suggestionResponse=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

        socket.send(JSON.stringify({
            'type': 'endTurn',
            'message': data['turnNumber'],
            'currentTurnPlayer': data['currentTurnPlayer']
        }));

    } catch (error) {
        console.log(error);
    }
}

function showCardEvent(event, suggestion) {
    socket.send(JSON.stringify({
        'type': 'suggestionResponse',
        'message': suggestion,
        'senderCharacter': playerCharacter
    }));

    gameNotificationsDiv.innerHTML = "";
    addToGameStateDisplay(`It's ${currentTurnPlayer}s turn`);
    document.cookie = `suggestionMatches=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
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
    playerId = getCookie('playerId');
    sender = suggestionData['sender']
    if (playerId != sender) {
        suggestion = suggestionData['message'];
        cards = document.getElementsByClassName('card');

        gameNotificationsDiv.innerHTML = "";
        let matchesCookieValue = "";

        for (let card of cards) {
            if (card.innerHTML.trim() == suggestion.room.trim() || card.innerHTML.trim() == suggestion.weapon.trim() || card.innerHTML.trim() == suggestion.character.trim()) {
                addToGameStateDisplay(card.innerHTML.trim(), "Show this card").addEventListener("click", (event)=> {
                    showCardEvent(event, card.innerHTML.trim());
                });

                matchesCookieValue += `${card.innerHTML.trim()},`
            }
        }

        document.cookie = `suggestionMatches=${matchesCookieValue};`;
    }
    
}

function relayAccusationResult(accusation) {
    //TODO: Actual end of game logic
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
