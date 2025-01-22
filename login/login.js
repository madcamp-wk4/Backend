// const express = require('express');
// const { PrismaClient } = require('@prisma/client');

// const app = express()
// app.use(express.json())
// const router = express.Router();

// const prisma = new PrismaClient()

// router.post('/signup', async (req, res) => {
//     try{
//         const {name, email, password} = req.body
//         const newUser = await prisma.user.create({
//             data : {name, email, password}
//         });
//         res.status(201).json(newUser)
//     } catch (error){
//         console.error(error.message);
//     }
// })

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 로그인 라우트
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router; // 라우터를 내보냄
