
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();
const router = express.Router();

const getOppositeUserName = async (userId) => {
    const usernameQ = await prisma.lover.findFirst({
        where: {
            OR: [
                { user1Id: userId }, // userId가 user1Id와 같을 때
                { user2Id: userId }, // userId가 user2Id와 같을 때
            ],
        },
        include: {
            user1: {
                select: { name: true }, // user1Id의 이름
            },
            user2: {
                select: { name: true }, // user2Id의 이름
            },
        },
    });

    if (usernameQ) {
        if (usernameQ.user1Id === userId) {
            return usernameQ.user2?.name || "No name found for user2";
        }

        if (usernameQ.user2Id === userId) {
            return usernameQ.user1?.name || "No name found for user1";
        }
    }

    return "No matching record found";
};


router.post('/loveToRemember', async (req, res) => {
    const { dateRecordId, userId} = req.body;

    try {
        // Step 1: 특정 dateRecordId와 관련된 모든 메시지 가져오기
        console.log("STEP 1) 메시지 가져오기");
        const messages = await prisma.messages.findMany({
            where: { dateRecordId },
            select: { text: true }, // 메시지 내용만 가져오기
        });

        if (!messages || messages.length === 0) {
            return res.status(404).json({ message: "Messages Not Found" });
        }

        const combinedMessages = messages.map(msg => msg.text).join("\n");

        // Step 2: GEMINI API 요청 생성
        console.log("STEP 2 - GEMINI API 요청 생성");
        const geminiPayload = {
            contents: [
                {
                    parts: [
                        {
                            text: `다음 메시지를 분석하고 다음 데이트를 위해 내가 알아야 할 점과 상대의 특징을 알려주세요:
                            ${combinedMessages}
                            
                            
                            [분석 결과 형식은 아래로 맞춰줘, 그리고 특수문자는 없애서 정리해줘(핵심적인 4줄 이내로, 되도록 짧게) 파싱할 수 있게 쉽게 형식에 맞추란 말이야]
                            toRemember : 결론, 결론, .../feature : 결론, 결론,....`
                        },
                    ],
                },
            ],
        };
        // Step 3: GEMINI API 호출
        console.log("STEP 3) GEMINI API 호출");
        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            geminiPayload,
            { headers: { "Content-Type": "application/json" } }
        );

        const geminiContent =
      geminiResponse.data.candidates[0]?.content?.parts[0]?.text || "";

        console.log("Gemini Response:", geminiContent);

        // 결과 응답
        
        const parseGeminiContent = (text) => {
            // 줄바꿈과 공백을 처리한 뒤 `toRemember`와 `feature` 추출
            const lines = text.split("\n").map((line) => line.trim()).filter(line => line !== "");
            
            const categoryLine = lines.find(line => line.startsWith("toRemember :"));
            const extractedDataLine = lines.find(line => line.startsWith("feature :"));
        
            // 각 항목에서 접두어 제거 및 결과 정리
            const rememberResult = categoryLine ? categoryLine.replace("toRemember :", "").trim() : null;
            const featureResult = extractedDataLine ? extractedDataLine.replace("feature :", "").trim() : null;
        
            return { rememberResult, featureResult };
        };

        const { rememberResult, featureResult } = parseGeminiContent(geminiContent);
        
        console.log("-- remember is", rememberResult, "--- feature is", featureResult);
        
        
        const saveToDatabase = async (userId, remember, feature) => {
            try {
                // 데이터 저장
                const opposite = await getOppositeUserName(userId)
                await prisma.loverProfile.create({
                    data: {
                        userId: userId, // 유저 ID
                        memorize: remember, // 기억할 점
                        feature: feature, // 특징
                        name : opposite
                    },
                });
        
                console.log("데이터 저장 성공");
            } catch (error) {
                console.error("데이터 저장 실패:", error.message);
                throw new Error("Failed to save data to the database");
            }
        };
        await saveToDatabase(userId, rememberResult, featureResult)
        return res.status(201).json({ geminiResult: geminiResponse.data});
    }
    catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({ message: error.message });
    }

});

router.post('/getName', async (req, res) => {
    const { userId } = req.body;

    const getOppositeUserName = async (userId) => {
        try {
            // Lover 테이블에서 userId와 관련된 관계를 찾음
            const loverRecord = await prisma.lover.findFirst({
                where: {
                    OR: [
                        { user1Id: userId }, // userId가 user1Id와 같은 경우
                        { user2Id: userId }, // userId가 user2Id와 같은 경우
                    ],
                },
            });

            if (!loverRecord) {
                return "No matching record found";
            }

            console.log("Lover Record:", loverRecord);

            // userId가 user1Id 또는 user2Id인 경우에 따라 oppositeUserId 설정
            const oppositeUserId =
                loverRecord.user1Id === userId
                    ? loverRecord.user2Id // user1Id일 경우 user2Id를 가져옴
                    : loverRecord.user1Id; // user2Id일 경우 user1Id를 가져옴

            console.log("Opposite User ID:", oppositeUserId);

            // User 테이블에서 반대 유저의 이름 가져오기
            const oppositeUser = await prisma.user.findFirst({
                where: { user_id: oppositeUserId },
                select: { name: true },
            });
            console.log(oppositeUser.name)
            if (!oppositeUser) {
                return "No name found for the opposite user";
            }

            return oppositeUser.name; // 반대 유저의 이름 반환
        } catch (error) {
            console.error("Error fetching opposite user name:", error.message);
            throw new Error("Failed to fetch opposite user name");
        }
    };

    try {
        const result = await getOppositeUserName(userId);
        return res.status(200).json({ name: result });
    } catch (error) {
        console.error("Error in API:", error.message);
        return res.status(500).json({ error: error.message });
    }
});


router.post('/loveScore', async(req, res) =>{

    const { dateRecordId, userId} = req.body;

    try {
        // Step 1: 특정 dateRecordId와 관련된 모든 메시지 가져오기
        console.log("STEP 1) 메시지 가져오기");
        const messages = await prisma.messages.findMany({
            where: { dateRecordId },
            select: { text: true }, // 메시지 내용만 가져오기
        });

        if (!messages || messages.length === 0) {
            return res.status(404).json({ message: "Messages Not Found" });
        }

        const combinedMessages = messages.map(msg => msg.text).join("\n");

        // Step 2: GEMINI API 요청 생성
        console.log("STEP 2 - GEMINI API 요청 생성");
        const geminiPayload = {
            contents: [
                {
                    parts: [
                        {
                            text: `커플이 했던 데이트 기록을 보고 아래 기준에 맞게 어느 정도로 중요하게 생각하는지 형식에 맞게 판정해줘. 가장 높은 점수는 5점이고 가장 낮은 점수는 1점이야 그런데 여기서 중요한건 점수를 매기는 대상은 userId에 해당하는 사람이 아니라 상대방이야:
                            ${combinedMessages}
                            
                            1. skinship
                            : 스킨십은 손을 잡아주거나, 키스를 하거나, 가만히 안기는 등 신체 접촉을 통해서 사랑을 느끼는 방법 중 하나이다. 포옹이나 등 두드리기, 손잡기, 어깨나 팔, 얼굴 등을 만지는 것을 통해 자신의 감정을 표현하는 것을 좋아하고 받는 것을 좋아할수록 점수가 높다. 
                            2. admit
                            : 상대방의 자발적인 칭찬과 감사하는 말에 기쁨과 행복을 느낍니다. 따라서 '사랑해, 고마워, 잘했어' 등의 말을 듣는 것을 중요하게 생각한다. 이를 중요하게 여길수록 점수가 높다. 표현을 중요하게 느끼면, 이에 대해 감정변화가 클수록 높은 점수를 받는다. 
                            3. together_time
                            : 서로에게 집중하여 함께 있는 시간을 많이 가져야 사랑 받는다고 느낍니다. 이것을 더 중요하게 생각할수록 점수가 높아진다. 함께 시간을 나누면서 하는 일이 무엇인지는 별로 중요하지 않습니다.
                            다만 함께 시간을 보내는 사람이 소중하고 그 사람과 시간을 공유하지 못하면 애정결핍을 느끼게 됩니다. 단순히 시간만 함께 하는 것이 아니라 TV를 끄고, 하던 일을 멈추고, 자신에게 집중해 주는 것을 원합니다.
                            4. present
                            : 상징적인 의미를 지닌 물건을 통해 사랑을 확인받는 사람들로 이것으로 인해 감정변화가 크고 좋아하면 점수가 높다. 상대방이 준 선물을 특별하게 기억하고 간직하기 때문에 선물을 주고받는 것을 좋아할수록 점수가 높다. 
                            이 사람은 선물에 담겨있는 사랑과 사려 깊음 선물을 준비하기까지의 관심과 노력을 소중하게 생각하는 사람들이 높은 점수를 가질 가능성이 크다. 
                            5. trust
                            : 서로 진실된 것을 말하고 숨기는 것 없이 솔직함이 중요하다고 생각하는 사람들이 이 점수가 높다. 신뢰로 인해 관계가 유지되므로 연인관계에서 신뢰를 깰만한 사건이 터져서 고민을 많이 하게 된다면 점수가 높다고 할 수 있다. 


                            [결론 정보 형식]
                            skinship:n, admit:n, together_time:n, present:n, trust:n
                            `
    
                        },
                    ],
                },
            ],
        };
        // Step 3: GEMINI API 호출
        console.log("STEP 3) GEMINI API 호출");
        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            geminiPayload,
            { headers: { "Content-Type": "application/json" } }
        );

        const geminiContent =
      geminiResponse.data.candidates[0]?.content?.parts[0]?.text || "";

        console.log("Gemini Response:", geminiContent);

        // 결과 응답
        
        const parseGeminiContent = (text) => {
            const scoreRegex = /(\w+):(\d+)/g;
            const scoresArray = [];
            let match;

            while ((match = scoreRegex.exec(text)) !== null) {
                const [_, category, score] = match;
                scoresArray.push(`${category}:${parseInt(score, 10)}`);
            }

            return scoresArray; // Return as an array of scores
        };

        const scores = parseGeminiContent(geminiContent);
        console.log(scores)

        

        // 데이터를 변환
        const result = Object.fromEntries(
        scores.map(item => {
            const [key, value] = item.split(":");
            return [key, parseInt(value, 10)];
        })
        );

        
        const saveToDatabase = async (userId) => {
            try {
                // Get the opposite user's name
                const opposite = await getOppositeUserName(userId)
                console.log("--- ", opposite)
                const id = await prisma.loverProfile.findFirst({
                    where : {userId : userId},
                    select : {loverProfileId : true}
                })
                
                // Update the database
                await prisma.loverProfile.update({
                    where: { loverProfileId: id.loverProfileId }, // Match he correct user by userId
                    data: {
                        trust: result["trust"],     // Use scores parsed from Gemini
                        togetherTime: result["together_time"],
                        present: result["present"],
                        admit: result["admit"],
                        skinship: result["skinship"],
                        name : opposite, 
                    },
                });
                
                console.log("데이터 저장 성공");
            } catch (error) {
                console.error("데이터 저장 실패:", error.message);
                throw new Error("Failed to save data to the database");
            }
        };
        await saveToDatabase(userId);
        return res.status(200).json({ result });
    }
    catch (error) {
        console.error("ERROR:", error.message);
        return res.status(500).json({ message: error.message });
    }
});


router.get('/getMyLoverInfo', async(req, res) => {
    const {userId} = req.body
    const loverInfo = await prisma.loverProfile.findMany({
        where: { userId: parseInt(userId, 10) },
        select: { 
            trust: true,
            togetherTime: true,
            present: true,
            admit: true,
            skinship: true,
            name: true,
            status : true,
            feature : true,
            memorize : true,
            location : true
        },
    })
    return res.status(201).json(loverInfo)
    
})

router.put('/editInfo', async (req, res) => {
    const { userId, name, status, skinship, trust, admit, present, together_time, feature, memorize } = req.body;

    try {
        // Validate request body
        if (!userId) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Fetch existing profile
        const existingProfile = await prisma.loverProfile.findFirst({
            where: { userId: userId },
        });

        if (!existingProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Merge existing data with new data
        const updatedData = {
            name: name || existingProfile.name,
            status: status || existingProfile.status,
            trust: trust !== undefined ? trust : existingProfile.trust,
            skinship: skinship !== undefined ? skinship : existingProfile.skinship,
            admit: admit !== undefined ? admit : existingProfile.admit,
            present: present !== undefined ? present : existingProfile.present,
            togetherTime: together_time !== undefined ? together_time : existingProfile.together_time,
            feature: feature 
                ? `${existingProfile.feature ? `${existingProfile.feature}, ` : ''}${feature}`.trim() 
                : existingProfile.feature,
            memorize: memorize 
                ? `${existingProfile.memorize ? `${existingProfile.memorize}, ` : ''}${memorize}`.trim() 
                : existingProfile.memorize,
        };

        // Update the profile
        const updatedProfile = await prisma.loverProfile.update({
            where: { loverProfileId: existingProfile.loverProfileId },
            data: updatedData,
        });

        return res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    } catch (error) {
        console.error("Error updating profile:", error.message);
        return res.status(500).json({ message: "Failed to update profile" });
    }
});


module.exports = router; 

