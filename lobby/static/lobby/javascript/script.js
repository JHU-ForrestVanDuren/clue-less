let startGame = document.getElementsByClassName('startGameButton')[0];
let joinGame = document.getElementsByClassName('joinGameButton')[0];
let games = document.getElementsByClassName('game');
let selectedGame;

const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

startGame.addEventListener('click', async ()=> {
    try {

        const chosenCharacter = document.getElementById('characters').value;

        const body = {
            character: chosenCharacter
        };

        const response = await fetch("/createGame/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        document.cookie = `playerId=${data['playerId']}`;
        window.location.href = `/game/${data['gameId']}`;

    } catch (error) {
        console.error(error);
    }
})

joinGame.addEventListener('click', async ()=> {
    document.cookie = `playerId=${crypto.randomUUID()}`;

    const chosenCharacter = document.getElementById('charactersJoin').value;
    const gameId = selectedGame.innerHTML;

    const body = {
        character: chosenCharacter,
        gameId: gameId
    };

    const response = await fetch("/joinGame/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    window.location.href = `/game/${gameId}`;
})

for (const game of games) {
    game.addEventListener('click', async ()=> {
        if (selectedGame) {
            selectedGame.classList.remove('selected');
        }
        selectedGame = game;
        selectedGame.classList.add('selected');

        const body = {
            gameId: game.innerHTML
        };

        const response = await fetch("/getCharacters/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        const characterDropDown = document.getElementById('charactersJoin');

        while (characterDropDown.firstChild) {
            characterDropDown.removeChild(characterDropDown.firstChild);
        }

        for (character of data.characters) {
            const dropDownValue = document.createElement("option");
            dropDownValue.textContent = character;
            dropDownValue.value = character;
            characterDropDown.appendChild(dropDownValue);
        }

    })
}