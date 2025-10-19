const newMessage = document.getElementById('newMessageInput');

newMessage.addEventListener('keydown', function(event) {
    if (event.key == 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function getCookie(name) {
    let name = cname + "=";
    let ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0 ) {
            return c.substring(name.length, c.length);
        }
    }
    return ""
}

async function sendMessage() {
    try {

        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);
        const userId = getCookie(playerId)

        const body = {
            message: newMessage.value,
            gameId: gameId,
            playerId: userId
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
            'message': newMessage.value,
            'type': 'chat'
        }));
        newMessage.value = "";

    } catch (error) {
        console.error(error);
    }
}