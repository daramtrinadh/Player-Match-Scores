const express = require("express");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};
initializeDBAndServer();
const convertResponse = (dbResponse) => {
  return {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `select * from player_details order by player_id;`;
  const getPlayerArray = await db.all(getPlayersQuery);
  const convertDBServerResponse = getPlayerArray.map((eachPlayer) =>
    convertResponse(eachPlayer)
  );
  response.send(convertDBServerResponse);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select * from player_details where player_id=${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  response.send(convertResponse(getPlayer));
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const bodydetails = request.body;
  const { playerName } = bodydetails;
  const updateQuery = `update player_details set player_name='${playerName}' where player_id=${playerId};`;
  const updatedResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

const convertMatchDBResponse = (dbResponse) => {
  return {
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select * from match_details where match_id=${matchId};`;
  const getMatch = await db.get(getMatchQuery);
  response.send(convertMatchDBResponse(getMatch));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `SELECT match_details.match_id AS matchId, match_details.match, match_details.year
    FROM match_details
    JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;
  const getMatchesArray = await db.all(getMatchesQuery);
  response.send(getMatchesArray);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `select player_details.player_id as playerId,player_details.player_name as playerName from player_details join player_match_score on player_details.player_id=player_match_score.player_id where player_match_score.match_id=${matchId};`;
  const playerDetails = await db.all(getPlayerQuery);
  response.send(playerDetails);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatQuery = `SELECT
      player_details.player_id as playerId,
      player_details.player_name as playerName,
      SUM(player_match_score.score) as totalScore,
      SUM(player_match_score.fours) as totalFours,
      SUM(player_match_score.sixes) as totalSixes
    FROM
      player_details
      LEFT JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId}
    GROUP BY
      player_details.player_id, player_details.player_name;
  ;`;
  const getStatQuery = await db.get(getPlayerStatQuery);
  response.send(getStatQuery);
});
module.exports = app;
