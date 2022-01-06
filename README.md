# NC State Basketball Scraper
Backend for the Sidekick basketball app, implemented using Node.js and hosted on Heroku.

## How To Use
The API returns JSON data scraped from the Sidearm Sports GoPack basketball websites for both NC State Men's and Women's basketball, depending on the provided parameters.
```
Endpoint
    Method    GET
    Name      games

Parameters:
    mensGames             Configures JSON return for men's games
    womensGames           Configures JSON return for women's games
    allGames              Returns all game data for the current season, including past and upcoming games
    upcomingGames         Returns all upcoming game data, can be combined with CONFERENCE_GAMES parameter
    pastGames             Returns all past game data, can be combined with WON_GAMES, LOST_GAMES, CONFERENCE_GAMES parameters
    wonGames              Returns all won games, can be combined with PAST_GAMES, CONFERENCE_GAMES parameters
    lostGames             Returns all lost games, can be combined with PAST_GAMES, CONFERENCE_GAMES parameters
    conferenceGames       Returns all conference games, can be combined with PAST_GAMES, WON_GAMES, LOST_GAMES parameters
```

**Example**

Returns all won, past games for the Men's basketball team
```
https://ncstate-bball-api.herokuapp.com/games?mensGame=true&womensGame=false&allGames=false&upcomingGames=false&pastGames=true&wonGames=true&lostGames=false&conferenceGames=false
```
