const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000/....");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET ALL
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state
    ORDER BY state_id;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//get individual
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//post
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const district = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//get individual
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};`;
  const districts = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(districts));
});

//get all ***
app.get("/districts/", async (request, response) => {
  const getDistrictQuery = `
    SELECT * FROM district
    ORDER BY district_id;`;
  const stateArray = await db.all(getDistrictQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//delete
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDeleteQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.run(districtDeleteQuery);
  response.send("District Removed");
});

//put
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtUpdateQuery = `UPDATE district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_Id = ${districtId};`;
  const districts = await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

//get individual total cases,cured,active,deaths
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT SUM(district.cases) AS totalCases,
      SUM(district.cured) AS totalCured,
      SUM(district.active) AS totalActive,
      SUM(district.deaths) AS totalDeaths
    FROM district LEFT JOIN state
        ON state.state_id = district.district_id
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//get individual stateName
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT DISTINCT state.state_name AS stateName
     FROM district LEFT JOIN state
     ON state.state_id = district.state_id
    WHERE district_id = ${districtId};`;
  const state = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(state));
});
