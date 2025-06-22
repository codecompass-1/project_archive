"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, XCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config"; // Import auth

interface CategoryOption {
  optionId: number;
  optionName: string;
}

interface Category {
  categoryId: number;
  categoryName: string;
  options: CategoryOption[];
}

const AddProjectPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (e: any) {
        setErrorCategories(e.message);
        console.error("Failed to fetch categories:", e);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const initialFormState = {
    projectName: "",
    projectDescription: "",
    projectLink: "",
    createdAt: "",
    members: [{ name: "", linkedin: "" }],
    selectedCategoryOptions: {} as Record<string, string>,
    customDomain: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loadingCategories && categories.length > 0) {
      setFormData((prev) => {
        const newSelectedOptions: Record<string, string> = {};
        categories.forEach((cat) => {
          if (cat.options.length > 0) {
            newSelectedOptions[cat.categoryName] = cat.options[0].optionName;
          }
        });
        return { ...prev, selectedCategoryOptions: newSelectedOptions };
      });
    }
  }, [loadingCategories, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const hasValidMember = formData.members.some(
      (member) => member.name.trim() !== ""
    );
    if (!hasValidMember) {
      alert("Please enter at least one member name.");
      return;
    }

    setLoading(true);

    const filteredMembers = formData.members.filter(
      (member) => member.name.trim() !== ""
    );

    const projectCategoryOptions :{categoryName: string; optionName:string}[]= Object.entries(
      formData.selectedCategoryOptions
    ).map(([categoryName, optionName]) => ({
      categoryName,
      optionName:
        categoryName === "Domain" && optionName === "Other"
          ? formData.customDomain
          : optionName,
    }));

    const projectData = {
      projectName: formData.projectName,
      projectDescription: formData.projectDescription,
      projectLink: formData.projectLink,
      createdAt: new Date().toISOString(),
      members: filteredMembers,
      projectCategoryOptions,
      customDomain:
        formData.selectedCategoryOptions["Domain"] === "Other"
          ? formData.customDomain
          : undefined,
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit a project.");
        setLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      document.cookie = `__session=${idToken}; path=/;`;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        localStorage.removeItem("cachedProjects");
        setFormData(initialFormState);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        alert("Failed to save project.");
      }
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("category-")) {
      const categoryName = name.replace("category-", "");
      setFormData((prev) => ({
        ...prev,
        selectedCategoryOptions: {
          ...prev.selectedCategoryOptions,
          [categoryName]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index][field as keyof typeof updatedMembers[0]] = value;
    setFormData({ ...formData, members: updatedMembers });
  };

  const addMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: "", linkedin: "" }],
    });
  };

  const removeMember = (index: number) => {
    const updatedMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: updatedMembers });
  };

  const clearForm = () => {
    setFormData(initialFormState);
  };

  if (loadingCategories) {
    return <div className="text-center py-8">Loading form data...</div>;
  }

  if (errorCategories) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading form data: {errorCategories}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Project</h1>
        </div>
      </div>

      {showPopup && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
          🎉 Congratulations! Your project was saved successfully!
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <input
            type="text"
            name="projectName"
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Project Name"
            onChange={handleChange}
            value={formData.projectName}
          />
          <textarea
            name="projectDescription"
            required
            rows={4}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Project Description"
            onChange={handleChange}
            value={formData.projectDescription}
          />

          {categories.length>0 && categories.map((category) => (
            <div key={category.categoryId} className="mb-4">
              <label className="block mb-1 text-sm font-medium">
                {category.categoryName}
              </label>
              <select
              id={`category-${category.categoryName}`}
                name={`category-${category.categoryName}`}
                required
                className="w-full px-4 py-2 border rounded-lg"
                onChange={handleChange}
                value={
                  formData.selectedCategoryOptions[category.categoryName] || ""
                }
              >
                {category.options.map((option) => (
                  <option key={option.optionId} value={option.optionName}>
                    {option.optionName}
                  </option>
                ))}
              </select>
              {category.categoryName === "Domain" &&
                formData.selectedCategoryOptions["Domain"] === "Other" && (
                  <input
                    type="text"
                    name="customDomain"
                    className="mt-2 w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter custom domain"
                    onChange={handleChange}
                    value={formData.customDomain}
                  />
                )}
            </div>
          ))}

          <input
            type="url"
            name="projectLink"
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Project Link (e.g. GitHub)"
            onChange={handleChange}
            value={formData.projectLink}
          />

          {formData.members.map((member, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                className="px-4 py-2 border rounded-lg w-1/2"
                placeholder="Member Name"
                value={member.name}
                onChange={(e) =>
                  handleMemberChange(index, "name", e.target.value)
                }
              />
              <input
                type="url"
                className="px-4 py-2 border rounded-lg w-1/2"
                placeholder="LinkedIn Profile"
                value={member.linkedin}
                onChange={(e) =>
                  handleMemberChange(index, "linkedin", e.target.value)
                }
                disabled={!member.name.trim()}
              />
              {formData.members.length > 1 && (
                <button
                  type="button"
                  className="text-red-500"
                  onClick={() => removeMember(index)}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="w-full bg-gray-200 px-4 py-2 rounded-lg"
            onClick={addMember}
          >
            Add Member
          </button>

          <div className="flex gap-4">
            <button
              type="submit"
              className={`flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center ${
                loading ||
                formData.members.every((m) => m.name.trim() === "")
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                loading || formData.members.every((m) => m.name.trim() === "")
              }
            >
              {loading ? (
                <>
                  <Save className="h-5 w-5 mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  <span>Save Project</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-center"
              onClick={clearForm}
            >
              <XCircle className="h-5 w-5 mr-2" />
              <span>Clear</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectPage;
