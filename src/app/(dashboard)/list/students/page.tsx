import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getUserFromToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@prisma/client";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

type StudentList = Student & {
    class: Class;
    user: { username: string; id: string };
};

const StudentListPage = async ({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) => {
    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return <div>Please login</div>;

    // Get user from token
    const user = await getUserFromToken(token);
    if (!user) return <div>User not found</div>;

    const role = user.role.toLocaleLowerCase();

    // URL Search Params

    const query: Prisma.StudentWhereInput = {};

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "teacherId":
                        query.class = {
                            lessons: {
                                some: {
                                    teacherId: value,
                                },
                            },
                        };
                        break;
                    case "search":
                        query.name = { contains: value, mode: "insensitive" };
                        break;
                    default:
                        break;
                }
            }
        }
    }

    const [data, count] = await prisma.$transaction([
        prisma.student.findMany({
            where: query,
            include: {
                class: true,
                user: { select: { username: true, id: true } },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.student.count({
            where: query,
        }),
    ]);

    const columns = [
        {
            headers: "Info",
            accessor: "info",
        },
        {
            headers: "Student ID",
            accessor: "studentId",
            className: "hidden md:table-cell",
        },
        {
            headers: "Grade",
            accessor: "grade",
            className: "hidden md:table-cell",
        },
        {
            headers: "Phone",
            accessor: "phone",
            className: "hidden lg:table-cell",
        },
        {
            headers: "Address",
            accessor: "address",
            className: "hidden lg:table-cell",
        },
        ...(role === "admin"
            ? [
                {
                    headers: "Actions",
                    accessor: "actions",
                },
            ]
            : []),
    ];

    const renderRow = (item: StudentList) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-SKlightpurple"
        >
            <td className="flex items-center gap-4 p-4">
                <Image
                    src={item.img || "/noAvatar.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item?.class.name}</p>
                </div>
            </td>
            <td className="hidden md:table-cell">{item.user.username}</td>
            <td className="hidden md:table-cell">{item.class.name[0]}</td>
            <td className="hidden md:table-cell">{item.phone}</td>
            <td className="hidden md:table-cell">{item.address}</td>
            <td>
                <div className="flex items-center gap-2">
                    <Link href={`/list/students/${item.id}`}>
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-SKsky">
                            <Image src="/view.png" alt="" width={16} height={16} />
                        </button>
                    </Link>
                    {role === "admin" && (
                        // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-SKpurple">
                        // <Image src="/delete.png" alt="" width={16} height={16} />
                        // </button>
                        <FormContainer table="student" type="delete" id={item.id} />
                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 ">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">All Student</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-SKyellow">
                            <Image src="/filter.png" alt="" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-SKyellow">
                            <Image src="/sort.png" alt="" width={14} height={14} />
                        </button>
                        {role === "admin" && (
                            // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-SKyellow">
                            // <Image src="/plus.png" alt="" width={14} height={14} />
                            // </button>
                            <FormContainer table="student" type="create" />
                        )}
                    </div>
                </div>
            </div>
            {/* List */}
            <Table columns={columns} renderRow={renderRow} data={data} />
            {/* Pagination */}
            <Pagination page={p} count={count} />
        </div>
    );
};

export default StudentListPage;
