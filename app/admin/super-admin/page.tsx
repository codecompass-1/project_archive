"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { firestore, auth } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AddAdmin,
  AdminList,
  RemoveAdmin,
} from "@/components/admin-components";

export default function AdminPanel() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user?.email) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      const docRef = doc(firestore, "adminemail", user.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchRole();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );

  if (userRole !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded shadow-sm text-center">
          <p className="font-semibold">
            You are not authorized to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6 transition-all duration-300">
        {/* Back Button */}
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Profile</span>
        </button>
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">
          Super Admin Panel
        </h1>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="flex justify-center space-x-2 bg-blue-100 p-1 rounded-lg mb-6">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-200"
            >
              Admin List
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-200"
            >
              Add Admin
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-200"
            >
              Remove Admin
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="animate-fadeIn">
            <AdminList />
          </TabsContent>
          <TabsContent value="add" className="animate-fadeIn">
            <AddAdmin />
          </TabsContent>
          <TabsContent value="remove" className="animate-fadeIn">
            <RemoveAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
