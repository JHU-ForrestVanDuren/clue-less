const currentPath = window.location.pathname;
const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
let currentOrigin = window.location.origin;
currentOrigin = currentOrigin.substring(currentOrigin.indexOf('/'));
let socket = new WebSocket(`ws:${currentOrigin}/ws/game/${gameId}`);

const dealButton = document.getElementById('deal');

dealButton.addEventListener('click', async ()=> {
    try {

        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const response = await fetch(`/game/deal/${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Cards added to players');

        socket.send(JSON.stringify({
            'type': 'draw'
        }));

    } catch (error) {
        console.error(error);
    }
})

socket.onopen = function(e) {
    console.log("Websocket connection established.");
};

socket.onmessage = function(e) {
    console.log(e);
    console.log('test1');
    const data = JSON.parse(e.data);
    const type = data['type'];
    console.log(type);
    if (type == 'chat') {
        console.log(type);
        let noHistory = document.getElementById('noHistory');
        
        if (noHistory != null) {
            noHistory.remove();
        }

        
        const chatBox = document.getElementById('messagesBox');
        const newMessage = document.createElement("p");
        newMessage.textContent = data['message'];
        newMessage.classList.add('messages');
        chatBox.appendChild(newMessage);
        console.log("Received message");
    } else if (type == 'draw') {
        getHand();
    }

}

socket.onclose = function(e) {
    console.log("Websocket connection closed");
}

async function getHand() {
    try {

        console.log('get hand test1')

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

function addHandToPlayer(hand) {

    handDiv = document.getElementById('handPopup');
    for (card of hand) {
        const cardP = document.createElement("p");
        cardP.textContent = card;
        cardP.classList.add('card');
        handDiv.appendChild(cardP);
    }


}