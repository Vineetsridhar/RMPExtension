import express = require('express');
const { graphqlHTTP } = require("express-graphql");
import schema = require('./graphql');
const cors = require('cors')
const app = express();
const port = 5000;
app.options('*', cors())

const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true)
    } 
}
app.use('/graphql', cors(corsOptions), graphqlHTTP({
    schema,
    graphiql: true
}))

app.listen(port, () => {
    console.log(`Server has been started on port ${port}`)
});
