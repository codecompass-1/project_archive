import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Image from 'next/image';

interface TopBarProps {
  userRole: string | null;
}

const TopBar: React.FC<TopBarProps> = ({ userRole }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const adminName = user?.displayName || 'Admin';
  const profileImage = user?.photoURL;

  return (
    <div className="flex justify-between items-center p-5 bg-white shadow-md w-full">
      <div>
        <h1 className="text-xl font-bold">Hi, {adminName}</h1>
        {userRole && (
          <p className="text-sm text-gray-500">Role: {userRole}</p>
        )}
      </div>
      <div className="flex items-center">
        {profileImage ? (
          <Image
            src={profileImage}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-400" />
        )}
      </div>
    </div>
  );
};

export default TopBar;
