'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOutWithGoogle } from '@/lib/firebase/auth';
import { removeSession } from '@/server-action/auth_action';
import logo from '@/public/image/logo.png';

interface SidebarProps {
  userRole: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOutWithGoogle();
      await removeSession();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col justify-between">
      <div className="p-6">
        <div className="flex items-center justify-center w-25 h-20 overflow-hidden mb-6">
          <div className="relative w-full h-full">
            <Image
              src={logo}
              alt="Admin Dashboard"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </div>
        <div className="text-center text-black">Admin Dashboard</div>

        <div className="space-y-2 mt-3">
          {userRole === 'superadmin' && (
            <Link href="/admin/AdminMangement" passHref>
              <button
                className={`flex items-center w-full p-3 transition rounded-xl border-2 duration-300 ${
                  pathname === '/addadmin'
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-300'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Admin management
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 transition rounded-xl border-2 duration-300 text-red-600 bg-red-100 hover:bg-red-300 hover:text-red-900"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
