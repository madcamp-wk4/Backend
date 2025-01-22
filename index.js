const express = require("express");
const bodyParser = require("body-parser");
const dateRecordsRoutes = require("./routes/dateRecords");
const messageRoutes = require("./routes/message");
const messageAnalysisRoutes = require("./routes/messageAnalysis");
const setupSwagger = require("./swagger");
const login = require('./routes/login')
const signup = require('./routes/signup')
const loverProfile = require('./routes/loverProfile')
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
app.use("/login", login)
app.use("/signup", signup)
app.use("/profile/lover", loverProfile)

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