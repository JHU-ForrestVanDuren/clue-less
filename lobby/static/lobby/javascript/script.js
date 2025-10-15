let startGame = document.getElementsByClassName('startGameButton')[0];
let joinGame = document.getElementsByClassName('joinGameButton')[0];
let games = document.getElementsByClassName('game');
let selectedGame;

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
        window.location.href = `/game/${data['gameId']}`;

    } catch (error) {
        console.error(error);
    }
})

joinGame.addEventListener('click', ()=> {
    window.location.href = `/game/${selectedGame.innerHTML}`
})

for (const game of games) {
    game.addEventListener('click', ()=> {
        console.log('test');
        if (selectedGame) {
            selectedGame.classList.remove('selected');
        }
        selectedGame = game;
        selectedGame.classList.add('selected');
    })
}