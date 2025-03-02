const express = require("express");
const bodyParser = require("body-parser");
const dateRecordsRoutes = require("./routes/dateRecords");
const messageRoutes = require("./routes/message");
const messageAnalysisRoutes = require("./routes/messageAnalysis");
const scoreRecordRoutes = require("./routes/scoreRecord"); // "채점" 라우트로 변경

const setupSwagger = require("./swagger");
const login = require("./routes/login");
const signup = require("./routes/signup");
const loverProfile = require("./routes/loverProfile");
const myProfile = require("./routes/myProfile");
require("dotenv").config(); // 환경변수 중요
const cors = require("cors");
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(cors({ origin: "*" }));

// Routes
app.use("/date-records", dateRecordsRoutes);
app.use("/messages", messageRoutes);
app.use("/message-analysis", messageAnalysisRoutes);
app.use("/login", login);
app.use("/signup", signup);
app.use("/profile/lover", loverProfile);
app.use("/myProfile", myProfile);
app.use("/score-record", scoreRecordRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the DateRecords API");
});

app.get("/", (req, res) => {
  res.send("Welcome to the DateRecords API");
});

app.get("/home", (req, res) => {
  res.send("TEST FOR HOME");
});

// Swagger UI
setupSwagger(app);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
