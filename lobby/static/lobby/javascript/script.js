let startGame = document.getElementsByClassName('startGameButton')[0];
let joinGame = document.getElementsByClassName('joinGameButton')[0];
let joinCurrentGameButton = document.getElementById('joinCurrentGameButton');
let leaveCurrentGameButton = document.getElementById('leaveCurrentGameButton');
let games = document.getElementsByClassName('game');
let playerId = getCookie('playerId');
let selectedGame;

const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

if (startGame !== undefined) {
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
        document.cookie = `playerId=${data['playerId']}`;

        window.location.href = `/game/${gameId}`;
    });

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
} else {
    joinCurrentGameButton.addEventListener("click", async ()=> {
        try {
            const body = {
                playerId: playerId
            };

            const response = await fetch("/getGame/", {
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

            window.location.href = `/game/${data['gameId']}`;

        } catch (error) {
            console.error(error);
        }
    })

    leaveCurrentGameButton.addEventListener('click', ()=> {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const equalIndex = cookie.indexOf('=');
            const name = equalIndex > -1 ? cookie.substr(0, equalIndex) : cookie;
            document.cookie = name.trim() + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        }

        document.cookie = 'playerId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';

        window.location.reload();
    })
}

function getCookie(name) {
    const cookies = document.cookie.split('; ')
    .map(c => c.split('='))
    .map(([key, value]) => [key, decodeURIComponent(value)]);

    const match = cookies.find(([key]) => key === name);
    return match ? match[1] : null;
}

