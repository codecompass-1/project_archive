"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Category, Project } from "@/types/project";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft } from "lucide-react";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId;

  const [userToken, setUserToken] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setUserToken(token);
      } else {
        setError("You must be logged in to edit projects.");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userToken || !projectId) return;

    const fetchData = async () => {
      try {
        const [catRes, projRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/projects/${projectId}`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }),
        ]);

        if (!catRes.ok || !projRes.ok) throw new Error("Failed to fetch data");

        const categoriesData = await catRes.json();
        const projectData = await projRes.json();

        console.log("Project Data Categories:", projectData.categories);

        const selectedCategoryOptions: Record<string, string> = {};
        categoriesData.forEach((category: Category) => {
          const normalizedCategoryName = category.categoryName
            .trim()
            .toLowerCase();
          const matched = projectData.categories?.find(
            (c: any) =>
              c.categoryName.trim().toLowerCase() === normalizedCategoryName
          );
          selectedCategoryOptions[category.categoryName] =
            matched?.optionName || "";
        });

        setCategories(categoriesData);
        setProject({
          ...projectData,
          createdAt: projectData.createdAt.split("T")[0],
          selectedCategoryOptions,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userToken, projectId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!project) return;
    const { name, value } = e.target;

    if (name.startsWith("category-")) {
      const categoryName = name.replace("category-", "");
      setProject({
        ...project,
        selectedCategoryOptions: {
          ...project.selectedCategoryOptions,
          [categoryName]: value,
        },
      });
    } else {
      setProject({ ...project, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !userToken) return;

    const payload = {
      ...project,
      projectCategoryOptions: Object.entries(
        project.selectedCategoryOptions
      ).map(([categoryName, optionName]) => ({
        categoryName,
        optionName,
      })),
    };

    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update project");
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    }
  };
  

  if (loading)
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
  if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  console.log("Selected Options:", project.selectedCategoryOptions);
  console.log("Categories:", categories);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ">
        {/* Back Button */}
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Profile</span>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Edit Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              name="projectName"
              value={project.projectName}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Description
            </label>
            <textarea
              name="projectDescription"
              value={project.projectDescription || ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Link
            </label>
            <input
              type="url"
              name="projectLink"
              value={project.projectLink || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Created At
            </label>
            <input
              type="date"
              name="createdAt"
              value={project.createdAt}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent "
            />
          </div>

          {categories.map((category) => (
            <div key={category.categoryId}>
              <label className="block text-sm font-medium text-gray-700">
                {category.categoryName}
              </label>
              <select
                name={`category-${category.categoryName}`}
                value={
                  project.selectedCategoryOptions[category.categoryName] || ""
                }
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a {category.categoryName}</option>
                {category.options.map((opt) => (
                  <option key={opt.optionId} value={opt.optionName}>
                    {opt.optionName}
                  </option>
                ))}
              </select>
              {category.categoryName === "Domain" &&
                project.selectedCategoryOptions["Domain"] === "Other" && (
                  <input
                    type="text"
                    name="customDomain"
                    value={project.customDomain || ""}
                    onChange={handleChange}
                    placeholder="Enter custom domain"
                    required
                    className="mt-2 block w-full border border-gray-300 rounded-md p-2 active:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                  />
                )}
            </div>
          ))}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
            <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
