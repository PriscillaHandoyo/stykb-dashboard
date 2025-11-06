import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="fixed w-full h-24 shadow-xl bg-white">
      <div className="flex justify-between items-center w-full h-full px-4 2xl:px-16">
        <Link href="/">
          <span className="text-black">St. Yakobus Dashboard</span>
        </Link>
        <div>
          <ul className="hidden sm:flex">
            <Link href="/about"></Link>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
