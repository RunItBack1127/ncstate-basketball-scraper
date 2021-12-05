const fetch = require("node-fetch");
const jsdom = require("jsdom");
const express = require("express");

const GAMES_CACHE = {
    mens: {
        allGames: [],
        upcomingGames: [],
        pastGames: [],
        wonGames: [],
        lostGames: [],
        tournamentGames: []
    },
    womens: {
        allGames: [],
        upcomingGames: [],
        pastGames: [],
        wonGames: [],
        lostGames: [],
        tournamentGames: []
    }
};

const FILTERS = {
    MENS_GAMES: 0x1C2B5,
    WOMENS_GAMES: 0x2A402,
    ALL_GAMES: 0x1AC4,
    UPCOMING_GAMES: 0xCC32,
    PAST_GAMES: 0x5FEB,
    WON_GAMES: 0x289107,
    LOST_GAMES: 0x32D691,
    TOURNAMENT_GAMES: 0x43822
};

const SERVER_SRC_URLS = {
    prefix: "gopack.com",
    mensURL: "https://gopack.com/sports/mens-basketball/schedule/",
    womensURL: "https://gopack.com/sports/womens-basketball/schedule/"
};

const FETCH_CMDS = {
    mens: 0x01,
    womens: 0x02
};

const NAME_REGEX = new RegExp("(NO\\.\\s*[-RV0-9/]*\\s*)|(\\#[0-9/RV]*\\s*)|(\\s*\\([A-Za-z/0-9-.]*\\))");

function _RETRIEVE_BASKETBALL_DATA(filters) {

    const wonPastGames = [];
    const lostPastGames = [];
    const wonTournamentGames = [];
    const lostTournamentGames = [];
    const pastTournamentGames = [];
    const upcomingTournamentGames = [];
    const pastWonTournamentGames = [];
    const pastLostTournamentGames = [];

    switch(filters) {
        case 0x1DAF5:
            return JSON.stringify(GAMES_CACHE.mens.allGames);
        case 0x2BEC6:
            return JSON.stringify(GAMES_CACHE.womens.allGames);
        case 0x1CEB7:
            return JSON.stringify(GAMES_CACHE.mens.upcomingGames);
        case 0x2EC32:
            return JSON.stringify(GAMES_CACHE.womens.upcomingGames);
        case 0x1DFFF:
            return JSON.stringify(GAMES_CACHE.mens.pastGames);
        case 0x2FFEB:
            return JSON.stringify(GAMES_CACHE.womens.pastGames);
        case 0x1D3B7:
            return JSON.stringify(GAMES_CACHE.mens.wonGames);
        case 0x2B507:
            return JSON.stringify(GAMES_CACHE.womens.wonGames);
        case 0x1D6B5:
            return JSON.stringify(GAMES_CACHE.mens.lostGames);
        case 0x2F693:
            return JSON.stringify(GAMES_CACHE.womens.lostGames);
        case 0x5FAB7:
            return JSON.stringify(GAMES_CACHE.mens.tournamentGames);
        case 0x6BC22:
            return JSON.stringify(GAMES_CACHE.womens.tournamentGames);
        case 0x29DFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isWin) {
                    wonPastGames.push(game);
                }
            }
            return JSON.stringify(wonPastGames);
        case 0x2AFFEF:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isWin) {
                    wonPastGames.push(game);
                }
            }
            return JSON.stringify(wonPastGames);
        case 0x33DFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(!game.gameInfo.isWin) {
                    lostPastGames.push(game);
                }
            }
            return JSON.stringify(lostPastGames);
        case 0x32FFFB:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(!game.gameInfo.isWin) {
                    lostPastGames.push(game);
                }
            }
            return JSON.stringify(lostPastGames);
        case 0x2DFBB7:
            if(GAMES_CACHE.mens.tournamentGames.length === 0) {
                return JSON.stringify(wonTournamentGames);
            }
            for(const game of GAMES_CACHE.mens.tournamentGames) {
                if(game.gameInfo.isWin) {
                    wonTournamentGames.push(game);
                }
            }
            return JSON.stringify(wonTournamentGames);
        case 0x2EBD27:
            if(GAMES_CACHE.womens.tournamentGames.length === 0) {
                return JSON.stringify(wonTournamentGames);
            }
            for(const game of GAMES_CACHE.womens.tournamentGames) {
                if(game.gameInfo.isWin) {
                    wonTournamentGames.push(game);
                }
            }
            return JSON.stringify(wonTournamentGames);
        case 0x37FEB7:
            if(GAMES_CACHE.mens.tournamentGames.length === 0) {
                return JSON.stringify(lostTournamentGames);
            }
            for(const game of GAMES_CACHE.mens.tournamentGames) {
                if(!game.gameInfo.isWin) {
                    lostTournamentGames.push(game);
                }
            }
            return JSON.stringify(lostTournamentGames);
        case 0x36FEB3:
            for(const game of GAMES_CACHE.womens.tournamentGames) {
                if(!game.gameInfo.isWin) {
                    lostTournamentGames.push(game);
                }
            }
            return JSON.stringify(lostTournamentGames);
        case 0x5FFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isACCTournamentGame) {
                    pastTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastTournamentGames);
        case 0x6FFEB:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isACCTournamentGame) {
                    pastTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastTournamentGames);
        case 0x5FEB7:
            for(const game of GAMES_CACHE.mens.upcomingGames) {
                if(game.gameInfo.isACCTournamentGame) {
                    upcomingTournamentGames.push(game);
                }
            }
            return JSON.stringify(upcomingTournamentGames);
        case 0x6FC32:
            for(const game of GAMES_CACHE.womens.upcomingGames) {
                if(game.gameInfo.isACCTournamentGame) {
                    upcomingTournamentGames.push(game);
                }
            }
            return JSON.stringify(upcomingTournamentGames);
        case 0x2DFFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isACCTournamentGame &&
                    game.gameInfo.isWin) {
                    pastWonTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastWonTournamentGames);
        case 0x2EFFEF:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isACCTournamentGame &&
                    game.gameInfo.isWin) {
                    pastWonTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastWonTournamentGames);
        case 0x37FFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isACCTournamentGame &&
                    !game.gameInfo.isWin) {
                    pastLostTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastLostTournamentGames);
        case 0x33FFFB:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isACCTournamentGame &&
                    !game.gameInfo.isWin) {
                    pastLostTournamentGames.push(game);
                }
            }
            return JSON.stringify(pastLostTournamentGames);
        
    }
}

async function _FETCH_BASKETBALL_DATA(fetchCmd) {

    let bballSite;

    switch(fetchCmd) {
        case FETCH_CMDS.mens:
            bballSite = await fetch(SERVER_SRC_URLS.mensURL);
        case FETCH_CMDS.womens:
            bballSite = await fetch(SERVER_SRC_URLS.womensURL);
    };

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

        switch(fetchCmd) {
            case FETCH_CMDS.mens:
                GAMES_CACHE.mens.allGames.push(game);

                if(winLoss === "N/A") {
                    GAMES_CACHE.mens.upcomingGames.push(game);
                }

                if(gameScore !== "N/A") {
                    GAMES_CACHE.mens.pastGames.push(game);
                }
                break;
            case FETCH_CMDS.womens:
                GAMES_CACHE.womens.allGames.push(game);

                if(winLoss === "N/A") {
                    GAMES_CACHE.womens.upcomingGames.push(game);
                }

                if(gameScore !== "N/A") {
                    GAMES_CACHE.womens.pastGames.push(game);
                }
                break;
        }
    }
}

(async function _INIT_SERVER_CACHES() {
    await _FETCH_BASKETBALL_DATA(FETCH_CMDS.mens);
    await _FETCH_BASKETBALL_DATA(FETCH_CMDS.womens);
    setTimeout(_INIT_SERVER_CACHES, 10000);
})();