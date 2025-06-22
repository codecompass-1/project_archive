"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  CalendarDays,
  WalletCards,
  Users,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { ArrowLeft } from "lucide-react";

interface Project {
  projectId: number;
  projectName: string;
  projectDescription: string;
  projectLink: string;
  customDomain: string;
  createdAt: string;
  categories?: { categoryName: string; optionName: string }[];
  members?: { name: string; linkedin: string }[];
}

export default function ProfilePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.email) return;
      try {
        const docRef = doc(firestore, "adminemail", user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/profile-projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = "__session=; Max-Age=0; path=/";
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const confirmDelete = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowModal(true);
  };

  const deleteProject = async () => {
    if (!selectedProjectId) return;
    const res = await fetch("/api/projects", {
      method: "DELETE",
      body: JSON.stringify({ projectId: selectedProjectId }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.filter((p) => p.projectId !== selectedProjectId)
      );
    } else {
      alert("Failed to delete project.");
    }
    setShowModal(false);
    setSelectedProjectId(null);
  };

  const editProject = (projectId: number) => {
    router.push(`/edit/${projectId}`);
  };

  const normalize = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, "");

  const getCategoryOption = (project: Project, categoryName: string) => {
    const target = normalize(categoryName);
    return (
      project.categories?.find((cat) => normalize(cat.categoryName) === target)
        ?.optionName || "N/A"
    );
  };

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">
            Loading your projects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm sm:text-base">Back to Home</span>
        </button>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500">
            Manage your listed projects here
          </p>
        </div>

        {user ? (
          <div className="mb-10 border rounded-xl p-6 shadow-sm bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold break-words">
                    {user.displayName || user.email}
                  </h2>
                  <p className="text-sm text-gray-500 break-words">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center ">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition "
                >
                  Logout
                </button>
                {(userRole === "superadmin" || userRole === "admin") && (
                  <Link
                    href="/admin"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    {userRole === "superadmin" || userRole === "admin"
                      ? " Admin Panel"
                      : ""}
                  </Link>
                )}
                {userRole === "superadmin" && (
                  <Link
                    href="/admin/super-admin"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    Super admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-red-100 border border-red-300 p-4 rounded-lg text-red-800">
            ⚠️ You are not logged in
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-2xl mb-2">📁 No projects Found</p>
            <p>Start by creating your first project!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1">
            {filteredProjects.map((project) => {
              const yearOfSubmission = getCategoryOption(
                project,
                "Year of Submission"
              );
              const projectType = getCategoryOption(project, "Project Type");
              const domain = getCategoryOption(project, "Domain");
              const expanded = expandedCard === project.projectId;

              return (
                <div
                  key={project.projectId}
                  className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform ${
                    expanded ? "scale-105" : "hover:-translate-y-1"
                  }`}
                >
                  <div
                    className="md:flex"
                    onClick={() =>
                      setExpandedCard(expanded ? null : project.projectId)
                    }
                  >
                    <div className="bg-blue-600 text-white p-6 md:w-1/3">
                      <h2 className="text-xl font-semibold mb-2">
                        {project.projectName}
                      </h2>
                      {!expanded && (
                        <p className="text-sm text-gray-200">
                          {project.projectDescription.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="p-6 space-y-4 md:w-2/3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <CalendarDays className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-gray-500 text-xs">Year</p>
                            <p className="text-gray-800 font-medium">
                              {yearOfSubmission}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <WalletCards className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-gray-500 text-xs">
                              Project Type
                            </p>
                            <p className="text-gray-800 font-medium">
                              {projectType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-gray-500 text-xs">Domain</p>
                            <p className="text-gray-800 font-medium">
                              {domain === "Other"
                                ? project.customDomain || "Other"
                                : domain}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-start gap-2">
                        <Link
                          href={project.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-all"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>View</span>
                        </Link>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editProject(project.projectId);
                          }}
                          className="flex items-center gap-1 bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300 transition-all"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(project.projectId);
                          }}
                          className="flex items-center gap-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>

                      {expanded && (
                        <p className="text-gray-800 text-sm mt-4">
                          {project.projectDescription}
                        </p>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() =>
                            setExpandedCard(expanded ? null : project.projectId)
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Delete Project?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProjectId(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
