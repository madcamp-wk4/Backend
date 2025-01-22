const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// DateRecords 생성 API
router.post("/", async (req, res) => {
  const { userId, image_url, date, summarize, location, activity, messages } = req.body;

  try {
    const newDateRecord = await prisma.dateRecords.create({
      data: {
        userId,
        image_url,
        date: new Date(date),
        summarize,
        location,
        activity,
        Message: {
          create: messages.map((message) => ({
            userId,
            text: message.text,
          })),
        },
      },
    });

    res.status(200).json({
      message: "Date record created successfully!",
      data: newDateRecord,
    });
  } catch (error) {
    console.error("Error creating DateRecord:", error);
    res.status(400).json({
      message: "Error creating DateRecord",
      error: error.message,
    });
  }
});

module.exports = router;