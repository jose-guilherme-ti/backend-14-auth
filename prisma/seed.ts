import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  

  // Hash da senha padrão
  const passwordHash = await bcrypt.hash('123456', 10)

  // --- Usuário ADMIN ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Administrator',
      role: Role.ADMIN,
    }
  })

  // --- Usuário comum 1 ---
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: passwordHash,
      name: 'John Doe',
      role: Role.USER,
    }
  })

  // --- Usuário comum 2 ---
  const user2 = await prisma.user.create({
    data: {
      email: 'mary@example.com',
      password: passwordHash,
      name: 'Mary Jane',
      role: Role.USER,
    }
  })

  // --- Posts criados pelo admin ---
  await prisma.post.createMany({
    data: [
      {
        title: 'Welcome to the GraphQL API',
        content: 'This is the first post of our Admin.',
        published: true,
        authorId: admin.id,
      },
      {
        title: 'Draft from Admin',
        content: 'This post is not published yet.',
        published: false,
        authorId: admin.id,
      },
    ]
  })

  // --- Posts do user1 ---
  await prisma.post.createMany({
    data: [
      {
        title: 'User1 First Post',
        content: 'Hello from John Doe!',
        published: true,
        authorId: user1.id,
      },
      {
        title: 'User1 Draft Post',
        content: 'Only a draft...',
        published: false,
        authorId: user1.id,
      },
    ]
  })

  // --- Posts do user2 ---
  await prisma.post.createMany({
    data: [
      {
        title: 'Mary’s Recipe',
        content: 'A secret cooking recipe...',
        published: true,
        authorId: user2.id,
      },
      {
        title: 'Mary Draft',
        content: 'Draft of a new project...',
        published: false,
        authorId: user2.id,
      },
    ]
  })
   // Limpa dados existentes (opcional, recomendado em dev)
  await prisma.reservation.deleteMany();

  await prisma.reservation.createMany({
    data: [
      {
        date: new Date("2025-12-20T00:00:00.000Z"),
        clientName: "João Silva",
        eventName: "Peça Hamlet",
        durationHours: 3,
        paid: true, // dia bloqueado
      },
      {
        date: new Date("2025-12-21T00:00:00.000Z"),
        clientName: "Maria Oliveira",
        eventName: "Show de Comédia",
        durationHours: 2,
        paid: false, // aguardando pagamento
      },
      {
        date: new Date("2025-12-22T00:00:00.000Z"),
        clientName: "Carlos Souza",
        eventName: "Musical Infantil",
        durationHours: 4,
        paid: true, // dia bloqueado
      },
    ],
  });

  console.log("✅ Seed concluído com sucesso!");

}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
