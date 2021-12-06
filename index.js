const fetch = require("node-fetch");
const jsdom = require("jsdom");
const express = require("express");
// const path = require("path");

const bballServer = express();

const BBALL_SERVER_PORT = 9696;
const SERVER_SCRAPE_INTERVAL = 10 * 60 * 1000;

// bballServer.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "index.html"));
// });

bballServer.get("/games", (req, res) => {
    let filter;

    if(req.query.mensGame === "true") {
        filter = FILTERS.MENS_GAMES;
    }
    else if(req.query.womensGame === "true") {
        filter = FILTERS.WOMENS_GAMES;
    }

    if(req.query.allGames === "true") {
        filter |= FILTERS.ALL_GAMES;
    }
    else if(req.query.upcomingGames === "true") {
        filter |= FILTERS.UPCOMING_GAMES;

        if(req.query.conferenceGames === "true") {
            filter |= FILTERS.TOURNAMENT_GAMES;
        }
    }
    else if(req.query.pastGames === "true") {
        filter |= FILTERS.PAST_GAMES;

        if(req.query.wonGames === "true") {
            filter |= FILTERS.WON_GAMES;

            if(req.query.conferenceGames === "true") {
                filter |= FILTERS.TOURNAMENT_GAMES;
            }
        }
        else if(req.query.lostGames === "true") {
            filter |= FILTERS.LOST_GAMES;

            if(req.query.conferenceGames === "true") {
                filter |= FILTERS.TOURNAMENT_GAMES;
            }
        }
        else if(req.query.conferenceGames === "true") {
            filter |= FILTERS.TOURNAMENT_GAMES;
        }
    }
    else if(req.query.wonGames === "true") {
        filter |= FILTERS.WON_GAMES;
    }
    else if(req.query.lostGames === "true") {
        filter |= FILTERS.LOST_GAMES;
    }
    else if(req.query.conferenceGames === "true") {
        filter |= FILTERS.TOURNAMENT_GAMES;
    }

    res.setHeader('ContentType', 'application/json');
    res.end(_RETRIEVE_BASKETBALL_DATA(filter));
});

const GAMES_CACHE = {
    mens: {
        allGames: [],
        upcomingGames: [],
        pastGames: [],
        wonGames: [],
        lostGames: [],
        conferenceGames: []
    },
    womens: {
        allGames: [],
        upcomingGames: [],
        pastGames: [],
        wonGames: [],
        lostGames: [],
        conferenceGames: []
    }
};

const FILTERS = {
    MENS_GAMES: 0x1C2B5,
    WOMENS_GAMES: 0x2A402,
    ALL_GAMES: 0x1AC4,
    UPCOMING_GAMES: 0xCC32,
    PAST_GAMES: 0xA5FEB,
    WON_GAMES: 0x289107,
    LOST_GAMES: 0x32D691,
    TOURNAMENT_GAMES: 0x43822
};

const SERVER_SRC_URLS = {
    prefix: "gopack.com",
    mensURL: "https://gopack.com/sports/mens-basketball/schedule/",
    womensURL: "https://gopack.com/sports/womens-basketball/schedule/"
};

const DEFAULT_VALUES = {
    unavailable: "N/A",
    country: "United States",
    ticketPrices: {
        MAX: Number.MAX_SAFE_INTEGER,
        MIN: Number.MIN_SAFE_INTEGER
    }
}

const FETCH_CMDS = {
    mens: 0x01,
    womens: 0x02
};

/**
 * Handles all defunct or otherwise naming conventions for opposing teams
 * from previous iterations of the schedule website (see previous
 * years of both Men's and Women's basketball for edge cases and
 * fallthroughs)
 */
const NAME_REGEX = new RegExp("(NO\\.\\s*[-RV0-9/]*\\s*)|(\\#[0-9/RV]*\\s*)|(\\s*\\([A-Za-z/0-9-.]*\\))");

function _RETRIEVE_BASKETBALL_DATA(filters) {

    const wonPastGames = [];
    const lostPastGames = [];
    const wonConferenceGames = [];
    const lostConferenceGames = [];
    const pastConferenceGames = [];
    const upcomingConferenceGames = [];
    const pastWonConferenceGames = [];
    const pastLostConferenceGames = [];

    switch(filters) {
        case 0x1DAF5:
            return JSON.stringify(GAMES_CACHE.mens.allGames);
        case 0x2BEC6:
            return JSON.stringify(GAMES_CACHE.womens.allGames);
        case 0x1CEB7:
            return JSON.stringify(GAMES_CACHE.mens.upcomingGames);
        case 0x2EC32:
            return JSON.stringify(GAMES_CACHE.womens.upcomingGames);
        case 0xBDFFF:
            return JSON.stringify(GAMES_CACHE.mens.pastGames);
        case 0xAFFEB:
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
            return JSON.stringify(GAMES_CACHE.mens.conferenceGames);
        case 0x6BC22:
            return JSON.stringify(GAMES_CACHE.womens.conferenceGames);
        case 0x2BDFFF:
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
        case 0x3BDFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(!game.gameInfo.isWin) {
                    lostPastGames.push(game);
                }
            }
            return JSON.stringify(lostPastGames);
        case 0x3AFFFB:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(!game.gameInfo.isWin) {
                    lostPastGames.push(game);
                }
            }
            return JSON.stringify(lostPastGames);
        case 0x2DFBB7:
            if(GAMES_CACHE.mens.conferenceGames.length === 0) {
                return JSON.stringify(wonConferenceGames);
            }
            for(const game of GAMES_CACHE.mens.conferenceGames) {
                if(game.gameInfo.isWin) {
                    wonConferenceGames.push(game);
                }
            }
            return JSON.stringify(wonConferenceGames);
        case 0x2EBD27:
            if(GAMES_CACHE.womens.conferenceGames.length === 0) {
                return JSON.stringify(wonConferenceGames);
            }
            for(const game of GAMES_CACHE.womens.conferenceGames) {
                if(game.gameInfo.isWin) {
                    wonConferenceGames.push(game);
                }
            }
            return JSON.stringify(wonConferenceGames);
        case 0x37FEB7:
            if(GAMES_CACHE.mens.conferenceGames.length === 0) {
                return JSON.stringify(lostConferenceGames);
            }
            for(const game of GAMES_CACHE.mens.conferenceGames) {
                if(!game.gameInfo.isWin) {
                    lostConferenceGames.push(game);
                }
            }
            return JSON.stringify(lostConferenceGames);
        case 0x36FEB3:
            for(const game of GAMES_CACHE.womens.conferenceGames) {
                if(!game.gameInfo.isWin) {
                    lostConferenceGames.push(game);
                }
            }
            return JSON.stringify(lostConferenceGames);
        // case 0xFFFFF:
        //     for(const game of GAMES_CACHE.mens.pastGames) {
        //         if(game.gameInfo.isACCConferenceGame) {
        //             pastConferenceGames.push(game);
        //         }
        //     }
        //     return JSON.stringify(pastConferenceGames);
        // case 0xEFFEB:
        //     for(const game of GAMES_CACHE.womens.pastGames) {
        //         if(game.gameInfo.isACCConferenceGame) {
        //             pastConferenceGames.push(game);
        //         }
        //     }
        //     return JSON.stringify(pastConferenceGames);
        case 0x5FEB7:
            for(const game of GAMES_CACHE.mens.upcomingGames) {
                if(game.gameInfo.isACCConferenceGame) {
                    upcomingConferenceGames.push(game);
                }
            }
            return JSON.stringify(upcomingConferenceGames);
        case 0x6FC32:
            for(const game of GAMES_CACHE.womens.upcomingGames) {
                if(game.gameInfo.isACCConferenceGame) {
                    upcomingConferenceGames.push(game);
                }
            }
            return JSON.stringify(upcomingConferenceGames);
        case 0x2FFFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isACCConferenceGame &&
                    game.gameInfo.isWin) {
                    pastWonConferenceGames.push(game);
                }
            }
            return JSON.stringify(pastWonConferenceGames);
        case 0x2EFFEF:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isACCConferenceGame &&
                    game.gameInfo.isWin) {
                    pastWonConferenceGames.push(game);
                }
            }
            return JSON.stringify(pastWonConferenceGames);
        case 0x3FFFFF:
            for(const game of GAMES_CACHE.mens.pastGames) {
                if(game.gameInfo.isACCConferenceGame &&
                    !game.gameInfo.isWin) {
                    pastLostConferenceGames.push(game);
                }
            }
            return JSON.stringify(pastLostConferenceGames);
        case 0x3EFFFB:
            for(const game of GAMES_CACHE.womens.pastGames) {
                if(game.gameInfo.isACCConferenceGame &&
                    !game.gameInfo.isWin) {
                    pastLostConferenceGames.push(game);
                }
            }
            return JSON.stringify(pastLostConferenceGames);
        
    }
}

async function _FETCH_BASKETBALL_DATA(fetchCmd) {

    let bballSite;

    switch(fetchCmd) {
        case FETCH_CMDS.mens:
            bballSite = await fetch(SERVER_SRC_URLS.mensURL);
            break;
        case FETCH_CMDS.womens:
            bballSite = await fetch(SERVER_SRC_URLS.womensURL);
            break;
    };

    const bballText = await bballSite.text();
    const bballDOM = new jsdom.JSDOM(bballText);

    const allGamesContainer = bballDOM.window.document.querySelector(".sidearm-schedule-games-container");
    const listAllGames = allGamesContainer.querySelectorAll(".sidearm-schedule-game");

    for(const listGame of listAllGames) {
        
        const gameContainer = listGame.querySelector(".sidearm-schedule-game-row");
        const oppContainer = listGame.querySelector(".sidearm-schedule-game-opponent");
        
        const oppImgSrc = SERVER_SRC_URLS.prefix + oppContainer.querySelector(".sidearm-schedule-game-opponent-logo img").getAttribute("data-src");
        
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
                    updateGameTimesWithFormattedTime(numFromTime, amOrPm);
                }
            }
        }
        else {
            if(times[0].trim() !== "TBD") {
                const [numFromTime, amOrPm] = times[0].split(" ");
                updateGameTimesWithFormattedTime(numFromTime, amOrPm);
            }
            else {
                gameTimes.push("TBD");
            }
        }

        function updateGameTimesWithFormattedTime(numFromTime, amOrPm) {
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

        const oppName = oppInfo.querySelector(".sidearm-schedule-game-opponent-text .sidearm-schedule-game-opponent-name a").
            innerHTML.replace(NAME_REGEX, "").trim();
        
        const gameInfo = gameContainer.querySelector(".sidearm-schedule-game-details");
        const winLossScore = gameInfo.querySelectorAll(".sidearm-schedule-game-result span");

        const accIndicator = oppInfo.querySelector("div div.sidearm-schedule-game-conference-conference span.sidearm-schedule-game-conference");
        const isACCGame = accIndicator != null;

        let winLoss = DEFAULT_VALUES.unavailable;
        let gameScore = DEFAULT_VALUES.unavailable;
        let gameCity = DEFAULT_VALUES.unavailable;
        let gameState = DEFAULT_VALUES.unavailable;
        let gameArena = DEFAULT_VALUES.unavailable;
        let gameCountry = DEFAULT_VALUES.country;
        let networkTV = DEFAULT_VALUES.unavailable;
        let networkRadio = DEFAULT_VALUES.unavailable;
        let minTicketPrice = DEFAULT_VALUES.ticketPrices.MIN;
        let maxTicketPrice = DEFAULT_VALUES.ticketPrices.MAX;
        let ticketLink = DEFAULT_VALUES.unavailable;

        if(winLossScore[1] != undefined && winLossScore[2] != undefined) {
            winLoss = winLossScore[1].innerHTML[0];
            gameScore = winLossScore[2].innerHTML;
        }
        const isWin = winLoss === "W";

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
            // All television and radio networks are scraped
            // with hardcoded uppercase lettering; converts the
            // case to proper
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
                isWin: isWin,
                isACCConferenceGame: isACCGame,
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

                if(winLoss === DEFAULT_VALUES.unavailable) {
                    GAMES_CACHE.mens.upcomingGames.push(game);
                }
                else if(isWin) {
                    GAMES_CACHE.mens.wonGames.push(game);
                }
                else {
                    GAMES_CACHE.mens.lostGames.push(game);
                }

                if(gameScore !== DEFAULT_VALUES.unavailable) {
                    GAMES_CACHE.mens.pastGames.push(game);
                }

                if(isACCGame) {
                    GAMES_CACHE.mens.conferenceGames.push(game);
                }
                break;
            case FETCH_CMDS.womens:

                GAMES_CACHE.womens.allGames.push(game);

                if(winLoss === DEFAULT_VALUES.unavailable) {
                    GAMES_CACHE.womens.upcomingGames.push(game);
                }
                else if(isWin) {
                    GAMES_CACHE.womens.wonGames.push(game);
                }
                else {
                    GAMES_CACHE.womens.lostGames.push(game);
                }

                if(gameScore !== DEFAULT_VALUES.unavailable) {
                    GAMES_CACHE.womens.pastGames.push(game);
                }

                if(isACCGame) {
                    GAMES_CACHE.womens.conferenceGames.push(game);
                }
                break;
        }
    }
}

(async function _INIT_SERVER_CACHES() {
    await _FETCH_BASKETBALL_DATA(FETCH_CMDS.mens);
    await _FETCH_BASKETBALL_DATA(FETCH_CMDS.womens);
    setTimeout(_INIT_SERVER_CACHES, SERVER_SCRAPE_INTERVAL);
})();

bballServer.listen(BBALL_SERVER_PORT);