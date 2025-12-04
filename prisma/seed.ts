// prisma/seed.ts
import { PrismaClient, Role, UserSex } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ===== USERS (ADMINS) =====
  const admins = [
    {
      username: "admin1",
      email: "admin1@example.com",
      password: "password1",
      name: "Admin One",
    },
    {
      username: "admin2",
      email: "admin2@example.com",
      password: "password2",
      name: "Admin Two",
    },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const user = await prisma.user.upsert({
      where: { username: admin.username },
      update: {},
      create: { ...admin, password: hashedPassword, role: Role.ADMIN },
    });

    await prisma.admin.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, username: admin.username },
    });
  }

  // ===== GRADES =====
  for (let level = 1; level <= 6; level++) {
    await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
  }

  // Map: level -> gradeId
  const grades = await prisma.grade.findMany();
  const gradeIdByLevel = grades.reduce<Record<number, string>>((acc, grade) => {
    acc[grade.level] = grade.id;
    return acc;
  }, {});

  // ===== CLASSES =====
  for (let i = 1; i <= 6; i++) {
    const gradeId = gradeIdByLevel[i];
    if (!gradeId) throw new Error(`No Grade found for level ${i}`);

    await prisma.class.upsert({
      where: { name: `${i}A` },
      update: {},
      create: {
        name: `${i}A`,
        gradeId,
        capacity: Math.floor(Math.random() * 6) + 15,
      },
    });
  }

  // Map: className -> classId
  const classes = await prisma.class.findMany();
  const classIdByName = classes.reduce<Record<string, string>>((acc, c) => {
    acc[c.name] = c.id;
    return acc;
  }, {});

  // ===== SUBJECTS =====
  const subjectNames = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Art",
  ];

  for (const name of subjectNames) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Map: subjectName -> subjectId
  const subjectRecords = await prisma.subject.findMany();
  const subjectIdByName = subjectRecords.reduce<Record<string, string>>(
    (acc, s) => {
      acc[s.name] = s.id;
      return acc;
    },
    {}
  );

  // ===== TEACHERS =====
  for (let i = 1; i <= 15; i++) {
    const hashedPassword = await bcrypt.hash("teacherpass", 10);

    const user = await prisma.user.upsert({
      where: { username: `teacher${i}` },
      update: {},
      create: {
        username: `teacher${i}`,
        email: `teacher${i}@example.com`,
        password: hashedPassword,
        name: `TName${i}`,
        role: Role.TEACHER,
      },
    });

    const subjectName = subjectNames[(i - 1) % subjectNames.length];
    const subjectId = subjectIdByName[subjectName];

    const className = `${((i - 1) % 6) + 1}A`;
    const classId = classIdByName[className];

    await prisma.teacher.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        userId: user.id, // 🔑 required by schema
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: user.email,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 30)
        ),
        // connect one subject and one class (if found)
        subjects: subjectId ? { connect: [{ id: subjectId }] } : undefined,
        classes: classId ? { connect: [{ id: classId }] } : undefined,
      },
    });
  }

  // ===== PARENTS =====
  for (let i = 1; i <= 25; i++) {
    const hashedPassword = await bcrypt.hash("parentpass", 10);

    const user = await prisma.user.upsert({
      where: { username: `parent${i}` },
      update: {},
      create: {
        username: `parent${i}`,
        email: `parent${i}@example.com`,
        password: hashedPassword,
        name: `PName${i}`,
        role: Role.PARENT,
      },
    });

    await prisma.parent.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        userId: user.id, // 🔑 required by schema
        name: `PName${i}`,
        surname: `PSurname${i}`,
        email: user.email,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // ===== STUDENTS =====
  for (let i = 1; i <= 50; i++) {
    const hashedPassword = await bcrypt.hash("studentpass", 10);

    const user = await prisma.user.upsert({
      where: { username: `student${i}` },
      update: {},
      create: {
        username: `student${i}`,
        email: `student${i}@example.com`,
        password: hashedPassword,
        name: `SName${i}`,
        role: Role.STUDENT,
      },
    });

    const parentIndex = ((i - 1) % 25) + 1;
    const parentUser = await prisma.user.findUnique({
      where: { username: `parent${parentIndex}` },
      include: { Parent: true },
    });
    if (!parentUser?.Parent) continue;

    const gradeLevel = ((i - 1) % 6) + 1;
    const gradeId = gradeIdByLevel[gradeLevel];
    const className = `${((i - 1) % 6) + 1}A`;
    const classId = classIdByName[className];

    await prisma.student.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        userId: user.id, // 🔑 required by schema
        name: `SName${i}`,
        surname: `SSurname${i}`,
        email: user.email,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: parentUser.Parent.id,
        gradeId,
        classId,
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 10)
        ),
      },
    });
  }

  console.log("✅ Seed completed successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
