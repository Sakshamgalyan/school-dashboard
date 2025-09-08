import Image from "next/image"
import EventCalendar from "./EventCalendar"
import EventList from "./EventList"

const EventCalendarContainer = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {

    const {date} = searchParams;
    return (
        <div className='bg-white p-4 rounded-md shadow-md'>
            <EventCalendar />
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold my-4">Events</h1>
                <Image src="/moreDark.png" width={20} height={20} alt="" />
            </div>
            <div className="flex flex-col gap-4">
                <EventList dateParams={date} />
            </div>
        </div>
    )
}

export default EventCalendarContainer