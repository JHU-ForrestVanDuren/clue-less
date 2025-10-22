const viewCardsButton = document.getElementById('viewCards');
const handPopup = document.getElementById('handPopup');
const accusationButton = document.getElementById('makeAccusation');
const accusationPopup = document.getElementById('accusationPopup');

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