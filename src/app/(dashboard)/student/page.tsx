import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth"; // your server-side auth helper

const Studentpage = async () => {
  // Get token from cookies
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return <div>Please login</div>;

  // Get user from token
  const user = await getUserFromToken(token);
  if (!user) return <div>User not found</div>;

  // Fetch classes for this user
  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: user.id } },
    },
    include: { grade: true },
  });

  return (
    <div className="flex p-4 gap-4 flex-col xl:flex-row">
      {/* Left  */}
      <div className="w-full xl:w-2/3 flex flex-col gap-8">
        <div className="h-full bg-white p-4 rounded-md shadow-md">
          <h1 className="text-lg font-semibold">Schedule ({classItem[0]?.grade.level})</h1>
          <BigCalendarContainer type="classId" id={classItem[0]?.id} />
        </div>
      </div>

      {/* Right  */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default Studentpage;
