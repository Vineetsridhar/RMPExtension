let active_tab = 0;

function makeGraphQLQuery(name) {
    return fetch("http://localhost:5000/graphql", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: `
            {
                professor(query:"${name}"){
                name,
                tid,
                rating{
                  rating,
                  retake,
                  difficulty,
                } 
              }
            }`
        })
    })
}

chrome.tabs.onActivated.addListener(tab => {
    chrome.tabs.get(tab.tabId, current_tab_info => {
        active_tab = tab.tabId;
        if (current_tab_info.url == "https://uisapppr3.njit.edu/scbldr/") {
            chrome.tabs.insertCSS(null, {file:'./styles.css'})
            chrome.tabs.executeScript(null, { file: './foreground.js' })
        }
    })
})

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.name.length > 1) {
        try {
            let x = await makeGraphQLQuery(request.name);
            let json = await x.json()

            json = json["data"]["professor"];
            if(!json.length) throw new Error();

            json = json[0];

            let name = json["name"];
            let rating = json["rating"];
            let rate = rating["rating"];
            let diff = rating["difficulty"];
            let retake = rating["retake"];
            let tid = json["tid"];

            chrome.tabs.sendMessage(active_tab, {name, rate, diff, retake, tid})
        } catch (err) {
            alert("Could not find this professor")
        }
        alert(JSON.stringify(json))
    }
})
