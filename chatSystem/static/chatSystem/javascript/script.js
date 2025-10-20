const newMessage = document.getElementById('newMessageInput');

newMessage.addEventListener('keydown', function(event) {
    if (event.key == 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function getCookie(name) {
    const cname = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(decodeURIComponent(cname)) === 0) {
            return decodeURIComponent(c.substring(cname.length));
        }
    }
    return "";
}

async function sendMessage() {
    try {
        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') + 1);

        const userId = getCookie('playerId'); 

        const body = {
            message: newMessage.value,
            gameId: gameId,
            userId: userId
        };

        const response = await fetch("/chat/sendMessage/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        socket.send(JSON.stringify({
            'type': 'chat',
            'message': newMessage.value,
            'sender': userId,
            'gameId': gameId
        }));

        newMessage.value = "";
    } catch (error) {
        console.error(error);
    }
}