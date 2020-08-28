import express = require('express');
const { graphqlHTTP } = require("express-graphql");
import schema = require('./graphql');

const app = express();
const port = 5000;  

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}))

app.listen(port, () => {
    console.log(`Server has been started on port ${port}`)
});
