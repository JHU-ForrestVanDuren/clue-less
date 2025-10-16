const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
let socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

let test2 = document.querySelector('#boardSquare');

socket.onopen = function(e) {
    console.log("Websocket connection established.");
};

socket.onmessage = function(e) {
    let noHistory = document.getElementById('noHistory');
    
    if (noHistory != null) {
        noHistory.remove();
    }

    const data = JSON.parse(e.data);
    const chatBox = document.getElementById('messagesBox');
    const newMessage = document.createElement("p");
    newMessage.textContent = data['message'];
    newMessage.classList.add('messages');
    chatBox.appendChild(newMessage);
    console.log("Received message");
}

socket.onclose = function(e) {
    console.log("Websocket connection closed");
}