// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import InputField from "../InputField";
// import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
// import { useFormState } from "react-dom";
// import { Dispatch, SetStateAction, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";

// const LessonForm = ({
//   setOpen,
//   type,
//   data,
//   relatedData,
// }: {
//   setOpen: Dispatch<SetStateAction<boolean>>;
//   type: "create" | "update";
//   data?: any;
//   relatedData?: any;
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LessonSchema>({ resolver: zodResolver(lessonSchema) });

//   const [state, formAction] = useFormState(
//     type === "create" ? createLesson : updateLesson,
//     {
//       success: false,
//       error: false,
//     }
//   );

//   const onSubmit = handleSubmit((data) => {
//     console.log(data);

//     // Convert plain object to FormData
//     const formData = new FormData();
//     if (data.id) formData.append("id", data.id.toString());

//     data.subjectId.forEach((id) => formData.append("subjectId", id));
//     data.classId.forEach((id) => formData.append("gradeId", id));
//     data.teacherId.forEach((id) => formData.append("teacherId", id));

//     formAction(formData);
//   });

//   const router = useRouter();

//   useEffect(() => {
//     if (state.success) {
//       toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
//       setOpen(false);
//       router.refresh();
//     }
//   }, [state, router, type, setOpen]);

//   const { teachers, classes, subjects } = relatedData || {};

//   return (
//     <form className="flex flex-col gap-8" onSubmit={onSubmit}>
//       <h1 className="text-xl font-semibold">
//         {type === "create" ? "Create a new Lesson" : "Update the Lesson"}
//       </h1>
//       <div className="flex justify-between flex-wrap gap-4">
//         {data && (
//           <InputField
//             label="Id"
//             name="id"
//             defaultValue={data?.id}
//             register={register}
//             error={errors?.id}
//             hidden
//           />
//         )}
//         <div className="flex flex-col gap-2 w-full md:w-1/4 ">
//           <label className="text-xs text-gray-500">Subjects</label>
//           <select
//             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
//             {...register("subjectId")}
//             defaultValue={data?.subjects?.map((t: { id: string }) => t.id)}
//           >
//             {subjects.map((subject: { id: string; name: string }) => (
//               <option value={subject.id} key={subject.id}>
//                 {subject.name}
//               </option>
//             ))}
//           </select>
//           {errors?.subjectId?.message && (
//             <p className="text-xs text-red-400">
//               {errors.subjectId.message.toString()}
//             </p>
//           )}
//         </div>
//         <div className="flex flex-col gap-2 w-full md:w-1/4 ">
//           <label className="text-xs text-gray-500">Class</label>
//           <select
//             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
//             {...register("classId")}
//             defaultValue={data?.classId}
//           >
//             <option value="">Select Class</option>
//             {classes.map((classItem: { id: number; name: number }) => (
//               <option value={classItem.id} key={classItem.id} selected={data && classItem.id === data.classItem}>
//                 {classItem.name}
//               </option>
//             ))}
//           </select>
//           {errors?.classId?.message && (
//             <p className="text-xs text-red-400">
//               {errors.classId.message.toString()}
//             </p>
//           )}
//         </div>
//         <div className="flex flex-col gap-2 w-full md:w-1/4 ">
//           <label className="text-xs text-gray-500">Teachers</label>
//           <select
//             multiple
//             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
//             {...register("teacherId")}
//             defaultValue={data?.teachers?.map((t: { id: string }) => t.id)}
//           >
//             {teachers.map(
//               (teacher: { id: string; name: string; surname: string }) => (
//                 <option value={teacher.id} key={teacher.id}>
//                   {teacher.name + " " + teacher.surname}
//                 </option>
//               )
//             )}
//           </select>
//           {errors?.teacherId?.message && (
//             <p className="text-xs text-red-400">
//               {errors.teacherId.message.toString()}
//             </p>
//           )}
//         </div>
//       </div>

//       {state.error && (
//         <span className="text-red-500">❌ Something went Wrong!</span>
//       )}

//       <button className="bg-blue-400 text-white p-2 rounded-md">
//         {type === "create" ? "Create" : "Update"}
//       </button>
//     </form>
//   );
// };

// export default LessonForm;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  classSchema,
  ClassSchema,
  subjectSchema,
  SubjectSchema,
} from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const LessonForm = ({
  setOpen,
  type,
  data,
  relatedData,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  type: "create" | "update";
  data?: any;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSchema>({ resolver: zodResolver(classSchema) });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Subject has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers = [], grades } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Class" : "Update the Class"}
      </h1>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Class Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Capacity"
          name="capacity"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}

        <div className="flex flex-col gap-2 w-full md:w-1/4 ">
          <label className="text-xs text-gray-500">Supervisor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("supervisorId")}
            defaultValue={data?.teachers}
          >
            <option value="">Select Supervisor</option>
            {teachers.map(
              (teacher: { id: number; name: string; surname: string }) => (
                <option value={teacher.id} key={teacher.id} selected={data && teacher.id === data.supervisorId}>
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors?.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4 ">
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId")}
            // defaultValue={data?.teachers}
            defaultValue={data?.gradeId}
          >
            <option value="">Select Grade</option>
            {grades.map((grade: { id: number; level: number }) => (
              <option value={grade.id} key={grade.id} selected={data && grade.id === data.gradeId}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors?.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">❌ Something went Wrong!</span>
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;
