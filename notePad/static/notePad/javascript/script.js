const viewCardsButton = document.getElementById('viewCards');
const handPopup = document.getElementById('handPopup');
const accusationButton = document.getElementById('makeAccusation');
const accusationPopup = document.getElementById('accusationPopup');
const checkBoxes = document.querySelectorAll('input[type="checkbox"]');

if (playerNumber == turnNumber) {
    accusationButton.style.opacity = "1";
    accusationButton.addEventListener("click", accusationButtonClickEvent);
}

viewCardsButton.addEventListener("click", ()=> {

    accusationPopup.style.display = 'none';

    let handPopupStyle = window.getComputedStyle(handPopup);

    if (handPopupStyle.display == 'none') {
        handPopup.style.display = 'flex';
    } else {
        handPopup.style.display = 'none';
    }
})

function accusationButtonClickEvent() {
        handPopup.style.display = 'none';

        let accusationPopupStyle = window.getComputedStyle(accusationPopup);

        if (accusationPopupStyle.display == 'none') {
            accusationPopup.style.display = 'flex';
        } else {
            accusationPopup.style.display = 'none';
        }
}

for (const checkbox of checkBoxes) {
    checkbox.addEventListener("click", ()=> {
        notePadJson = JSON.parse(sessionStorage.getItem('notePad'));
        tag = checkbox.getAttribute('tag');
        column = checkbox.className;
       
        if (notePadJson == null) {
            notePadJson = {};
        }

        if (checkbox.checked) {
            if (tag in notePadJson) {
                notePadJson[tag][column] = true;
            } else {
                notePadJson[tag] = {};
                notePadJson[tag][column] = true;
            }
        } else {
            notePadJson[tag][column] = false;
        }

        sessionStorage.setItem('notePad', JSON.stringify(notePadJson));
    })
}