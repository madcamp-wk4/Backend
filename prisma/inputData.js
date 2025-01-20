const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// run inside `async` function
const newUser = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@prisma.io',
    },
  })
  
  const users = await prisma.user.findMany()