// File: app/api/projects/[projectId]/route.ts

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/firebase/config"; // if you verify auth in API, else skip this
import {
  projects,
  teamMembers,
  projectOptions,
  categories,
  categoryOptionValues,
} from "@/lib/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = Number(params.projectId);
  if (isNaN(projectId)) {
    return new Response(JSON.stringify({ error: "Invalid project ID" }), { status: 400 });
  }

  try {
    const [projectData] = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, projectId));

    if (!projectData) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    const members = await db
      .select({ name: teamMembers.name, linkedin: teamMembers.linkedin })
      .from(teamMembers)
      .where(eq(teamMembers.projectId, projectId));

    const categoryOptions = await db
      .select({
        categoryName: categories.category,
        optionName: categoryOptionValues.optionName,
      })
      .from(projectOptions)
      .leftJoin(categories, eq(projectOptions.categoryId, categories.categoryId))
      .leftJoin(
        categoryOptionValues,
        eq(projectOptions.optionId, categoryOptionValues.optionId)
      )
      .where(eq(projectOptions.projectId, projectId));

    return new Response(
      JSON.stringify({
        ...projectData,
        members,
        categories: categoryOptions,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching project:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
