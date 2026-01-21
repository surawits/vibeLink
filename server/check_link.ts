import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const link = await prisma.link.findUnique({
    where: { shortCode: "google" }
  });
  console.log(link);
}

check();