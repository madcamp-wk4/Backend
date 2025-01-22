const express = require("express");
const bodyParser = require("body-parser");
const dateRecordsRoutes = require("./routes/dateRecords");
const messageRoutes = require("./routes/message");
const messageAnalysisRoutes = require("./routes/messageAnalysis");
const scoreRecordRoutes = require("./routes/scoreRecord"); // "채점" 라우트로 변경

const setupSwagger = require("./swagger");
require("dotenv").config(); // 환경변수 중요
const cors = require("cors");
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Routes
app.use("/date-records", dateRecordsRoutes);
app.use("/messages", messageRoutes);
app.use("/message-analysis", messageAnalysisRoutes);
app.use("/score-record", scoreRecordRoutes); // 경로 추가

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the DateRecords API");
});

// Swagger UI
setupSwagger(app);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});