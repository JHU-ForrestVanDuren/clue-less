const newMessage = document.getElementById('newMessageInput');

newMessage.addEventListener('keydown', function(event) {
    if (event.key == 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    try {

        const currentPath = window.location.pathname;
        const gameId = currentPath.substring(currentPath.lastIndexOf('/') +1);

        const body = {
            message: newMessage.value,
            gameId: gameId
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
            'message': newMessage.value
        }));
        newMessage.value = "";

    } catch (error) {
        console.error(error);
    }
}