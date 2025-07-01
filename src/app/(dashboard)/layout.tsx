import Link from "next/link";
import Image from "next/image";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";

export default function dashboardLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <div className=" flex ">  {/* h-screen*/}
        {/* Left */}
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
          <Link href="/" className="flex items-center justify-center lg:justify-start gap-2 overflow-auto">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="hidden lg:block font-bold">Schoolama</span>
          </Link>
          
          <Menu/>
        </div>
        {/* right */}
        <div className=" w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#f7f8fa] overflow-visible flex flex-col">
          <Navbar/>
          {children}
        </div>
        </div>
    );
  }
  