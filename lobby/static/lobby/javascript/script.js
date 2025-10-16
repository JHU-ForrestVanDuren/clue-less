let startGame = document.getElementsByClassName('startGameButton')[0];
let joinGame = document.getElementsByClassName('joinGameButton')[0];
let games = document.getElementsByClassName('game');
let selectedGame;

const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
// let socket = new WebSocket(`ws://127.0.0.1:8000/ws/test/`);

// socket.onopen = function(e) {
//     console.log("Websocket connection established.");
//     socket.send(JSON.stringify({'message': 'Hello from client'}));
// };

// socket.onmessage = function(e) {
//     const data = JSON.parse(e.data);
//     console.log("Received message");
// }

// socket.onclose = function(e) {
//     console.log("Websocket connection closed");
// }

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