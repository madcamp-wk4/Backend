const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();


router.put('/edit', async (req, res) => {
    const { userId, name, status, skinship, trust, admit, present, together_time, feature } = req.body;
  
    try {
      // Validate request body
      if (!userId || !name ) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Update user profile
      const updatedProfile = await prisma.user.update({
        where: { user_id: userId }, // Locate the profile by userId
        data: {
          name: name,                  // Update name
          status: status || undefined, // Update status if provided
          trust: trust || null, // Update trust score
          skinship: skinship || null, // Update skinship score
          admit: admit || null, // Update admit score
          present: present || null, // Update present score
          together_time: together_time || null, // Update together_time score
          feature: feature || undefined, // Update feature if provided
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
  module.exports = router;