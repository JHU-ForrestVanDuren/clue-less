let startGame = document.getElementsByClassName('startGameButton')[0];
let joinGame = document.getElementsByClassName('joinGameButton')[0];
let games = document.getElementsByClassName('game');
let currentGame;

startGame.addEventListener('click', async ()=> {
    try {
        const response = await fetch("/createGame/");

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
    window.location.href = `/game/${currentGame.innerHTML}`
})

for (const game of games) {
    game.addEventListener('click', ()=> {
        console.log('test');
        if (currentGame) {
            currentGame.classList.remove('selected');
        }
        currentGame = game;
        currentGame.classList.add('selected');
    })
}