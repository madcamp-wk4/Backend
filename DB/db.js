require('dotenv').config();

const mysql = require('mysql2/promise'); // promise 기반 사용
const pool = mysql.createPool({
  host:"madcamp-wk4-db.cv3dstdglqkx.ap-northeast-2.rds.amazonaws.com",
  user: "root",
  password: "madcamp-wk4-0118",
  database: "withYou" 
});

// 연결 테스트 함수
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connected successfully');
    connection.release(); // 연결 해제
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

// pool과 testConnection을 내보내기
module.exports = {
  testConnection,
  pool,
};
