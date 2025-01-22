const express = require('express');
const { testConnection } = require('./DB/db'); // testConnection 가져오기
require('dotenv').config();

const app = express();

// Express 라우터
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/hello', (req, res) => {
    res.send("TEST FOR")
})

// 데이터베이스 연결 테스트
testConnection();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
