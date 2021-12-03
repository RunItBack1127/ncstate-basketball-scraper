const fetch = require("node-fetch");
const jsdom = require("jsdom");

const ALL_GAMES = [];
const UPCOMING_GAMES = [];
const PAST_GAMES = [];

const NAME_REGEX = new RegExp("(NO\\.\\s*[-RV0-9/]*\\s*)|(\\#[0-9/RV]*\\s*)|(\\s*\\([A-Za-z/0-9-.]*\\))");

(async() => {
    const bballSite = await fetch("https://gopack.com/sports/mens-basketball/schedule/");
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
                    if(time.length < 4) {
                        let formattedTime;
                        if(parseInt(time) >= 10) {
                            formattedTime = time;
                        }
                        else {
                            formattedTime = "0" + time;
                        }
                        gameTimes.push(formattedTime + ":00 PM");       // Assume game occurs in PM
                    }
                    else {
                        gameTimes.push(time + " PM");       // Assume game occurs in PM
                    }
                }
                else {
                    const [numFromTime, amOrPm] = times[0].split(" ");
                    if(numFromTime.length < 5) {
                        let formattedTime;
                        if(parseInt(numFromTime) >= 10) {
                            formattedTime = numFromTime;
                        }
                        else {
                            formattedTime = "0" + numFromTime;
                        }
                        if(numFromTime.length < 4) {
                            gameTimes.push(formattedTime + ":00 " + amOrPm);
                        }
                        else {
                            gameTimes.push(formattedTime + " " + amOrPm);
                        }
                    }
                    else {
                        gameTimes.push(numFromTime + " " + amOrPm);
                    }
                }
            }
        }
        else {
            if(times[0].trim() !== "TBD") {
                const [numFromTime, amOrPm] = times[0].split(" ");
                if(numFromTime.length < 5) {
                    let formattedTime;
                    if(parseInt(numFromTime) >= 10) {
                        formattedTime = numFromTime;
                    }
                    else {
                        formattedTime = "0" + numFromTime;
                    }
                    if(numFromTime.length < 4) {
                        gameTimes.push(formattedTime + ":00 " + amOrPm);
                    }
                    else {
                        gameTimes.push(formattedTime + " " + amOrPm);
                    }
                }
                else {
                    gameTimes.push(numFromTime + " " + amOrPm);
                }
            }
            else {
                gameTimes.push("TBD");
            }
        }

        const oppName = oppInfo.querySelector(".sidearm-schedule-game-opponent-text .sidearm-schedule-game-opponent-name a").
            innerHTML.replace(NAME_REGEX, "").trim();

        // Game info
        const gameInfo = gameContainer.querySelector(".sidearm-schedule-game-details");
        const winLossScore = gameInfo.querySelectorAll(".sidearm-schedule-game-result span");

        const accIndicator = oppInfo.querySelector("div div.sidearm-schedule-game-conference-conference span.sidearm-schedule-game-conference");
        const isACCGame = accIndicator != null;

        let winLoss = "N/A";
        let gameScore = "N/A";
        let gameCity = "N/A";
        let gameState = "N/A";
        let gameArena = "N/A";
        let gameCountry = "United States";
        let networkTV = "N/A";
        let networkRadio = "N/A";
        let minTicketPrice = Number.MIN_SAFE_INTEGER;
        let maxTicketPrice = Number.MAX_SAFE_INTEGER;
        let ticketLink = "N/A";

        if(winLossScore[1] != undefined && winLossScore[2] != undefined) {
            winLoss = winLossScore[1].innerHTML[0];
            gameScore = winLossScore[2].innerHTML;
        }

        const location = gameContainer.querySelectorAll("div div.sidearm-schedule-game-location span:not(.c-tickets__icon)");
        const cityStateOrCountry = location[0].innerHTML.split(", ");

        gameCity = cityStateOrCountry[0];

        while(cityStateOrCountry[1].includes(".")) {
            cityStateOrCountry[1] = cityStateOrCountry[1].replace(".", "");
        }

        if(cityStateOrCountry[1].length > 3) {
            gameCountry = cityStateOrCountry[1];
        }
        else {
            gameState = cityStateOrCountry[1].toUpperCase();
        }
        
        if(location.length > 1) {
            const arenaContainer = location[1].querySelector("a");
            if(arenaContainer != null) {
                gameArena = arenaContainer.innerHTML;
            }
        }
        
        const tvNetwork = gameContainer.querySelector("div div.sidearm-schedule-game-coverage .sidearm-schedule-game-coverage-tv-content");
        if(tvNetwork != null) {
            networkTV = tvNetwork.innerHTML.trim();
        }

        const radioNetwork = gameContainer.querySelector("div div.sidearm-schedule-game-coverage .sidearm-schedule-game-coverage-radio-content");

        if(radioNetwork != null) {
            networkRadio = radioNetwork.innerHTML.trim().replace(new RegExp("\\\w\\\S*", "g"), (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        const ticketContainer = gameContainer.querySelector("div div.sidearm-schedule-game-location div a.paciolan_link");
        if(ticketContainer != null) {
            const ticketInfo = ticketContainer.innerHTML;
            const tInfoParsed = ticketInfo.substring(ticketInfo.indexOf("$")).split(" - ");

            if(tInfoParsed[0].includes("$") && tInfoParsed[1].includes("$")) {
                minTicketPrice = parseInt(tInfoParsed[0].replace("$", ""));
                maxTicketPrice = parseInt(tInfoParsed[1].replace("$", ""));
            }
            ticketLink = ticketContainer.href;
        }

        const game = {
            opponentName: oppName,
            opponentLogo: oppImgSrc,
            gameInfo: {
                time: {
                    date: gameDate,
                    dayOfWeek: gameDOW,
                    advertisedTimes: gameTimes
                },
                isWin: winLoss === "W",
                isACCTournamentGame: isACCGame,
                score: gameScore,
                location: {
                    city: gameCity,
                    state: gameState,
                    country: gameCountry,
                    arena: gameArena
                },
                network: {
                    tv: networkTV,
                    radio: networkRadio
                },
                ticketInformation: {
                    minTicketPrice: minTicketPrice,
                    maxTicketPrice: maxTicketPrice,
                    purchaseLink: ticketLink
                }
            }  
        };

        ALL_GAMES.push(game);

        if(winLoss === "N/A") {
            UPCOMING_GAMES.push(game);
        }

        if(gameScore !== "N/A") {
            PAST_GAMES.push(game);
        }
    }
})();