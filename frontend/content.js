//Create modal
const modal = document.createElement('dialog');
modal.setAttribute("style", "border-radius:10px");
modal.innerHTML =
    `<iframe id="headlineFetcher" style="height:350px" frameBorder="0"></iframe>
            <div class="modalContainer">
                <button>x</button>
                <h1 class="professorName"></h1>
                <h2 class="ratingMain"></h2>
                <p class="difficulty"></p>
                <p class="retake"></p>
                <p class="numratings"></p>
                <a class="linkToRMP">View Professor's page</a>
                <span class="poweredbyspan">
                    <p class="poweredby">Powered by&nbsp</p>
                    <a class="poweredby" target="_blank" href="https://www.ratemyprofessors.com/">Rate my Professor</a>
                <span>
            </div>`;
document.body.appendChild(modal);
const dialog = document.querySelector("dialog");

//Check if new class was added
let numProf = 0;
setInterval(() => {
    let elements = document.getElementsByClassName("sec-instructor");
    if(elements.length < numProf) numProf = elements.length;
    else if(elements.length > numProf) injectHTML(elements)
}, 500)

//create button 
function createButton(name, dialog) {
    let button = document.createElement('button');
    button.className = "btn"
    button.innerText = "View Professor";
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ name })
    })
    return button
}

//
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    dialog.querySelector("h1").innerText = request.name
    dialog.getElementsByClassName("ratingMain")[0].innerText = request.rate + "/5.0";
    dialog.getElementsByClassName("difficulty")[0].innerText = "Difficulty: " + request.diff + "/5.0";
    dialog.getElementsByClassName("retake")[0].innerText = request.retake + "% would take again";
    dialog.getElementsByClassName("numratings")[0].innerText = request.numratings + " ratings available";
    dialog.getElementsByClassName("linkToRMP")[0].innerHTML = `<a target="_blank" href=https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${request.tid}>View Professor's page</a>`
    dialog.querySelector("button").addEventListener("click", () => {
        dialog.close();
    });
    dialog.showModal()
})



function injectHTML(elements) {
    for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText && !elements[i].innerHTML.includes("button")) {
            elements[i].append(createButton(elements[i].innerText, dialog));
        }
    }
}