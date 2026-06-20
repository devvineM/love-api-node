import "dotenv/config";

import { createApp } from "./app.ts";
import { prisma } from "./lib/prisma.ts";
import { assertRequiredEnv, env } from "./shared/config/env.ts";
import { systemLevels } from "./shared/config/system-levels.ts";

const port = env.port;
const app = createApp();

async function startServer() {
  try {
    assertRequiredEnv();
    await prisma.$connect();
    await Promise.all(
      systemLevels.map((item) =>
        prisma.level.upsert({
          where: {
            level: item.level
          },
          update: {
            description: item.description
          },
          create: item
        })
      )
    );

    app.listen(port, () => {
      console.log(`API rodando em http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados.", error);
    process.exit(1);
  }
}

void startServer();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
