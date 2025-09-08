import Announcements from "@/components/Announcements"
import AttendanceChartContainer from "@/components/AttendanceChartContainer"
import CountChartContainer from "@/components/CountChartContainer"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import FinanceChart from "@/components/FinanceChart"
import Usercard from "@/components/Usercard"

const Adminpage = ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  return (
    <div className="flex p-4 gap-4 flex-col md:flex-row">
      {/* Left  */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
      {/* Usercard  */}
      <div className="flex gap-4 justify-between flex-wrap">
      <Usercard type="admin"/>
      <Usercard type="teacher"/>
      <Usercard type="student"/>
      <Usercard type="parent"/>
      </div>
      {/* Middle charts  */}
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Count Chart  */}
        <div className="w-full lg:w-1/3 h-[450px]">
        <CountChartContainer/></div>

        {/* Attendance chart */}
        <div className="w-full lg:w-2/3 h-[450px]">
          <AttendanceChartContainer/>
        </div>
      </div>

      {/* Bottom Chart */} 
      <div className="w-full h-[500px]">
        <FinanceChart/>
      </div>
      </div>
      {/* Right  */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
      <EventCalendarContainer searchParams={searchParams}/>
      <Announcements/>
      </div>
    </div>
  )
}

export default Adminpage