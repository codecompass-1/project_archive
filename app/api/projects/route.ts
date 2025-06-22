import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { projects, teamMembers, projectOptions, categories, categoryOptionValues,users } from '../../../lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';


export async function GET(req: NextRequest) {
  try {
    const allProjects = await db.select().from(projects).leftJoin(teamMembers, eq(projects.projectId, teamMembers.projectId));
    
    // Group members by project
    const projectsWithMembers: any[] = allProjects.reduce((acc: any[], row) => {
      const existingProject = acc.find(p => p.projectId === row.projects.projectId);
      if (existingProject) {
        if (row.team_members) {
          existingProject.members.push(row.team_members);
        }
      } else {
        acc.push({
          ...row.projects,
          members: row.team_members ? [row.team_members] : [],
        });
      }
      return acc;
    }, []);

    // Fetch categories and options for each project based on the new schema
    const finalProjects = await Promise.all(projectsWithMembers.map(async (project) => {
      const projectCategoryOptions: { categoryName: string; optionName: string }[] = [];

      const projectOpts = await db.select({
          categoryId: projectOptions.categoryId,
          optionId: projectOptions.optionId
      })
        .from(projectOptions)
        .where(eq(projectOptions.projectId, project.projectId));

      for (const opt of projectOpts) {
        const category = await db.select({ categoryName: categories.category }).from(categories).where(eq(categories.categoryId, opt.categoryId!));
        if (category.length > 0) {
          const optionValue = await db.select({ optionName: categoryOptionValues.optionName }).from(categoryOptionValues).where(eq(categoryOptionValues.optionId, opt.optionId!));
          
          if (optionValue.length > 0) {
            projectCategoryOptions.push({
              categoryName: category[0].categoryName!,
              optionName: optionValue[0].optionName!,
            });
          }
        }
      }

      return {
        ...project,
        categories: projectCategoryOptions, // Attach the generic categories array
      };
    }));

    console.log('GET /api/projects - Final projects data sent:', JSON.stringify(finalProjects, null, 2));

    return NextResponse.json(finalProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ message: 'Failed to fetch projects.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = req.cookies.get('__session')?.value;
    console.log('Token from cookie:', token); // 👈 Log this

    if (!token) {
      console.warn('No token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    console.log('Decoded Firebase UID:', decodedToken.uid);
    const firebaseUid = decodedToken.uid;

    const { projectName, projectDescription, projectLink, createdAt, members, projectCategoryOptions, customDomain } = await req.json();

    console.log('POST /api/projects - Incoming project data:', { projectName, projectDescription, projectCategoryOptions, customDomain });

    await db
      .insert(users)
      .values({
        uid: firebaseUid,
        userRole: 'member', // or another default role as appropriate
      })
      .onConflictDoNothing(); // Ensure user exists, do nothing if already exists
      
    const [newProject] = await db.insert(projects).values({
      projectName,
      projectDescription,
      projectLink,
      createdAt: new Date(createdAt),
      customDomain: customDomain, // Save customDomain directly
      createdByUid: firebaseUid, // Save the Firebase UID of the user creating the project
    }).returning({ projectId: projects.projectId });

    if (!newProject || !newProject.projectId) {
      console.error('Failed to insert new project:', projectName);
      return NextResponse.json({ message: 'Failed to create project.' }, { status: 500 });
    }

    console.log('POST /api/projects - New project created with ID:', newProject.projectId);

    if (members && members.length > 0) {
      for (const member of members) {
        await db.insert(teamMembers).values({
          projectId: newProject.projectId,
          name: member.name,
          linkedin: member.linkedin,
        });
      }
      console.log('POST /api/projects - Team members inserted.');
    }

    // Link project to categories using the new dynamic schema
    if (projectCategoryOptions && newProject.projectId) {
      for (const mapping of projectCategoryOptions) {
        console.log(`POST /api/projects - Processing category mapping: ${mapping.categoryName} = ${mapping.optionName}`);
        if (mapping.optionName) { 
          const category = await db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.category, mapping.categoryName));
          console.log(`POST /api/projects - Category lookup result for ${mapping.categoryName}:`, category);

          if (category.length > 0 && category[0].categoryId) {
            // Determine the actual option name to link in categoryOptionValues
            // If it's the 'Domain' category and customDomain is provided, link to 'Other'
            const actualOptionNameForLinking = (mapping.categoryName === 'Domain' && customDomain) ? 'Other' : mapping.optionName;

            const option = await db.select({ optionId: categoryOptionValues.optionId }).from(categoryOptionValues)
                                   .where(and(
                                       eq(categoryOptionValues.optionName, actualOptionNameForLinking),
                                       eq(categoryOptionValues.categoryId, category[0].categoryId)
                                   ));
            console.log(`POST /api/projects - Option lookup result for ${actualOptionNameForLinking} in category ${mapping.categoryName}:`, option);

            if (option.length > 0 && option[0].optionId) {
              console.log('POST /api/projects - Inserting into projectOptions:', { projectId: newProject.projectId, categoryId: category[0].categoryId, optionId: option[0].optionId });
              await db.insert(projectOptions).values({
                projectId: newProject.projectId,
                categoryId: category[0].categoryId,
                optionId: option[0].optionId,
              });
              console.log('POST /api/projects - Inserted into projectOptions.');
            } else {
              console.warn(`POST /api/projects - Option not found for ${actualOptionNameForLinking} in category ${mapping.categoryName}. Skipping linking.`);
            }
          } else {
            console.warn(`POST /api/projects - Category not found for name: ${mapping.categoryName}. Skipping linking.`);
          }
        } else {
          console.log(`POST /api/projects - Option name is empty for category ${mapping.categoryName}. Skipping linking.`);
        }
      }
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json({ message: 'Failed to add project.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { projectId, projectName, projectDescription, projectLink, createdAt, members, projectCategoryOptions, customDomain } = await req.json();

    console.log('PUT /api/projects - Incoming project data:', { projectId, projectName, projectDescription, projectCategoryOptions, customDomain });

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID is required for update.' }, { status: 400 });
    }

    // Update project details
    await db.update(projects).set({
      projectName,
      projectDescription,
      projectLink,
      createdAt: new Date(createdAt),
      customDomain: customDomain, // Save customDomain directly
    }).where(eq(projects.projectId, projectId));

    console.log('PUT /api/projects - Project details updated.');

    // Update team members: clear existing and insert new ones
    await db.delete(teamMembers).where(eq(teamMembers.projectId, projectId));
    if (members && members.length > 0) {
      for (const member of members) {
        await db.insert(teamMembers).values({
          projectId: projectId,
          name: member.name,
          linkedin: member.linkedin,
        });
      }
      console.log('PUT /api/projects - Team members updated.');
    }

    // Update project category options: clear existing and insert new ones
    await db.delete(projectOptions).where(eq(projectOptions.projectId, projectId));
    if (projectCategoryOptions && projectCategoryOptions.length > 0) {
      for (const mapping of projectCategoryOptions) {
        console.log(`PUT /api/projects - Processing category mapping: ${mapping.categoryName} = ${mapping.optionName}`);
        if (mapping.optionName) {
          const category = await db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.category, mapping.categoryName));

          if (category.length > 0 && category[0].categoryId) {
            // Determine the actual option name to link in categoryOptionValues
            // If it's the 'Domain' category and customDomain is provided, link to 'Other'
            const actualOptionNameForLinking = (mapping.categoryName === 'Domain' && customDomain) ? 'Other' : mapping.optionName;

            const option = await db.select({ optionId: categoryOptionValues.optionId }).from(categoryOptionValues)
                                   .where(and(
                                       eq(categoryOptionValues.optionName, actualOptionNameForLinking),
                                       eq(categoryOptionValues.categoryId, category[0].categoryId)
                                   ));
            console.log(`PUT /api/projects - Option lookup result for ${actualOptionNameForLinking} in category ${mapping.categoryName}:`, option);

            if (option.length > 0 && option[0].optionId) {
              await db.insert(projectOptions).values({
                projectId: projectId,
                categoryId: category[0].categoryId,
                optionId: option[0].optionId,
              });
            } else {
              console.warn(`PUT /api/projects - Option not found for ${actualOptionNameForLinking} in category ${mapping.categoryName}. Skipping linking.`);
            }
          } else {
            console.warn(`PUT /api/projects - Category not found for name: ${mapping.categoryName}. Skipping linking.`);
          }
        } else {
          console.log(`PUT /api/projects - Option name is empty for category ${mapping.categoryName}. Skipping linking.`);
        }
      }
      console.log('PUT /api/projects - Project category options updated.');
    }

    return NextResponse.json({ message: 'Project updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ message: 'Failed to update project.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    await db.delete(projectOptions).where(eq(projectOptions.projectId, projectId));
    await db.delete(teamMembers).where(eq(teamMembers.projectId, projectId));
    await db.delete(projects).where(eq(projects.projectId, projectId));

    return NextResponse.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ message: 'Failed to delete project.' }, { status: 500 });
  }
} 