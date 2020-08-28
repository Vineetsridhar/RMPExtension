//#region Imports
const { Pool } = require('pg')
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLFloat
} = require('graphql')
//#endregion Imports

//#region Define initial variables
require('dotenv').config()
const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DB,
    password: process.env.DBPSSWD,
    port: 5432,
});
const PROFESSORTABLE = "teachers";
//#endregion

//#region Define interfaces
interface Professor{
    tid:number,
    name:string,
    department:string
}
//#endregion

//#region SQL Queries
async function makeQuery(query: string) {
    try {
        let result = await pool.query(query);
        return result["rows"];
    } catch (err) {
        console.log("Error completing SQL Query");
    }
}
//#endregion

//#region Define GraphQL Objects
const ProfessorType = new GraphQLObjectType({
    name: 'Professor',
    description: 'This object represents a Professor',
    fields: () => ({
        tid:{type:GraphQLNonNull(GraphQLInt)},
        name:{type:GraphQLNonNull(GraphQLString)},
        department:{type:GraphQLNonNull(GraphQLString)}
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        professor: {
            type: GraphQLList(ProfessorType),
            description: 'Singular professor query',
            args: {
                query: { type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (_: Professor, args: { query: string }) => 
                await makeQuery(`SELECT * FROM ${PROFESSORTABLE} WHERE LOWER(name) LIKE '%${args.query.toLowerCase()}%'`)
            
        },
        professors: {
            type: GraphQLList(ProfessorType),
            description: 'All professors query',
            resolve: async () => (await makeQuery(`SELECT * FROM ${PROFESSORTABLE}`))
        },
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType
})
//#endregion

module.exports = schema