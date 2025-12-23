const PATH = require('path');
const env = require('dotenv');
env.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT;

app.use(express.static(PATH.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(PATH.join(__dirname, '../public/index.html'));
});

app.get('/pages/student', (req, res) => {
    res.sendFile(PATH.join(__dirname, '../public/pages/student.html'));
});

app.get('/pages/faculty', (req, res) => {
    res.sendFile(PATH.join(__dirname, '../public/pages/faculty.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(PATH.join(__dirname, '../public/pages/404.html'));
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});