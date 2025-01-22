const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// 라우터 가져오기
const signupRoutes = require('./login/signup'); // 경로 확인
const loginRoutes = require('./login/login'); // 경로 확인

// 기본 경로
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

app.get('/hello', (req, res) => {
    res.send("TEST FOR")
})

// API 경로 설정
app.use('/signIn', signupRoutes); // 회원가입 라우트 연결
app.use('/login', loginRoutes);   // 로그인 라우트 연결

// 데이터베이스 연결 테스트
testConnection();


// 서버 실행
//const HOST = '13.124.6.237'; // 배포된 서버의 IP 주소 : main에서만 테스트할 수 있음 
const PORT = 3000;          // 사용할 포트 번호

app.listen(PORT);