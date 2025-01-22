const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 라우트
router.post('/', async (req, res) => {
    try {
        const { name, email, password, passwordCheck} = req.body;
        if (password != passwordCheck){
            throw new Error("check your passwod again")
        }
        const newUser = await prisma.user.create({data: { name, email, password }});
        res.status(201).json(newUser);
    } catch (error) {
        
        res.status(500).json({ message : error.message});
    }
});

module.exports = router; // 라우터를 내보냄
