'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from '@/lib/firebase/auth';
import Sidebar from "@/components/admin/sidebar";
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import TopBar from '@/components/admin/TopBar';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = onAuthStateChanged(async (authUser) => {
        if (authUser) {
          const userDocRef = doc(firestore, 'adminemail', authUser.email as string);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const role = userDoc.data()?.role;
            if (role === 'admin' || role === 'superadmin') {
              setIsAuthenticated(true);
              setUserRole(role);
            } else {
              setIsAuthenticated(false);
              router.push('/auth/Login');
            }
          } else {
            setIsAuthenticated(false);
            router.push('/auth/Login');
          }
        } else {
          setIsAuthenticated(false);
          router.push('/auth/Login');
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <Sidebar userRole={userRole} />
        <div className="flex flex-1">
          <main className="flex-1 overflow-auto">
            <TopBar userRole={userRole} />
            <div className="flex-1 p-4 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
