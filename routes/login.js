const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 로그인 라우트
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Your are not signedIn. SignIn First' });
        } else if (user.password !== password) {
            return res.status(402).json({ error: 'Wrong password' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
