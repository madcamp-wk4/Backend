const express = require("express");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const router = express.Router();

// 환경 변수에서 Gemini API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined. Check your .env file.');
}

// 메시지 분석 API
router.post("/analyze-message", async (req, res) => {
  const { messageId } = req.body;

  try {
    // Step 1: 메시지 가져오기
    console.log("Fetching message for analysis...");
    const message = await prisma.messages.findUnique({
      where: { messageId },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    console.log("Message fetched:", message);

    // Step 2: Gemini API 요청 생성
    const geminiPayload = {
        contents: [
          {
            parts: [
              {
                text: `다음 메시지를 분석하고 제일 근접한 한 개의 카테고리와 요약 데이터를 생성하세요:
                [메시지 내용]
                ${message.text}
                
                가능한 카테고리:
                - LOCATION: 메시지가 특정 위치 또는 장소와 관련이 있다면 이 카테고리에 배치합니다.
                - ACTIVITY: 메시지에서 전반적인 활동이 두드러지고, 감정보다는 활동의 기술이 많다면 이 카테고리에 분류합니다.
                - EMOTION_ME: 메시지에서 "나"의 감정 표현이 두드러지고, 상대방에 대한 감정 표현보다 "나의 기분, 감정, 생각"에 초점이 맞춰져 있다면 이 카테고리에 배치합니다.
                - EMOTION_YOU: 메시지에서 "썸녀 혹은 여친"의 감정, 기분, 반응에 대한 내용이 주를 이룬다면 이 카테고리에 배치합니다. 상대방의 감정이나 태도를 구체적으로 묘사한 경우 이 카테고리를 선택하세요.
                - UPDATE: 메시지가 장소, 활동, 감정이 아닌, 상대방에 대한 기억해야 할 추가적인 정보(TMI)가 주를 이룬다면 이 카테고리에 배치합니다.
                - NOTHING: 위의 어떤 카테고리에도 해당하지 않는 경우 이 카테고리를 선택합니다.
                
                분석 결과를 다음 형식으로 반환하세요:
                
                - 카테고리: (카테고리 이름)
                - 요약: (메시지에 대한 간략한 분석 결과)`
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

    // Step 3: 응답 파싱
    const [categoryLine, extractedDataLine] = geminiContent.split("\n").map((line) => line.trim());
    const category = categoryLine.replace("- 카테고리: ", "").trim();
    const extractedData = extractedDataLine.replace("- 요약: ", "").trim();

    // Step 4: MessageAnalysis에 저장
    console.log("Saving analysis result to database...");
    const newAnalysis = await prisma.messageAnalysis.create({
      data: {
        userId: message.userId,
        messageId: message.messageId,
        category,
        extractedData,
      },
    });

    console.log("Analysis saved successfully:", newAnalysis);

    res.status(201).json({
      message: "Message analyzed successfully!",
      data: newAnalysis,
    });
  } catch (error) {
    console.error("Error analyzing message:", error.message);
    res.status(500).json({
      message: "Failed to analyze message.",
      error: error.message,
    });
  }
});

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