const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API Gateway Running'));

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));
