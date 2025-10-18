// backend/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Apaga usuários existentes (opcional, mas seguro)
  await prisma.user.deleteMany(); 

  // 2. Insere o usuário de teste
  const garcom = await prisma.user.create({
    data: {
      username: 'garcom1',
      password: '123456', // Senha em texto simples, como configurado no index.js
      name: 'João Garçom',
      role: 'GARCOM',
    },
  });

  console.log(`Usuário criado: ${garcom.username} com ID: ${garcom.id}`);

  // --- OPCIONAL: Reinserir Mesas e Produtos (se você não os reinseriu no Studio) ---
  // Se você não reinseriu as mesas no Studio, adicione este bloco:
  /*
  await prisma.table.createMany({
    data: [{ number: 1, status: 'LIVRE' }, { number: 2, status: 'LIVRE' }, { number: 3, status: 'LIVRE' }],
    skipDuplicates: true,
  });

  await prisma.product.createMany({
    data: [
      { name: 'Hambúrguer', price: 25.00 },
      { name: 'Coca-cola', price: 7.00 },
      { name: 'Água', price: 3.00 },
    ],
    skipDuplicates: true,
  });
  console.log("Produtos e Mesas reinseridos.");
  */
  // ---------------------------------------------------------------------------------


}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });