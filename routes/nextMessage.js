const express = require("express");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 카테고리 순서 정의
const QUESTION_CATEGORIES = ["LOCATION", "ACTIVITY", "EMOTION_ME", "EMOTION_YOU", "UPDATE"];

// Next Question 생성 API
router.post("/generate-next-question", async (req, res) => {
  const { userId } = req.body;

  try {
    // Step 1: 이전 메시지 분석 데이터 가져오기
    console.log("Fetching analyzed messages...");
    const analyzedMessages = await prisma.messageAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const answeredCategories = new Set(analyzedMessages.map((msg) => msg.category));
    console.log("Answered categories:", answeredCategories);

    // Step 2: 다음 질문해야 할 카테고리 결정
    const nextCategory = QUESTION_CATEGORIES.find((category) => !answeredCategories.has(category));
    if (!nextCategory) {
      console.log("All categories have been answered.");
      return res.status(200).json({ message: "All questions are answered!" });
    }

    console.log("Next category to ask:", nextCategory);

    // Step 3: Gemini API 요청 생성
    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `다음은 유저가 이전에 답변한 카테고리와 요약 내용입니다:
              ${analyzedMessages
                .map((msg) => `- ${msg.category}: ${msg.extractedData}`)
                .join("\n")}

              다음 카테고리를 기반으로 질문을 생성하세요:
              - 남은 카테고리 순서: ${QUESTION_CATEGORIES.filter(
                (cat) => !answeredCategories.has(cat)
              ).join(", ")}
              
              다음 형식으로 답변하세요:
              - 다음 질문할 카테고리: (카테고리 이름)
              - 질문 내용: (유저에게 다음으로 물어볼 질문)`,
            },
          ],
        },
      ],
    };

    console.log("Gemini Payload:", geminiPayload);

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      geminiPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    const geminiContent =
      geminiResponse.data.candidates[0]?.content?.parts[0]?.text || "";

    console.log("Gemini Response:", geminiContent);

    // Step 4: 응답 파싱
    const [nextCategoryLine, questionLine] = geminiContent.split("\n").map((line) => line.trim());
    const category = nextCategoryLine.replace("- 다음 질문할 카테고리: ", "").trim();
    const questionText = questionLine.replace("- 질문 내용: ", "").trim();

    // Step 5: NextQuestions에 저장
    console.log("Saving next question to database...");
    const newQuestion = await prisma.nextQuestions.create({
      data: {
        userId,
        question: questionText,
        category,
      },
    });

    console.log("Next question saved successfully:", newQuestion);

    res.status(201).json({
      message: "Next question generated successfully!",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error generating next question:", error.message);
    res.status(500).json({
      message: "Failed to generate next question.",
      error: error.message,
    });
  }
});

module.exports = router;
