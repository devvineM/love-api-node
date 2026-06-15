export const systemLevels = [
  {
    level: "root",
    description: "Sistema"
  },
  {
    level: "admin",
    description: "Administrador"
  },
  {
    level: "user",
    description: "Colaborador"
  }
] as const;

export type SystemLevelCode = (typeof systemLevels)[number]["level"];
