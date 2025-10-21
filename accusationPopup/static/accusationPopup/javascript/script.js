const makeAccusationButton = document.getElementById('accuse');

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
        gameId: gameId
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

        playerId = getCookie('playerId');

        socket.send(JSON.stringify({
            "type": "accusation",
            "message": accusation,
            "sender": playerId,
            "win": data['win']
        }))

    } catch(error) {
        console.log(error);
    }
})