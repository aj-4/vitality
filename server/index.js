const express = require('express');
const app = express();
const dotenv = require('dotenv/config');

const axios = require('axios');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('../database/index');

const API_KEY = require('./config2');

app.use(morgan('combined'));
app.use(express.static('client/dist'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));

app.get('/', (req, res) => res.send('Hello, world!'));

app.post('/api', (req, response) => {

    let query = req.body.query;

    let reqURL = 
    `https://api.nal.usda.gov/ndb/search/?format=json&q=${query}&api_key=${process.env.API_TOKEN}&ds=Standard Reference`;

    axios(reqURL)
    .then(res => {
        let resArr = res.data.list.item;
        let exact = resArr.sort((a, b) => a.name.length - b.name.length)[0];
        let ndbno = exact.ndbno;

        let ndbURL = 
        `https://api.nal.usda.gov/ndb/reports/?ndbno=${ndbno}&api_key=${process.env.API_TOKEN}`
    axios(ndbURL)
    .then(res => {
        let nutrients = res.data.report.food.nutrients;
        console.log(res.data.report.food.nutrients[0].measures);
        let offName = res.data.report.food.name;
        nutrients = nutrients
        .filter(nutrient => {
            return nutrient.name === 'Carbohydrate, by difference' || 
            nutrient.name === 'Protein' || 
            nutrient.name === 'Total lipid (fat)';
        })
        .sort((a, b) => {
            return a.nutrient_id - b.nutrient_id;
        })
        .map(nutrient => {
            return nutrient.value;
        })
        response.send(JSON.stringify([offName, ...nutrients]));
    })
    .catch(err => err, 'error in RP');
}).catch(err => console.log(err));
});

app.route('/plate')
    .get((req, res) => {
        
        db.selectAll((results) => {
            console.log('results from db', results);
            res.send(JSON.stringify(results))
        })
        
    })
    .post((req, res) => {
        
        let item = req.body.item;
        console.log('reqbody', req.body.item, 'type is', typeof req.body.item);

        db.insertOne(item, data => console.log('success'))
        
    });

let PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));