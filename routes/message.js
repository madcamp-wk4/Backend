const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// 메시지 저장 API
router.post("/", async (req, res) => {
  const { userId, text, dateRecordId } = req.body;

  try {
    // `Messages` 모델에 데이터 저장
    const newMessage = await prisma.messages.create({
      data: {
        userId,
        text,
        dateRecordId,
      },
    });

    res.status(201).json({
      message: "Message saved successfully!",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({
      message: "Failed to save message.",
      error: error.message,
    });
  }
});

module.exports = router;