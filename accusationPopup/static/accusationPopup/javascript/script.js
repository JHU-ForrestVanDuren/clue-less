const makeSuggestionButton = document.getElementById('makeSuggestion');

makeSuggestionButton.addEventListener("click", ()=>{
    const room = document.getElementById('rooms').value;
    const weapon = document.getElementById('weapons').value;
    const character = document.getElementById('characters').value

    const suggestion = {
        room: room,
        weapon: weapon,
        character: character 
    };

    playerId = getCookie('playerId');

    socket.send(JSON.stringify({
        "type": "suggestion",
        "message": suggestion,
        "sender": playerId
    }))
})