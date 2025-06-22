"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProjectGrid from '@/components/repeto/ProjectGrid';
import FilterSection from '@/components/repeto/FilterSection';
import TabSection from '@/components/repeto/TabSection';
// import Footer from '@/components/Footer';
import AddProjectFAB from '@/components/repeto/AddProjectFAB';
// import LoadingScreen from "@/components/loadingScrenn";
import Link from 'next/link';
import LoadingScreen from '@/components/loadingScrenn'; // Import the loading screen component

  
export default function Home() {
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true); // Track loading state
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(false); // State to trigger project re-fetch
  // const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    // Simulate a loading delay
    const timer = setTimeout(() => setLoading(false), 3000);
     return () => clearTimeout(timer);
    // const timer = setTimeout(() => setLoading(false), 1500);
    // return () => clearTimeout(timer);
    setRefreshTrigger(prev => !prev); // Trigger re-fetch when component mounts

  }, []);


  const handleClearFilters = () => {
    // Clear all filters
    setFilters({});
  };

  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col md:flex-row p-4 md:p-0">
        <FilterSection onFilterSubmit={setFilters} onClearFilters={handleClearFilters} />
        <div className="flex-1 max-w-7xl px-4 py-6 space-y-8 w-full">
          <TabSection activeTab={activeTab} onTabChange={setActiveTab} />
          <ProjectGrid activeTab={activeTab} filters={filters} refreshTrigger={refreshTrigger} />
        </div>
        <AddProjectFAB />
      </div>
      {/* <Footer /> */}
    </main>
  );
}
