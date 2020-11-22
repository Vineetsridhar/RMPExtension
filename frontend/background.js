let active_tab = 0;

function makeGraphQLQuery(name) {
  return fetch("https://typhoon-pricey-supernova.glitch.me/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
                  numratings
                } 
              }
            }`,
    }),
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.name.length > 1) {
    makeGraphQLQuery(request.name)
      .then((x) => x.json())
      .then((json) => {
        json = json["data"]["professor"];
        if (!json.length) throw new Error();
        json = json[0];
        let name = json["name"];
        let rating = json["rating"];
        let rate = rating["rating"];
        let diff = rating["difficulty"];
        let retake = rating["retake"];
        let numratings = rating["numratings"];
        let tid = json["tid"];
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { name, rate, diff, retake, tid, numratings },
              function (response) {}
            );
          }
        );
      })
      .catch((err) => {
        alert("Could not find this professor");
      });
  }
  return true;
});
