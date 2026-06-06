require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: { usuario: 'admin', senha: '123' },
  });
  console.log('Admin admin/123 criado com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
