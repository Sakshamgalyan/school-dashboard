"use server";

import {
  ClassSchema,
  ExamSchema,
  LessonSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

type ActionState = {
  success: boolean;
  error: string | boolean;
};

// Actions for subjects like create, update and delete

export const createSubject = async (
  currentstate: ActionState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({
            id: teacherId,
          })),
        },
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentstate: ActionState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id!,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    await prisma.subject.delete({
      where: {
        id: id,
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Actions for Class like create, update and delete

export const createClass = async (
  currentstate: ActionState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentstate: ActionState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id!,
      },
      data,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    await prisma.class.delete({
      where: {
        id: id,
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Actions for Teacher like create, update and delete

export const createTeacher = async (
  currentstate: ActionState,
  data: TeacherSchema
) => {
  try {
    if (!data.password) {
      return {
        success: false,
        error: "Password is required to create a teacher.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Username already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "TEACHER",
      },
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        userId: user.id,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: new Date(data.birthday),
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: subjectId,
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: "Failed to create teacher." };
  }
};

export const updateTeacher = async (
  currentstate: ActionState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: "Teacher ID is required." };
  }

  try {
    if (!data.password) {
      return {
        success: false,
        error: "Password is required to update a teacher.",
      };
    }

    const checkPassword = await prisma.user.findUnique({
      where: { id: data.id },
      select: { password: true },
    });

    if (!checkPassword || !checkPassword.password) {
      return { success: false, error: "User Not found" };
    }

    const hashedPassword = bcrypt.compareSync(
      data.password,
      checkPassword.password
    );

    if (!hashedPassword) {
      return { success: false, error: "Password is incorrect." };
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
      },
    });

    await prisma.teacher.update({
      where: { id: data.id },
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: subjectId,
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: "Failed to update teacher." };
  }
};

export const deleteTeacher = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;

    await prisma.teacher.deleteMany({
      where: { id: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: "Failed to delete teacher." };
  }
};

// Actions for Student like create, update and delete

export const createStudent = async (
  currentState: ActionState,
  data: StudentSchema
) => {
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: "Class is full" };
    }

    if (!data.password) {
      return {
        success: false,
        error: "Password is required to create a teacher.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Username already exists",
      };
    }

    const parent = await prisma.user.findUnique({
      where: { username: data.parentUsername },
      include: { Parent: true },
    });

    if (!parent || !parent.Parent) {
      return { success: false, error: "Parent not found" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    await prisma.student.create({
      data: {
        id: user.id,
        userId: user.id,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: parent.Parent.id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: "Failed to create student." };
  }
};

export const updateStudent = async (
  currentstate: ActionState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: "Student ID is required." };
  }

  try {
    if (!data.password) {
      return {
        success: false,
        error: "Password is required to update a student.",
      };
    }

    const checkPassword = await prisma.user.findUnique({
      where: { id: data.id },
      select: { password: true },
    });

    if (!checkPassword || !checkPassword.password) {
      return { success: false, error: "User not found" };
    }

    const validPassword = bcrypt.compareSync(
      data.password,
      checkPassword.password
    );

    if (!validPassword) {
      return { success: false, error: "Password is incorrect." };
    }

    // 🔎 find parent by username
    let parentId: string | null = null;
    if (data.parentUsername) {
      const parent = await prisma.user.findUnique({
        where: { username: data.parentUsername },
        include: { Parent: true },
      });

      if (!parent || !parent.Parent) {
        return { success: false, error: "Parent not found" };
      }

      parentId = parent.Parent.id;
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
      },
    });

    await prisma.student.update({
      where: { id: data.id },
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        img: data.img,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: parentId ?? undefined, // set resolved parent id
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update student." };
  }
};

export const deleteStudent = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;

    await prisma.student.deleteMany({
      where: { id: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: "Failed to delete student." };
  }
};

// Actions for Lesson like create, update and delete

// export const createLesson = async (
//   currentstate: CurrentState,
//   data: LessonSchema
// ) => {
//   try {
//     const id = data.get("id");
//     const clerk = await clerkClient();
//     await clerk.users.deleteUser(id);
//     await prisma.student.delete({
//       where: {
//         id: id,
//       },
//     });
//     // revalidatePath("/list/subjects");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

// export const updateLesson = async (
//   currentstate: CurrentState,
//   data: FormData
// ) => {
//   try {
//     const id = data.get("id") as string;
//     const clerk = await clerkClient();
//     await clerk.users.deleteUser(id);
//     await prisma.student.delete({
//       where: {
//         id: id,
//       },
//     });
//     // revalidatePath("/list/subjects");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

export const deleteLesson = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    await prisma.student.delete({
      where: {
        id: id,
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Actions for Parent like create, update and delete

export const createParent = async (
  currentState: ActionState,
  data: ParentSchema
) => {
  try {
    if (!data.password) {
      return {
        success: false,
        error: "Password is required to create a parent.",
      };
    }
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Username already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "PARENT",
      },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        userId: user.id,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || "",
        address: data.address,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: "Failed to create Parent." };
  }
};

export const updateParent = async (
  currentstate: ActionState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: "Parent ID is required." };
  }

  try {
    if (!data.password) {
      return {
        success: false,
        error: "Password is required to update a student.",
      };
    }

    const checkPassword = await prisma.user.findUnique({
      where: { id: data.id },
      select: { password: true },
    });

    if (!checkPassword || !checkPassword.password) {
      return { success: false, error: "User not found" };
    }

    const validPassword = bcrypt.compareSync(
      data.password,
      checkPassword.password
    );

    if (!validPassword) {
      return { success: false, error: "Password is incorrect." };
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
      },
    });

    await prisma.student.update({
      where: { id: data.id },
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone || "",
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update student." };
  }
};

export const deleteParent = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;

    await prisma.parent.deleteMany({
      where: { id: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: "Failed to delete parent." };
  }
};

// Actions for Exam like create, update and delete

// export const createExam = async (
//   currentstate: ActionState,
//   data: ExamSchema
// ) => {
//   try {
//     await prisma.subject.create({
//       data: {
//         name: data.name,
//         teachers: {
//           connect: data.teachers.map((teacherId) => ({
//             id: teacherId,
//           })),
//         },
//       },
//     });
//     // revalidatePath("/list/subjects");
//     return { success: true, error: false };
//   } catch (err) {
//     console.log(err);
//     return { success: false, error: true };
//   }
// };

export const updateExam = async (
  currentstate: ActionState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id!,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentstate: ActionState,
  data: FormData
) => {
  try {
    const id = data.get("id") as string;
    await prisma.subject.delete({
      where: {
        id: id,
      },
    });
    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};