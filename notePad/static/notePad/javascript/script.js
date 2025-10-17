const accusationButton = document.getElementById('makeAccusation');
const accusationDropDown = document.getElementById('accusationPopup');

accusationButton.addEventListener("click", ()=> {
    let accusationDropDownStyle = window.getComputedStyle(accusationDropDown);

    if (accusationDropDownStyle.display == 'none') {
        accusationDropDown.style.display = 'flex';
    } else {
        accusationDropDown.style.display = 'none';
    }
})