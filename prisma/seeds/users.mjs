import bcrypt from "bcryptjs";

const SEEDED_PASSWORD = "123456";

const SEEDED_USERS = [
  {
    key: "manager",
    name: "Task Manager",
    email: "manager@taskorbit.local",
    role: "MANAGER",
  },
  {
    key: "member",
    name: "Task Member",
    email: "member@taskorbit.local",
    role: "MEMBER",
  },
  {
    key: "member2",
    name: "Task Member Two",
    email: "member2@taskorbit.local",
    role: "MEMBER",
  },
  {
    key: "member3",
    name: "Task Member Three",
    email: "member3@taskorbit.local",
    role: "MEMBER",
  },
  {
    key: "member4",
    name: "Task Member Four",
    email: "member4@taskorbit.local",
    role: "MEMBER",
  },
];

export async function seedUsers(prisma) {
  const passwordHash = await bcrypt.hash(SEEDED_PASSWORD, 10);
  const usersByKey = {};

  for (const user of SEEDED_USERS) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });

    usersByKey[user.key] = savedUser;
  }

  return usersByKey;
}
