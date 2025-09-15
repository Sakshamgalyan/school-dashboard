import prisma from "@/lib/prisma";
import { getCurrentUserServer } from "@/lib/utils"; 

const Announcements = async () => {
  // Fetch the current user from the server
  const user = await getCurrentUserServer();
  if (!user) return <div>Please login to see announcements</div>;

  // Conditions based on role
  const roleConditions: Record<string, any> = {
    TEACHER: { lessons: { some: { teacherId: user.id } } },
    STUDENT: { students: { some: { id: user.id } } },
    PARENT: { students: { some: { parentId: user.id } } },
    ADMIN: {},
  };

  // Fetch latest 3 announcements
  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where:
      user.role !== "ADMIN"
        ? {
            OR: [
              { classId: null },
              { class: roleConditions[user.role] || {} },
            ],
          }
        : undefined,
  });

  const colors = ["bg-SKlightsky", "bg-SKlightpurple", "bg-SKlightyellow"];

  return (
    <div className="bg-white p-4 shadow-md rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400 cursor-pointer">View All</span>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {data.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`${colors[index] || "bg-gray-100"} rounded-md p-4`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{announcement.title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-US").format(
                  new Date(announcement.date)
                )}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-4">{announcement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
