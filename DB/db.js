require('dotenv').config();

const mysql = require('mysql2/promise'); 
const pool = mysql.createPool({
  host:"madcamp-wk4-db.cv3dstdglqkx.ap-northeast-2.rds.amazonaws.com",
  user: "root",
  password: "madcamp-wk4-0118",
  database: "withYou" 
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connected successfully');
    connection.release(); // 연결 해제
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

module.exports = {
  testConnection,
  pool,
};
