const makeSuggestionButton = document.getElementById('suggest');
const makeAccusationButton = document.getElementById('accuse');

makeSuggestionButton.addEventListener("click", async ()=>{
    const room = getCookie('currentRoom').trim();
    const weapon = document.getElementById('weapons').value;
    const character = document.getElementById('characters').value;

    const suggestion = {
        room: room,
        weapon: weapon,
        character: character 
    };

    const body = {
        suggestion: suggestion,
        gameId: gameId
    }

    try {
        const response = await fetch("getFirstPlayerWithMatch", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data['playerNumber'] == 0) {
            document.cookie = `suggestionResponse=none`;
            gameNotificationsDiv.innerHTML = "";
            addToGameStateDisplay('No match, Make an accusation or end your turn', 'End Turn').addEventListener('click', endTurnEvent);
        } else {
            socket.send(JSON.stringify({
                "type": "suggestion",
                "message": suggestion,
                "sender": playerId,
                "matchedPlayerNumber": data['playerNumber']
            }))
        }
        document.cookie = 'endOfTurn=true';
        makeSuggestionButton.classList.add('suggestDisabled');
    } catch(error) {
        console.log(error);
    }
})

makeAccusationButton.addEventListener("click", async ()=>{
    const room = document.getElementById('rooms').value;
    const weapon = document.getElementById('weapons').value;
    const character = document.getElementById('characters').value;
    const currentPath = window.location.pathname;
    const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

    const accusation = {
        room: room,
        weapon: weapon,
        character: character,
        gameId: gameId,
        playerId: playerId
    };

    try {
        const response = await fetch("checkWin", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accusation)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        socket.send(JSON.stringify({
            "type": "accusation",
            "message": accusation,
            "sender": playerId,
            "win": data['win'],
            "guess": data['guess'],
            "defaultWinner": data['defaultWinner']
        }))

    } catch(error) {
        console.log(error);
    }
})