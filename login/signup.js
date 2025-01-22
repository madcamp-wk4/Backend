const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 라우트
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const newUser = await prisma.user.create({
            data: { name, email, password },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

module.exports = router; // 라우터를 내보냄
