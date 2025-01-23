const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

/* 편집 버튼 누르면 나의 정보 수정 */
router.put('/editInfo', async (req, res) => {
    const { userId, name, status, skinship, trust, admit, present, together_time, feature, summarize } = req.body;
  
    try {
      // Validate request body
      if (!userId || !name ) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existingProfile = await prisma.user.findFirst({
        where: { user_id: userId },
    });
  
      // Update user profile
      const updatedProfile = await prisma.user.update({
        where: { user_id: userId }, // Locate the profile by userId
        data: {
          name: name || existingProfile.name,
          status: status || existingProfile.status,
          trust: trust !== undefined ? trust : existingProfile.trust,
          skinship: skinship !== undefined ? skinship : existingProfile.skinship,
          admit: admit !== undefined ? admit : existingProfile.admit,
          present: present !== undefined ? present : existingProfile.present,
          together_time: together_time !== undefined ? together_time : existingProfile.together_time,
          feature: feature 
              ? `${existingProfile.feature ? `${existingProfile.feature}, ` : ''}${feature}`.trim() 
              : existingProfile.feature,
          summarize: summarize 
          ? `${existingProfile.summarize ? `${existingProfile.summarize}, ` : ''}${summarize}`.trim() 
          : existingProfile.summarize,    
        },
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

/* 프론트에서 편집 버튼 누르면 지역 편집가능 */  
router.put('/editLocation', async (req, res) => {
    const {userId, location} = req.body

    const updateLocation = await prisma.user.update({
        where : {user_id : userId},
        data : {
            location : location
        }
    })
});

module.exports = router;