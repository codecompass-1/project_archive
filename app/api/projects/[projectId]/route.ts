import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  projects,
  teamMembers,
  projectOptions,
  categories,
  categoryOptionValues,
} from "@/lib/schema";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const numericId = Number(projectId);

  if (isNaN(numericId)) {
    return new Response(JSON.stringify({ error: "Invalid project ID" }), {
      status: 400,
    });
  }

  try {
    const [projectData] = await db
      .select()
      .from(projects)
      .where(eq(projects.projectId, numericId));

    if (!projectData) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    const members = await db
      .select({ name: teamMembers.name, linkedin: teamMembers.linkedin })
      .from(teamMembers)
      .where(eq(teamMembers.projectId, numericId));

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
      .where(eq(projectOptions.projectId, numericId));

    return new Response(
      JSON.stringify({
        ...projectData,
        members,
        categories: categoryOptions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error fetching project:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
