const express = require('express')
const app = express()
const axios = require('axios')
const { createClient } = require('redis')
const nodeEnv = process.env.NODE_ENV || 'deverlopment'

const client = createClient({
    url: 'redis://172.17.0.1:6379',
    // url: 'redis://localhost:6379',
})
client.on('error', err => console.log('connection error', err))

app.get("/noredis", async (req, res) => {

    let date = req.query.date;
    let fetch = await axios.get("https://covid19.ddc.moph.go.th/api/Cases/round-1to2-all");
    let data = fetch.data;
    let result = null;
    data.forEach((element) => {
        if (new Date(element.update_date).toLocaleDateString('th') === new Date(date).toLocaleDateString('th')) {
            result = element;
        }
    });
    result ? res.send(result) : res.status(404).json({ result: "Not found" });
});

app.get("/redis", async (req, res) => {
    await client.connect();
    const value = await client.get(req.query.date);
    if (value) {
        console.log('redis')
        res.send(value)
    } else {
        let date = req.query.date;
        let fetch = await axios.get("https://covid19.ddc.moph.go.th/api/Cases/round-1to2-all");
        let data = fetch.data;
        let result = null;
        data.forEach((element) => {
            if (new Date(element.update_date).toLocaleDateString('th') === new Date(date).toLocaleDateString('th')) {
                result = element;
            }
        });
        console.log('have no redis')
        res.send(result)
        await client.setEx(req.query.date, 10, JSON.stringify(result))
    }

    await client.disconnect();
});

app.get('/redis/clear', async (req, res) => {
    await client.connect()
    await client.del(req.query.date)
    await client.disconnect()
    res.send('deleted')
})

app.listen(3000, () => {
    console.log('start on 3000')
})