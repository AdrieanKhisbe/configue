const express = require('express');
const Configue = require('configue');

const configue = new Configue();

const app = express();

app.use(configue.middleware());

app.get('/', function (req, res) {
    res.send(`Hello ${req.configue('who', 'World')}!`);
});

const port = configue.get('port', 3000);
app.listen(port, () => {
    console.log(`Server running at: ${port}`);
    console.log(configue.t({who: 'World'})`With "who" as ${'who'}`);
});