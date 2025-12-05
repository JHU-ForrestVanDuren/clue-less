const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
const socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

const renderButton = document.getElementById('render');
const boardAndChat = document.getElementById('boardAndChat');
const gameNotificationsDiv = document.getElementById('gameNotifications');
const leaveGameButton = document.getElementById('leaveGameButton');

let playerNumber = getCookie('playerNumber');
let playerId = getCookie('playerId');
let playerCharacter = getCookie('playerCharacter').replace(/[""]/g, '');
let turnNumber = getCookie('turnNumber');
let gameStarted = getCookie('gameStarted') == 'True';
let hasMoved = getCookie('hasMoved') == 'true';
let currentRoomIsHallway = getCookie('currentRoomIsHallway') == 'true';
let currentRoom = getCookie('currentRoom');
let currentTurnPlayer = getCookie('currentTurnPlayer').replace(/[""]/g, '');
let hasVoted = getCookie('hasVoted') == 'true';
const yourTurnString = 'It\'s your turn. Click one of the highlited rooms to move.';
const youLostString = "You lost the game";
showCardTimer = null;

socket.onopen = function(e) {
    console.log("Websocket connection established.");
    getPositions().then((positions)=> {
        sendMoveMessage(gameStarted, positions);
    });

    notePadJson = JSON.parse(sessionStorage.getItem('notePad'));

    for (const key in notePadJson) {
        row = document.querySelectorAll(`[tag=${key}]`);

        for (const cell of row) {
            cell.checked = notePadJson[key][cell.className];
        }
    }

    sessionStorage.setItem('notePad', JSON.stringify(notePadJson));

    socket.send(JSON.stringify({
        'type': 'savePlayerId',
        'message': playerId
    }));
};

socket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    const type = data['type'];

    if (getCookie('playerId') == null) {
        return;
    }

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
        gameStarted = true;
        getHand();
        getPositions().then((positions)=> {
            sendMoveMessage(true, positions);
        });
    } else if (type == 'suggestion') {
        if (playerNumber == data['matchedPlayerNumber']){
            promptForCard(data);
        }
    } else if (type == 'accusation') {
        relayAccusationResult(data);
        clearValidMoves();
    } else if (type == 'move') {
        renderPositions(data['message']);

        if (!gameStarted) {
            gameNotificationsDiv.innerHTML = "";
            getVoteInformation().then(voteInformation=> {
                if (!hasVoted) {
                    addToGameStateDisplay(`Vote to start the game\n${voteInformation['votes']}/${voteInformation['players']} players have voted to start`, 'Vote').addEventListener("click", voteEvent);
                } else {
                    addToGameStateDisplay(`Waiting for other players to vote\n${voteInformation['votes']}/${voteInformation['players']} players have voted to start`);
                }
            });
            
            return;
        }

        if (playerNumber == turnNumber) {
            if (showCardTimer != null) {
                clearTimeout(showCardTimer);
                showCardTimer = null;
                showCardTimerP = document.getElementById('showCardTimer');
                showCardTimerP.remove();
            }

            currentRoom = data['message'][playerId]['position'];
            currentRoomIsHallway = currentRoom.includes('-');
            document.cookie = `currentRoomIsHallway=${currentRoomIsHallway}`;
            document.cookie = `currentRoom=${currentRoom}`;

            suggestionMatches = null;
            document.cookie = `suggestionMatches=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;

            gameNotificationsDiv.innerHTML = "";
            
            if (!hasMoved) {
                getValidMoves();
                addToGameStateDisplay(yourTurnString);
            } else if (!currentRoomIsHallway) {
                let suggestionResponse = getCookie('suggestionResponse');
                let endOfTurn = getCookie('endOfTurn') == 'true';

                if (!endOfTurn) {
                    makeSuggestionButton.classList.remove('suggestDisabled');
                }
                
                if (suggestionResponse != null) {
                    if (suggestionResponse == 'none') {
                        addToGameStateDisplay('No match, Make an accusation or end your turn', 'End Turn').addEventListener("click", endTurnEvent);
                    } else {
                        suggestionResponse = suggestionResponse.split(',');
                        addToGameStateDisplay(`${suggestionResponse[0]} shows you ${suggestionResponse[1]}`, 'End Turn').addEventListener("click", endTurnEvent);;
                    }
                } else {
                    addToGameStateDisplay("Make a suggestion or accusation");
                }
            } else {
                addToGameStateDisplay("Make an accusation or end your turn", 'End Turn').addEventListener("click", endTurnEvent);;
            }
        } else {
            let suggestionMatches = getCookie('suggestionMatches');
            gameNotificationsDiv.innerHTML = "";

            if (suggestionMatches != null) {
                suggestionMatches = suggestionMatches.split(',');

                counter = getCookie('timerCount') - 1;
                timerDiv = document.getElementById('timers');
                showCardTimerP = document.createElement('p');
                showCardTimerP.id = 'showCardTimer';
                showCardTimerP.innerHTML = `Show Card Timer: <span id="showCardTimerSpan">${counter}</span>`;
                timerDiv.appendChild(showCardTimerP);

                showCardTimer = setInterval(function() {
                    counter --;
                    document.cookie = `timerCount=${counter}`;
                    document.getElementById('showCardTimerSpan').innerText = counter;
                    if (counter <= 0) {
                        showCardTimerP = document.getElementById('showCardTimer');
                        showCardEvent(null, suggestionMatches[0]);
                    }
                }, 1000)

                for (let i = 0; i < suggestionMatches.length -1; i++) {
                    addToGameStateDisplay(suggestionMatches[i], "Show this card").addEventListener("click", (event)=> {
                        showCardEvent(event, suggestionMatches[i]);
                    });                  
                }
            } else {
                addToGameStateDisplay(`It's ${currentTurnPlayer}s turn`);
            }              
        }
    } else if (type == 'suggestionResponse') {
        if (playerNumber == turnNumber && data['senderCharacter'] != playerCharacter) {
            gameNotificationsDiv.innerHTML = "";
            addToGameStateDisplay(`${data['senderCharacter']} shows you  ${data['message']}`, 'End Turn').addEventListener("click", endTurnEvent);;

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
    } else if (type == 'updateTimer') {
        updateTimer(data['message']);

        if (playerNumber == turnNumber) {
            if (data['message'] == 0) {
                clearValidMoves();
                endTurnEvent();
            }
        }
    } else if (type == 'leaveGame') {
        console.log('leave game');
        leavingPlayerNumber = data['playerNumber'];

        if (data['turnNumber'] == 0) {
            gameNotificationsDiv.innerHTML = "";
            clearValidMoves();
            clearAllCookies();
            addToGameStateDisplay(`All other players have quit the game.`, "Return to lobby").addEventListener("click", ()=> {
                window.location.href = "";
            });
            return;
        }

        if (playerNumber != leavingPlayerNumber) {
            if (leavingPlayerNumber == turnNumber) {
                document.cookie = `suggestionMatches=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
                if (showCardTimer != null) {
                    clearTimeout(showCardTimer);
                    showCardTimer = null;
                    showCardTimerP = document.getElementById('showCardTimer');
                    showCardTimerP.remove(); 
                }
            }

            if (playerNumber > leavingPlayerNumber) {
                playerNumber --;
                document.cookie = `playerNumber=${playerNumber}`;
            }

            turnNumber = data['turnNumber'];
            currentTurnPlayer = data['currentPlayerCharacter'];
            document.cookie = `turnNumber=${turnNumber}; currentTurnPlayer=${currentTurnPlayer}`;

            getHand();
        }

        if (playerNumber == turnNumber) {
            accusationButton.style.opacity = "1";
            accusationButton.addEventListener("click", accusationButtonClickEvent);
        }
    }
}

socket.onclose = function(e) {
    console.log("Websocket connection closed");
}

async function sendMoveMessage(single, data) {
    if (single) {
        socket.send(JSON.stringify({
            'type': 'moveSingle',
            'message': data
        }));
    } else {
        socket.send(JSON.stringify({
            'type': 'move',
            'message': data
        }));            
    }       
}

function updateTimer(seconds) {
    minutes = Math.floor(seconds/60);
    seconds = seconds%60;
    minutesSpan = document.getElementById('timerMinutes');
    secondsSpan = document.getElementById('timerSeconds');
    minutesSpan.innerText = minutes;
    
    if (seconds < 10) {
        secondsSpan.innerText = `0${seconds}`;
    } else {
        secondsSpan.innerText = seconds;
    }
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

async function getVoteInformation() {
    try {
        const response = await fetch(`voteInformation/${gameId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.log(error);
    }  
}

async function voteEvent() {
    try {
        const response = await fetch(`vote/${gameId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        hasVoted = true;
        document.cookie = `hasVoted=${hasVoted}`;

        if (data['cardsDealt'] == true) {
            socket.send(JSON.stringify({
                'type': 'draw'
            }));
        } else {
            getPositions().then((positions)=> {
                sendMoveMessage(false, positions);
            });
        }
    } catch (error) {
        console.log(error);
    }   
}

async function endTurnEvent() {
    try {
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

    clearTimeout(showCardTimer);
    showCardTimer = null;
    showCardTimerP = document.getElementById('showCardTimer');
    showCardTimerP.remove();

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

        return data;
    } catch (error) {
        console.error(error);
        return null;
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
    document.querySelectorAll('.playerInHallway').forEach(character => character.remove());
    document.querySelectorAll('.playerInRoom').forEach(character => character.remove());
    document.querySelectorAll(`[tag*="room"]`).forEach(element => {
        element.classList.remove('active-room');
        element.classList.remove('valid-move');
    });

    const playerPictures = {
        'Miss Scarlet': 'miss_scarlet.png',
        'Colonel Mustard': 'colonel_mustard.png',
        'Mrs. White': 'mrs_white.png',
        'Mr. Green': 'mr_green.png',
        'Mrs. Peacock': 'mrs_peacock.png',
        'Professor Plum': 'prof_plum.png'
    };

    for (const [id, positionDict] of Object.entries(positions)) {
        roomTag = positionDict["position"]
        const roomElement = document.getElementById(roomTag);
        if (!roomElement) continue;

        const playerPicture = playerPictures[positionDict["character"]] || '#000';

        // Create dot element
        const playerDiv = document.createElement('div');

        if (roomElement.id.includes('-')) {
            playerDiv.classList.add('playerInHallway');
        } else {
            playerDiv.classList.add('playerInRoom');
        }
        
        // dot.style.backgroundColor = color;
        playerDiv.style.backgroundImage = `url('/static/gameBoard/images/${playerPicture}')`;
        playerDiv.style.backgroundSize = "cover";
        playerDiv.style.backgroundRepeat = "no-repeat";

        // Append to the room
        roomElement.appendChild(playerDiv);
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

            sendMoveMessage(false, data);
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
    handDiv.innerHTML = "";
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
        let suggestionMatches = getCookie('suggestionMatches');
        suggestionMatches = suggestionMatches.split(',');

        counter = 30

        timerDiv = document.getElementById('timers');
        showCardTimerP = document.createElement('p');
        showCardTimerP.id = 'showCardTimer';
        showCardTimerP.innerHTML = 'Show Card Timer: <span id="showCardTimerSpan">30</span>';
        timerDiv.appendChild(showCardTimerP);

        showCardTimer = setInterval(function() {
            counter --;
            document.cookie = `timerCount=${counter}`;
            document.getElementById('showCardTimerSpan').innerText = counter;
            if (counter == 0) {
                showCardTimerP = document.getElementById('showCardTimer');
                showCardEvent(null, suggestionMatches[0]);
            }
        }, 1000)
    }
    
}

function clearAllCookies() {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const equalIndex = cookie.indexOf('=');
        const name = equalIndex > -1 ? cookie.substr(0, equalIndex) : cookie;
        document.cookie = name.trim() + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    }

    document.cookie = 'playerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
}

function relayAccusationResult(accusation) {
    playerId = getCookie('playerId');
    sender = accusation['sender'];
    win = accusation['win'];
    guess = accusation['guess'];
    gameNotificationsDiv.innerHTML = "";

    if (win) {
        clearAllCookies();

        if (playerId != sender) {
            addToGameStateDisplay(`${currentTurnPlayer}\n Made an accusation of ${guess["character"]} in the ${guess["room"]} with the ${guess["weapon"]} and won the game!`, "Return to lobby").addEventListener("click", ()=> {
                window.location.href = "";
            });
        } else {
            addToGameStateDisplay("You won the game!", "Return to lobby").addEventListener("click", ()=> {
                window.location.href = "";
            });
        }
    } else {
        if (accusation['defaultWinner'] != null) {
            clearAllCookies();
            if (playerId != sender) {
                addToGameStateDisplay(`${currentTurnPlayer}\n Made an accusation of\n${guess["character"]} in the ${guess["room"]} with the ${guess["weapon"]} and lost the game.\n${accusation['defaultWinner']} wins by default`, "Return to lobby").addEventListener("click", ()=> {
                    window.location.href = "";
                });
            } else {
                endGameButton = addToGameStateDisplay(youLostString + `\n${accusation['defaultWinner']} wins by default`, "Return to lobby").addEventListener("click", ()=> {
                    window.location.href = "";
                });
            }
        } else {
            if (playerId != sender) {
                addToGameStateDisplay(`${currentTurnPlayer}\n Made an accusation of ${guess["character"]} in the ${guess["room"]} with the ${guess["weapon"]} and lost the game.`);
            } else {
                endGameButton = addToGameStateDisplay(youLostString, "End Turn").addEventListener('click', endTurnEvent);
            }
        }
    }
}

leaveGameButton.addEventListener('click', async ()=> {
    try {
        const response = await fetch(`/game/leaveGame/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        socket.send(JSON.stringify({
            'type': 'leaveGame',
            'playerNumber': playerNumber,
            "turnNumber": data['turnNumber'],
            "currentPlayerCharacter": data['currentPlayerCharacter'],
            "cardsToAdd": data['cardsToAdd']
        }));

        getPositions().then((positions)=> {
            sendMoveMessage(false, positions);
            clearAllCookies();
            window.location.href = `${window.location.protocol}//${window.location.host}`;
        });
    } catch (error) {
        console.error(error);
    }    
})

function getCookie(name) {
    const cookies = document.cookie.split('; ')
    .map(c => c.split('='))
    .map(([key, value]) => [key, decodeURIComponent(value)]);

    const match = cookies.find(([key]) => key === name);
    return match ? match[1] : null;
}
