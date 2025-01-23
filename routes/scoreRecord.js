const express = require("express");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined. Check your .env file.");
}

// 라우트: /score-record
router.post("/", async (req, res) => {
  const { recordId } = req.body;

  try {
    // Step 1: recordId에 해당하는 모든 메시지 가져오기
    const analyzedMessages = await prisma.messageAnalysis.findMany({
      where: {
        message: {
          dateRecordId: recordId,
        },
      },
      include: {
        message: true,
      },
    });

    if (analyzedMessages.length === 0) {
      return res.status(404).json({ message: "No analyzed messages found for the given recordId." });
    }

    console.log(`Fetched ${analyzedMessages.length} analyzed messages for recordId: ${recordId}`);

    // 메시지 합치기
    const concatenatedMessages = analyzedMessages
      .map((analysis) => analysis.message.text)
      .join("\n");

    // Step 2: 대분류 및 소분류 요청 (Gemini API)
    const classificationPayload = {
      contents: [
        {
          parts: [
            {
              text: `다음 메시지는 하나의 데이트를 설명하기 위한 것입니다. 제공된 메시지 내용을 바탕으로 대분류와 소분류를 결정해주세요.\n\n` +
                `메시지 내용:\n` +
                concatenatedMessages +
                `\n\n분류 기준:\n` +
                `대분류 1: 활동 유형 (Activity Type)\n` +
                `대분류 2: 장소 (Location)\n` +
                `소분류 1: 분위기 (Mood)\n` +
                `소분류 2: 목적 (Purpose)`
            },
          ],
        },
      ],
    };

    const classificationResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      classificationPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    const classificationContent =
      classificationResponse.data.candidates[0]?.content?.parts[0]?.text || "";

    console.log("Classification Response:", classificationContent);

    const lines = classificationContent.split("\n\n");

    // 각 줄에서 필요한 정보를 추출합니다.
    const mainCategory1 = lines.find(line => line.includes("대분류 1"))?.split("**")[2]?.trim() || "N/A";
    const mainCategory2 = lines.find(line => line.includes("대분류 2"))?.split("**")[2]?.trim() || "N/A";
    const subCategory1 = lines.find(line => line.includes("소분류 1"))?.split("**")[2]?.trim() || "N/A";
    const subCategory2 = lines.find(line => line.includes("소분류 2"))?.split("**")[2]?.trim() || "N/A";
    
    // 결과를 출력하거나 사용할 수 있습니다.
    console.log("Parsed Categories:");
    console.log("Main Category 1:", mainCategory1);
    console.log("Main Category 2:", mainCategory2);
    console.log("Sub Category 1:", subCategory1);
    console.log("Sub Category 2:", subCategory2);

    // Step 3: 채점 요청 (Gemini API)
    const scoringPayload = {
      contents: [
        {
          parts: [
            {
              text: `다음 메시지는 하나의 데이트에 대한 설명입니다. 제공된 메시지 내용을 바탕으로 채점 기준에 따라 점수를 매기고(총점이라는 용어를 꼭 쓰고) 이유를 작성해주세요.\n\n` +
                '다음은 대이트 평가 양식 입니다. 이렇게 양식을 작성하세요\n' +
                '## 데이트 평가\n' +
                '**1. 감정적 만족도 (Emotional Satisfaction): ?/10**\n' +
                '* **긍정적 측면:** \n' +
                '* **부정적 측면:** \n' +
                '**2. 대화의 흐름과 공감 (Communication & Empathy): ?/10**\n' +
                '* **긍정적 측면:** \n' +
                '* **부정적 측면:**  \n' +
                '**3. 데이트 장소와 활동의 적합성 (Venue & Activity Fit): ?/10**\n' +
                '* **긍정적 측면:**  \n' +
                '* **부정적 측면:** \n' +
                '**4. 서로에 대한 배려와 존중 (Respect & Consideration): ?/10**\n' +
                '* **긍정적 측면:** \n' +
                '* **부정적 측면:** \n' +
                '**5. 물리적 & 심리적 편안함 (Comfort & Ease): ?/10**\n' +
                '* **긍정적 측면:** \n' +
                '* **부정적 측면:** \n' +
                '**6. 기대와 현실의 조화 (Expectation vs. Reality): ?/10**\n' +
                '* **긍정적 측면:** \n' +
                '* **부정적 측면:** \n' +
                '**추가적인 체크포인트:**\n' +
                '**총점:**  평균 ?/10\n' +
                '**결론:** \n' +
                `메시지 내용:\n` +
                concatenatedMessages +
                `\n\n채점 기준:\n` +
                '1. 감정적 만족도 (Emotional Satisfaction): 서로 즐거웠는지, 공감이 오갔는지, 감정적으로 편안했는지 MBTI 유형별 고려점\n' +
                'F(감정형): 감정적인 교감과 공감이 충분했는지\n' +
                'T(사고형): 논리적인 대화가 자연스럽고 지적인 자극이 있었는지\n' +
                '2. 대화의 흐름과 공감 (Communication & Empathy): 대화가 자연스럽고 어색하지 않았는지 서로의 의견을 존중하며 경청했는지 MBTI 유형별 고려점\n' +
                'E(외향형): 활발한 대화와 즉흥적인 리액션이 있었는지\n' +
                'I(내향형): 깊이 있는 대화가 이루어졌는지\n' +
                '3. 데이트 장소와 활동의 적합성 (Venue & Activity Fit): 상대방의 성향에 맞는 장소/활동이었는지 새로운 경험이 긍정적으로 작용했는지 MBTI 유형별 고려점\n' +
                'S(감각형): 현실적이고 오감을 자극하는 활동(맛집, 영화, 여행 등)이 적절했는지\n' +
                'N(직관형): 창의적이거나 새로운 경험(전시회, 심도 깊은 토론 등)이 있었는지\n' +
                '4. 서로에 대한 배려와 존중 (Respect & Consideration): 서로 예의를 갖추고 배려했는지 상대방의 취향을 존중했는지 MBTI 유형별 고려점\n' +
                'J(판단형): 계획된 일정이 원활하게 진행되었는지\n' +
                'P(인식형): 즉흥적인 변화에도 유연하게 대처했는지\n' +
                '5. 물리적 & 심리적 편안함 (Comfort & Ease): 데이트 중 불편함 없이 자연스러웠는지 서로 부담을 느끼지 않았는지 MBTI 유형별 고려점\n' +
                'I(내향형): 혼잡하거나 지나치게 활동적인 일정이 부담스럽지 않았는지\n' +
                'E(외향형): 지나치게 조용하거나 정적인 일정이 지루하지 않았는지\n' +
                '6. 기대와 현실의 조화 (Expectation vs. Reality): 기대했던 데이트와 실제 데이트가 크게 다르지 않았는지 예상치 못한 상황에서도 긍정적으로 해결했는지\n' +
                '추가적인 체크포인트: 데이트 이후의 반응: 연락이 지속되거나 긍정적인 피드백이 있었는지 재미 요소: 함께 웃거나 유쾌한 순간이 많았는지 서로에게 끌림: 외모, 성격, 가치관 등이 긍정적으로 다가왔는지',
            },
          ],
        },
      ],
    };

    const scoringResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      scoringPayload,
      { headers: { "Content-Type": "application/json" } }
    );
    
    const scoringContent =
      scoringResponse.data.candidates[0]?.content?.parts[0]?.text || "";
    
    console.log("Scoring Response:", scoringContent);
    
    // 총점 줄과 나머지 분리
    const totalScoreMatch = scoringContent.match(/\*\*총점:\*\*.*?\d+\/\d+/);
    let aiScore = "N/A";
    let reason = scoringContent;
    
    if (totalScoreMatch) {
      aiScore = totalScoreMatch[0]; // 총점 줄 전체 저장
      console.log("Extracted Total Score Line:", aiScore);
    
      // reason에서 총점 줄 제거
      reason = scoringContent.replace(aiScore, "").trim();
    } else {
      console.error("Failed to extract total score. Scoring content format may be incorrect.");
    }
    
    console.log("AI Score:", aiScore);
    console.log("Reason:", reason);
    
    // Step 4: DB 저장 (DateAnalysisRequest 및 DateAnalysisResult)
    const newRequest = await prisma.dateAnalysisRequest.create({
      data: {
        recordId,
        message_total: concatenatedMessages,
        status: "completed",
      },
    });
    
    const newResult = await prisma.dateAnalysisResult.create({
      data: {
        requestId: newRequest.requestId,
        mainCategory1: mainCategory1 || "N/A",
        mainCategory2: mainCategory2 || "N/A",
        subCategory1: subCategory1 || "N/A",
        subCategory2: subCategory2 || "N/A",
        aiScore, // 총점 줄 전체 저장
        reason,  // 총점 줄을 제외한 나머지 내용
      },
    });
    
    console.log("Saved Results:", { newRequest, newResult });    

    // 응답 반환
    res.status(201).json({
      message: "Scoring and classification completed successfully!",
      data: { request: newRequest, result: newResult },
    });
  } catch (error) {
    console.error("Error processing scoring and classification:", error.message);
    res.status(500).json({
      message: "Failed to process scoring and classification.",
      error: error.message,
    });
  }
});

module.exports = router;
