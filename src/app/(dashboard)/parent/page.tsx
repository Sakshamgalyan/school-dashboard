import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { getUserFromToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const Parentpage = async () => {
  // Get token from cookies
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return <div>Please login</div>;

  // Get user from token
  const user = await getUserFromToken(token);
  if (!user) return <div>User not found</div>;

  // Get students of this parent
  const students = await prisma.student.findMany({
    where: { parentId: user.id },
  });

  // Get announcements (async server component)
  const announcements = await Announcements();

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="flex-1 flex flex-col gap-4">
        {students.map((student) => (
          <div className="w-full bg-white p-4 rounded-md" key={student.id}>
            <h1 className="text-xl font-semibold mb-2">
              Schedule ({student.name} {student.surname})
            </h1>
            <BigCalendarContainer type="classId" id={student.classId} />
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        {announcements}
      </div>
    </div>
  );
};

export default Parentpage;
