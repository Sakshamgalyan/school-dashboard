"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Menu = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // Fetch user role from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/getUserDetails", { credentials: "include" });
        const data = await res.json();
        if (res.ok) setRole(data.role.toLowerCase());
        else console.log("Auth error:", data.error);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    router.push("/");
  };

  const menuItems = [
    {
      title: "MENU",
      items: [
        { icon: "/home.png", label: "Home", href: "/", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/teacher.png", label: "Teachers", href: "/list/teachers", visible: ["admin", "teacher"] },
        { icon: "/student.png", label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
        { icon: "/parent.png", label: "Parents", href: "/list/parents", visible: ["admin", "teacher"] },
        { icon: "/subject.png", label: "Subjects", href: "/list/subjects", visible: ["admin"] },
        { icon: "/class.png", label: "Classes", href: "/list/classes", visible: ["admin", "teacher"] },
        { icon: "/lesson.png", label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
        { icon: "/message.png", label: "Video Recorded", href: "/list/videosRecorded", visible: ["admin", "teacher", "student"] },
        { icon: "/message.png", label: "Video Live", href: "/list/videosLive", visible: ["admin", "teacher", "student"] },
        { icon: "/exam.png", label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/result.png", label: "Results", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/attendance.png", label: "Attendance", href: "/", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/calendar.png", label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/announcement.png", label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
      ],
    },
    {
      title: "OTHER",
      items: [
        { icon: "/profile.png", label: "Profile", href: "/", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/setting.png", label: "Settings", href: "/", visible: ["admin", "teacher", "student", "parent"] },
        { icon: "/logout.png", label: "Logout", action: handleLogout, href: "#", visible: ["admin", "teacher", "student", "parent"] },
      ],
    },
  ];

  if (!role) {
    // Loader while fetching role
    return <div className="text-gray-400 p-4">Loading menu...</div>;
  }
  else{

  return (
    <div className="mt-4 text-xs lg:mx-1">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 md:px-2 text-gray-500 py-2 rounded-md hover:bg-SKlightsky cursor-pointer"
                  onClick={item.action ? item.action : undefined}
                >
                  {!item.action ? (
                    <Link href={item.href} className="flex items-center">
                      <Image src={item.icon} alt={item.label} width={20} height={20} />
                      <span className="hidden lg:block mx-2 text-sm">{item.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center">
                      <Image src={item.icon} alt={item.label} width={20} height={20} />
                      <span className="hidden lg:block mx-2 text-sm">{item.label}</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};
}
export default Menu;
