// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser')

// // Express 라우터
// app.get('/', (req, res) => {
//   res.send('Hello, Express!');
// });

// app.use(bodyParser.json());

// const loginRoutes = require('./login/login')
// const signupRoutes = require('./login/signup')

// // api request mapping 주소 설정 
// app.use('member/signIn', signupRoutes)
// app.use('member/login', loginRoutes)


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
app.use('/member/signIn', signupRoutes); // 회원가입 라우트 연결
app.use('/member/login', loginRoutes);   // 로그인 라우트 연결

// 서버 실행
const HOST = '13.124.6.237'; // 배포된 서버의 IP 주소
const PORT = 3000;          // 사용할 포트 번호

app.listen(PORT, HOST);