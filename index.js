const fetch = require("node-fetch");
const jsdom = require("jsdom");

const GAMES = [];
const NAME_REGEX = new RegExp("(NO\\.\\s*[-RV0-9/]*\\s*)|(\\#[0-9/RV]*\\s*)|(\\s*\\([A-Za-z/0-9-.]*\\))");

(async() => {
    const bballSite = await fetch("https://gopack.com/sports/womens-basketball/schedule/2021-22");
    const bballText = await bballSite.text();
    
    const bballDOM = new jsdom.JSDOM(bballText);

    const allGamesContainer = bballDOM.window.document.querySelector(".sidearm-schedule-games-container");
    const listAllGames = allGamesContainer.querySelectorAll(".sidearm-schedule-game");

    for(const listGame of listAllGames) {
        
        const gameContainer = listGame.querySelector(".sidearm-schedule-game-row");
        const oppContainer = listGame.querySelector(".sidearm-schedule-game-opponent");
        
        // Opponent image
        const oppImgSrc = "gopack.com" + oppContainer.querySelector(".sidearm-schedule-game-opponent-logo img").getAttribute("data-src");
        
        // Opponent info
        const oppInfo = oppContainer.querySelector(".sidearm-schedule-game-opponent-details");
        const dateTime = oppInfo.querySelectorAll(".sidearm-schedule-game-opponent-date span");

        const dateDOW = dateTime[0].innerHTML.split(" (");
        const gameDate = dateDOW[0];
        const gameDOW = dateDOW[1].replace(")", "");

        const times = dateTime[1].innerHTML.split(" or ");
        let gameTimes = [];
        if(times.length > 1) {
            for(const time of times) {
                if(!time.includes("PM") && !time.includes("AM")) {
                    gameTimes.push(time + " PM");       // Assume game occurs in PM
                }
                else {
                    gameTimes.push(time.trim());
                }
            }
        }
        else {
            gameTimes.push(times[0].trim());
        }

        const oppName = oppInfo.querySelector(".sidearm-schedule-game-opponent-text .sidearm-schedule-game-opponent-name a").
            innerHTML.replace(NAME_REGEX, "");

        // Game info
        const gameInfo = gameContainer.querySelector(".sidearm-schedule-game-details");
        const winLossScore = gameInfo.querySelectorAll(".sidearm-schedule-game-result span");

        let winLoss = "N/A";
        let score = "N/A";
        let cityState = "N/A";
        let arena = "N/A";
        let network = "N/A";

        if(winLossScore.length > 0) {
            winLoss = winLossScore[1].innerHTML[0];
            score = winLossScore[2].innerHTML;

            const location = gameContainer.querySelectorAll("div div.sidearm-schedule-game-location span");
            cityState = location[0].innerHTML;
            
            if(location[1] != undefined) {
                arena = location[1].querySelector("a").innerHTML;
            }
            
            const tvNetwork = gameContainer.querySelector("div div.sidearm-schedule-game-coverage .sidearm-schedule-game-coverage-tv-content");
            if(tvNetwork != null) {
                network = tvNetwork.innerHTML.trim();
            }
        }

        GAMES.push({
            opponentName: oppName,
            schoolLogo: oppImgSrc,
            dateAndTimes: {
                date: gameDate,
                dayOfWeek: gameDOW,
                times: gameTimes
            },
            winLoss: winLoss,
            score: score,
            cityState: cityState,
            arena: arena,
            network: network
        });
    }

    for(const game of GAMES) {
        console.log(game);
    }
})();