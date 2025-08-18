import FormModal from "@/components/FormModal"
import Pagination from "@/components/Pagination"
import Table from "@/components/Table"
import TableSearch from "@/components/TableSearch"
import prisma from "@/lib/prisma"
import { ITEM_PER_PAGE } from "@/lib/settings"
import { getUserID, getUserRole } from "@/lib/utils"
import { Prisma, Subject, Teacher } from "@prisma/client"
import Image from "next/image"

type SubjectList = Subject & { teachers: Teacher[] }

const SubjectListPage = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;
    const role = await getUserRole();
    const currentUserId = await getUserID();

    // URL Search Params 

    const query: Prisma.SubjectWhereInput = {};

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.name = { contains: value, mode: "insensitive" }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    const [data, count] = await prisma.$transaction([
        prisma.subject.findMany({
            where: query,
            include: {
                teachers: true,
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.subject.count({
            where: query,
        })
    ])

    const columns = [
        {
            headers: "Subject Name",
            accessor: "name",
        },
        {
            headers: "Teacher Names",
            accessor: "teachers",
            className: "hidden md:table-cell",
        },
        ...(role === "admin" || role === "teacher" ? [{
            headers: "Actions",
            accessor: "actions",
        }] : []),
    ]

    const renderRow = (item: SubjectList) => (
        <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-SKlightpurple">
            <td className="flex items-center gap-4 p-4">{item.name}</td>
            <td className="hidden md:table-cell">
                {item.teachers.map(teacher => teacher.name).join(", ")}
            </td>
            <td>
                <div className="flex items-center gap-2">
                    {(role === "admin" || role === "teacher") && (
                        <>
                            <FormModal table="subject" type="update" data={item} />
                            <FormModal table="subject" type="delete" id={item.id} />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 ">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">All Subject</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-SKyellow">
                            <Image src="/filter.png" alt="" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-SKyellow">
                            <Image src="/sort.png" alt="" width={14} height={14} />
                        </button>
                        {(role === "admin" || role === "teacher") && (
                            <FormModal table="subject" type="create" />
                        )}
                    </div>
                </div>
            </div>
            {/* List */}
            <Table columns={columns} renderRow={renderRow} data={data} />
            {/* Pagination */}
            <Pagination page={p} count={count} />
        </div>
    )
}

export default SubjectListPage