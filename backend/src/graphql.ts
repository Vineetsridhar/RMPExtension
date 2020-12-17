//#region Imports
const { Pool } = require("pg");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLDate,
} = require("graphql");
import scrapeURL = require("./webscraper");
//#endregion Imports

//#region Define initial variables
require("dotenv").config();
const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DB,
  password: process.env.DBPSSWD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  let retries = 8;
  while (retries) {
    try {
      await pool.connect();
      console.log("Connected!");
      break;
    } catch (err) {
      console.log("retrying", err);
      retries--;
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}
// startServer();

const BASEURL = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=";
const PROFESSORTABLE = "teachers";
const RATINGSTABLE = "professor_ratings";
//#endregion

//#region Define interfaces
interface Professor {
  tid: number;
  name: string;
  department: string;
}
interface Rating {
  tid: number;
  rating: number;
  difficulty: number;
  retake: number;
  numratings: number;
}
//#endregion

//#region SQL Queries
async function makeQuery(query: string) {
  try {
    let result = await pool.query(query);
    return result["rows"];
  } catch (err) {
    console.log("Error completing SQL Query", err);
    return [];
  }
}
//#endregion

//#region Define GraphQL Objects
const RatingType = new GraphQLObjectType({
  name: "Rating",
  description: "This object represents a professor rating",
  fields: () => ({
    tid: { type: GraphQLNonNull(GraphQLInt) },
    retake: { type: GraphQLNonNull(GraphQLInt) },
    difficulty: { type: GraphQLNonNull(GraphQLFloat) },
    rating: { type: GraphQLNonNull(GraphQLFloat) },
    numratings: { type: GraphQLNonNull(GraphQLInt) },
    updated: { type: GraphQLString },
  }),
});

const ProfessorType = new GraphQLObjectType({
  name: "Professor",
  description: "This object represents a Professor",
  fields: () => ({
    tid: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    department: { type: GraphQLNonNull(GraphQLString) },
    rating: {
      type: RatingType,
      description: "Get ratings of a professor",
      resolve: async (professor: Professor) => {
        //Look for ratings in DB
        let found = false;
        let row = await makeQuery(
          `SELECT * FROM ${RATINGSTABLE} WHERE tid = ${professor.tid}`
        );
        if (row.length) {
          let updatedDate = new Date(row[0]["updated"]);
          let today = new Date();
          today.setHours(0, 0, 0, 0);
          found = true;
          //Only use saved data if the data was updated today
          if (updatedDate > today) {
            return row[0];
          }
        }
        try {
          //Scrape the data from Rate my professor and save it in DB for future use
          let data = await scrapeURL(BASEURL + professor.tid);
          let query = "";
          //If item exists, then update the date
          if (found)
            query = `
                        UPDATE ${RATINGSTABLE}
                        SET updated='NOW()', retake=${data.retake}, difficulty=${data.difficulty}, rating=${data.rating}, numratings=${data.numratings}
                        WHERE TID = ${professor.tid};`;
          else
            query = `INSERT INTO ${RATINGSTABLE} VALUES (${professor.tid}, ${data.retake}, ${data.difficulty}, NOW(), ${data.rating}, ${data.numratings})`;
          makeQuery(query);
          data["tid"] = professor.tid;
          data["updated"] = Date.now();
          return data;
        } catch (err) {
          console.log(err);
          console.log(`Professor: ${professor.name}`);
          throw err;
        }
      },
    },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    professor: {
      type: GraphQLList(ProfessorType),
      description: "Singular professor query",
      args: {
        query: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_: Professor, args: { query: string }) =>
        await makeQuery(
          `SELECT * FROM ${PROFESSORTABLE} WHERE LOWER(name) LIKE '%${args.query.toLowerCase()}%'`
        ),
    },
    professors: {
      type: GraphQLList(ProfessorType),
      description: "All professors query",
      resolve: async () => await makeQuery(`SELECT * FROM ${PROFESSORTABLE}`),
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});
//#endregion

module.exports = schema;
