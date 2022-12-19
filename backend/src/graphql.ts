//#region Imports
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLFloat,
} = require("graphql");
import fs = require("fs");
import scrapeURL = require("./webscraper");
//#endregion Imports

const BASEURL = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=";

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

const json_data: { [name: string]: Professor } = JSON.parse(
  fs.readFileSync("./src/parsed_teachers.json", "utf8")
);
const cached_data: { [tid: number]: Rating & { updated: number } } = {};

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
        let row = cached_data[professor.tid];

        if (row) {
          let updatedDate = new Date(row["updated"]);
          let today = new Date();
          today.setHours(0, 0, 0, 0);
          found = true;
          //Only use saved data if the data was updated today
          if (updatedDate > today) {
            return row;
          }
        }
        try {
          //Scrape the data from Rate my professor and save it in DB for future use
          let data = await scrapeURL(BASEURL + professor.tid);
          //If item exists, then update the date
          cached_data[professor.tid] = {
            updated: Date.now(),
            tid: professor.tid,
            retake: data.retake,
            difficulty: data.difficulty,
            rating: data.rating,
            numratings: data.numratings,
          };
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
      type: ProfessorType,
      description: "Singular professor query",
      args: {
        query: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_: Professor, args: { query: string }) =>
        json_data[args.query],
    },
    professors: {
      type: GraphQLList(ProfessorType),
      description: "All professors query",
      resolve: () => Object.values(json_data),
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});
//#endregion

module.exports = schema;
