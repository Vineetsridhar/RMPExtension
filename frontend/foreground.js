function createButton(name) {
    let button = document.createElement('button');
    button.innerText = "View Professor";
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ name })
    })
    return button
}

const modal = document.createElement('dialog');
modal.setAttribute("style", "height:40%");
modal.innerHTML =
    `<iframe id="headlineFetcher" style="height:100%"></iframe>
            <div class="modalContainer">
                <button>x</button>
                <h1 class="professorName"></h1>
                <h2 class="ratingMain"></h2>
                <p class="difficulty"></p>
                <p class="retake"></p>
                <a class="linkToRMP">View Professor's page</a>
            </div>`;
document.body.appendChild(modal);
const dialog = document.querySelector("dialog");

dialog.querySelector("button").addEventListener("click", () => {
    dialog.close();
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    dialog.querySelector("h1").innerText = request.name
    dialog.getElementsByClassName("ratingMain")[0].innerText = request.rate + "/5.0";
    dialog.getElementsByClassName("difficulty")[0].innerText = "Difficulty: " + request.diff + "/5.0";
    dialog.getElementsByClassName("retake")[0].innerText = request.retake + "% would take again";
    dialog.getElementsByClassName("linkToRMP")[0].innerHTML = `<a target="_blank" href=https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${request.tid}>View Professor's page</a>`

    dialog.showModal()
})


let elements = document.getElementsByClassName("sec-instructor");
for (let i = 0; i < elements.length; i++) {
    if (elements[i].innerText)
        elements[i].append(createButton(elements[i].innerText));
}