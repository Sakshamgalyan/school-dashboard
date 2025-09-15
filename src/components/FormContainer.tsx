import prisma from "@/lib/prisma";
import FormModal from "./FormModal";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  if (type != "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;

      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });

        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });

        const teacherWithUser = await prisma.user.findMany({
          where: { id: data?.id },
          select: { username: true },
        });

        relatedData = { subjects: teacherSubjects, usernames: teacherWithUser };
        break;

      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });

        const studentClasses = await prisma.class.findMany({
          include: {
            _count: { select: { students: true } },
          },
        });

        let studentWithUser = null;

        if (type === "update" && data?.id) {
          studentWithUser = await prisma.student.findUnique({
            where: { id: String(data.id) },
            select: {
              user: { select: { username: true } },
              parent: { select: { user: { select: { username: true } } } },
            },
          });
        }
        relatedData = {
          classes: studentClasses,
          grades: studentGrades,
          usernames: studentWithUser,
        };
        break;

      case "lesson":
        const lessonsTeacher = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        const lessonsClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const lessonsSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = {
          teachers: lessonsTeacher,
          classes: lessonsClasses,
          subjects: lessonsSubjects,
        };
        break;
      case "parent":
        const parentWithUser = await prisma.user.findMany({
          where: { id: data?.id },
          select: { username: true },
        });

        relatedData = { usernames: parentWithUser };
        break;
      case "exam":
        const examSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const examClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const examTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = {
          subjects: examSubjects,
          classes: examClasses,
          teachers: examTeachers,
        };
        break;
      default:
        break;
    }
  }

  console.log("Related Data: ", relatedData);
  console.log("Data: ", data);
  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
