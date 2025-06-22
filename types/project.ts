export interface Project {
  projectId?: number;
  projectName: string;
  projectDescription: string;
  projectLink: string;
  members?: { name: string; linkedin: string }[];
  createdAt: string;
  customDomain?: string;
  categories?: { categoryName: string; optionName: string }[];

  // ✅ Add this to fix the "any" error in edit page
  selectedCategoryOptions: Record<string, string>;
}

export interface CategoryOption {
  optionId: number;
  optionName: string;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  options: CategoryOption[];
}
