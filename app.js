const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("system is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`server got error at:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1:Returns a list of all the players in the player table
const convertDBObject = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const getPlayerQueryRes = await db.all(getPlayersQuery);
  response.send(getPlayerQueryRes.map((item) => convertDBObject(item)));
});

//API 2:Returns a specific player based on the player ID

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const getPlayersQueryRes = await db.get(getPlayersQuery);
  response.send(convertDBObject(getPlayersQueryRes));
});

//API 3:Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET 
    player_name='${playerName}' where player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4:Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const getMatchQueryRes = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(getMatchQueryRes));
});

//API 5:Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchPlayerQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details 
  WHERE player_id=${playerId};`;
  const matchPlayerQueryRes = await db.all(matchPlayerQuery);
  response.send(
    matchPlayerQueryRes.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

//API6 :Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const returnPlayerQuery = `
   SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const returnPlayerQueryRes = await db.all(returnPlayerQuery);
  response.send(
    returnPlayerQueryRes.map((eachPlayer) => convertDBObject(eachPlayer))
  );
});
//API 7:Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
  SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const getStatisticsQueryRes = await db.get(getStatisticsQuery);
  response.send(getStatisticsQueryRes);
});
module.exports = app;