// // app/api/profile-projects/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
// import { projects } from '@/lib/schema';
// import { eq } from 'drizzle-orm';
// import { adminAuth } from '@/lib/firebase/firebaseadmin';

// export async function GET(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.split("Bearer ")[1];

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
//     }

//     const decodedToken = await adminAuth.verifyIdToken(token);
//     const firebaseUid = decodedToken.uid;

//     const userProjects = await db
//       .select()
//       .from(projects)
//       .where(eq(projects.createdByUid, firebaseUid));

//     return NextResponse.json(userProjects);
//   } catch (err) {
//     console.error("Error in /api/profile-projects:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/profile-projects/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
// import { eq } from 'drizzle-orm';
// import { adminAuth } from '@/lib/firebase/firebaseadmin';
// import { projects } from '@/lib/schema';

// export async function GET(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.split("Bearer ")[1];

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
//     }

//     const decodedToken = await adminAuth.verifyIdToken(token);
//     const firebaseUid = decodedToken.uid;

//     const userProjects = await db.query.projects.findMany({
//       where: (fields, { eq }) => eq(fields.createdByUid, firebaseUid),
//       with: {
//         categories: {
//           with: {
//             category: true,
//             optionValue: true,
//           },
//         },
//         members: true,
//       },
//     });

//     // Transform the result to include flattened category structure
//     const result = userProjects.map((project) => ({
//       projectId: project.projectId,
//       projectName: project.projectName,
//       projectDescription: project.projectDescription,
//       projectLink: project.projectLink,
//       customDomain: project.customDomain,
//       createdAt: project.createdAt,
//       members: project.members,
//       categories: project.categories.map((cat) => ({
//         categoryName: cat.category.categoryName,
//         optionName: cat.optionValue.optionName,
//       })),
//     }));

//     return NextResponse.json(result);
//   } catch (err) {
//     console.error("Error in /api/profile-projects:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// app/api/profile-projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, teamMembers, projectOptions, categories, categoryOptionValues } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { adminAuth } from '@/lib/firebase/firebaseadmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    const allProjects = await db
      .select()
      .from(projects)
      .leftJoin(teamMembers, eq(projects.projectId, teamMembers.projectId))
      .where(eq(projects.createdByUid, firebaseUid)); // ✅ filter here

    const grouped = allProjects.reduce((acc: any[], row) => {
      const existing = acc.find(p => p.projectId === row.projects.projectId);
      if (existing) {
        if (row.team_members) existing.members.push(row.team_members);
      } else {
        acc.push({ ...row.projects, members: row.team_members ? [row.team_members] : [] });
      }
      return acc;
    }, []);

    const finalProjects = await Promise.all(grouped.map(async (project) => {
      const projectOpts = await db.select({
        categoryId: projectOptions.categoryId,
        optionId: projectOptions.optionId
      })
      .from(projectOptions)
      .where(eq(projectOptions.projectId, project.projectId));

      const categoriesArray = await Promise.all(projectOpts.map(async (opt) => {
        const cat = await db.select({ categoryName: categories.category }).from(categories).where(eq(categories.categoryId, opt.categoryId));
        const val = await db.select({ optionName: categoryOptionValues.optionName }).from(categoryOptionValues).where(eq(categoryOptionValues.optionId, opt.optionId));

        return cat.length && val.length ? {
          categoryName: cat[0].categoryName!,
          optionName: val[0].optionName!
        } : null;
      }));

      return {
        ...project,
        categories: categoriesArray.filter(Boolean),
      };
    }));

    return NextResponse.json(finalProjects);
  } catch (err) {
    console.error("Error in /api/profile-projects:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
