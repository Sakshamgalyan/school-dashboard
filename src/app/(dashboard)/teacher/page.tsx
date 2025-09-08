import Announcements from "@/components/Announcements"
import BigCalendarContainer from "@/components/BigCalendarContainer"
import { auth } from "@clerk/nextjs/server"

const Teacherpage = async () => {
  const { userId } = await auth();
  return (
    <div className="flex p-4 gap-4 flex-col xl:flex-row">
      {/* Left  */}
      <div className="w-full xl:w-2/3 flex flex-col gap-8">
      <div className="h-full bg-white p-4 rounded-md shadow-md">
        <h1 className="text-lg font-semibold">Schedule</h1>
        <BigCalendarContainer type="teacherId" id={userId!} />
      </div>
      </div>

      {/* Right  */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
      <Announcements/>
      </div>
    </div>
  )
}

export default Teacherpage