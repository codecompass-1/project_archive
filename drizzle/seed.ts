import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import { eq, and } from 'drizzle-orm';

import * as schema from '../lib/schema';

config({ path: '.env.local' });

// neonConfig.fetchQuotedChars = true;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  try {
    console.log('Seeding started...');

    // Clear existing data (optional, for a clean slate)
    await db.delete(schema.projectOptions);
    await db.delete(schema.teamMembers);
    await db.delete(schema.projects);
    await db.delete(schema.categoryOptionValues);
    await db.delete(schema.categories);

    // Seed Categories
    const [projectTypeCat] = await db.insert(schema.categories).values({ category: 'Project Type' }).returning();
    const [departmentCat] = await db.insert(schema.categories).values({ category: 'Department' }).returning();
    const [domainCat] = await db.insert(schema.categories).values({ category: 'Domain' }).returning();
    const [yearOfSubmissionCat] = await db.insert(schema.categories).values({ category: 'Year of Submission' }).returning();
    const [semesterCat] = await db.insert(schema.categories).values({ category: 'Semester' }).returning();

    // Seed Category Options
    const projectTypeOptions = [
      { categoryId: projectTypeCat.categoryId, optionName: 'Personal Project' },
      { categoryId: projectTypeCat.categoryId, optionName: 'Mini Project' },
      { categoryId: projectTypeCat.categoryId, optionName: 'Final Year Project' },
      { categoryId: projectTypeCat.categoryId, optionName: 'Product' },
      { categoryId: projectTypeCat.categoryId, optionName: 'Research Paper' },
      { categoryId: projectTypeCat.categoryId, optionName: 'Others' },
    ];

    const departmentOptions = [
      { categoryId: departmentCat.categoryId, optionName: 'CSE' },
      { categoryId: departmentCat.categoryId, optionName: 'ECE' },
      { categoryId: departmentCat.categoryId, optionName: 'EEE' },
      { categoryId: departmentCat.categoryId, optionName: 'ME' },
      { categoryId: departmentCat.categoryId, optionName: 'CE' },
      { categoryId: departmentCat.categoryId, optionName: 'AEI' },
      { categoryId: departmentCat.categoryId, optionName: 'Other' },
    ];

    const domainOptions = [
      { categoryId: domainCat.categoryId, optionName: 'Web Development' },
      { categoryId: domainCat.categoryId, optionName: 'App Development' },
      { categoryId: domainCat.categoryId, optionName: 'Machine Learning' },
      { categoryId: domainCat.categoryId, optionName: 'Artificial Intelligence' },
      { categoryId: domainCat.categoryId, optionName: 'Cyber Security' },
      { categoryId: domainCat.categoryId, optionName: 'Data Science' },
      { categoryId: domainCat.categoryId, optionName: 'Cloud Computing' },
      { categoryId: domainCat.categoryId, optionName: 'Blockchain' },
      { categoryId: domainCat.categoryId, optionName: 'Game Development' },
      { categoryId: domainCat.categoryId, optionName: 'IoT' },
      { categoryId: domainCat.categoryId, optionName: 'Robotics' },
      { categoryId: domainCat.categoryId, optionName: 'Other' },
    ];

    const yearOfSubmissionOptions = [
      { categoryId: yearOfSubmissionCat.categoryId, optionName: '2023' },
      { categoryId: yearOfSubmissionCat.categoryId, optionName: '2024' },
      { categoryId: yearOfSubmissionCat.categoryId, optionName: '2025' },
      { categoryId: yearOfSubmissionCat.categoryId, optionName: '2026' },
    ];

    const semesterOptions = [
      { categoryId: semesterCat.categoryId, optionName: 'S1' },
      { categoryId: semesterCat.categoryId, optionName: 'S2' },
      { categoryId: semesterCat.categoryId, optionName: 'S3' },
      { categoryId: semesterCat.categoryId, optionName: 'S4' },
      { categoryId: semesterCat.categoryId, optionName: 'S5' },
      { categoryId: semesterCat.categoryId, optionName: 'S6' },
      { categoryId: semesterCat.categoryId, optionName: 'S7' },
      { categoryId: semesterCat.categoryId, optionName: 'S8' },
    ];

    await db.insert(schema.categoryOptionValues).values([...projectTypeOptions, ...departmentOptions, ...domainOptions, ...yearOfSubmissionOptions, ...semesterOptions]);
    console.log('Categories and Options seeded.');

    // Helper function to get option ID by category name and option name
    async function getOptionId(categoryName: string, optionName: string): Promise<number | undefined> {
      const category = await db.query.categories.findFirst({
        where: eq(schema.categories.category, categoryName)
      });
      if (!category) return undefined;

      const option = await db.query.categoryOptionValues.findFirst({
        where: and(
          eq(schema.categoryOptionValues.categoryId, category.categoryId),
          eq(schema.categoryOptionValues.optionName, optionName)
        )
      });
      return option?.optionId;
    }

    // Seed Projects
    const projectsData = [
      {
        projectName: 'Repeto ',
        projectDescription: 'A platform where you can prevoious hackathon internship that repeat all year from top companys',
        projectLink: 'https://github.com/example/chatbot',
        createdAt: new Date('2025-01-15T00:00:00.000Z'),
        customDomain: null,
        members: [
          { name: 'Shadil A M', linkedin: 'https://www.linkedin.com/in/shadilam/' },
          { name: 'Sooraj Krishna K P', linkedin: 'https://www.linkedin.com/in/sooraj-krishna-k-p/' },
          { name: 'Abhijith S', linkedin: 'https://www.linkedin.com/in/abhijiths-s/' },
          { name: 'Abhiram P S', linkedin: 'https://www.linkedin.com/in/abhiram-ps-9b744924b/' },
        ],
        categories: [
          { categoryName: 'Project Type', optionName: 'Personal Project' },
          { categoryName: 'Department', optionName: 'CSE' },
          { categoryName: 'Year of Submission', optionName: '2025' },
          { categoryName: 'Domain', optionName: 'Web Development' }
        ]
      },
      {
        projectName: 'Nemini Electric website',
        projectDescription: 'Made a website for my friend fathers bussincess',
        projectLink: 'https://github.com/shadil-rayyan/nenmini-electric_website',
        createdAt: new Date('2024-06-10T00:00:00.000Z'),
        customDomain: null,
        members: [
          { name: 'Shadil A M', linkedin: 'https://www.linkedin.com/in/shadilam/' },
        ],
        categories: [
          { categoryName: 'Project Type', optionName: 'Personal Project' },
          { categoryName: 'Department', optionName: 'CSE' },
          { categoryName: 'Year of Submission', optionName: '2024' },
          { categoryName: 'Domain', optionName: 'Web Development' }
        ]
      },
      {
        projectName: 'Laptop Price Prediction',
        projectDescription: 'Implemented a machine learning model to predict laptop prices based on specifications, following a YouTube tutorial to enhance my ML skills.',
        projectLink: 'https://github.com/shadil-rayyan/My_Projects/tree/main/MachineLearning/LaptopPricePredicator%20-clone',
        createdAt: new Date('2023-09-22T00:00:00.000Z'),
        customDomain: null,
        members: [
          { name: 'Shadil A M', linkedin: 'https://www.linkedin.com/in/shadilam/' },
        ],
        categories: [
          { categoryName: 'Project Type', optionName: 'Personal Project' },
          { categoryName: 'Department', optionName: 'CSE' },
          { categoryName: 'Year of Submission', optionName: '2023' },
          { categoryName: 'Domain', optionName: 'Machine Learning' }
        ]
      },
      {
        projectName: 'Kerala Tourist Spot',
        projectDescription: 'Developed a Telegram bot to guide users to authentic dishes and restaurants in Kozhikode city, enhancing culinary exploration for locals and tourists alike.\n',
        projectLink: 'https://github.com/shadil-rayyan/kerala_tourist_spot-bot.git',
        createdAt: new Date('2025-03-27T20:34:40.196Z'),
        customDomain: null,
        members: [
          { name: 'Shadil A M', linkedin: 'https://www.linkedin.com/in/shadilam/' },
        ],
        categories: [
          { categoryName: 'Project Type', optionName: 'Personal Project' },
          { categoryName: 'Department', optionName: 'Other' },
          { categoryName: 'Year of Submission', optionName: '2025' },
          { categoryName: 'Domain', optionName: 'App Development' }
        ]
      }
    ];

    for (const projectData of projectsData) {
      const [newProject] = await db.insert(schema.projects).values({
        projectName: projectData.projectName,
        projectDescription: projectData.projectDescription,
        projectLink: projectData.projectLink,
        createdAt: projectData.createdAt,
        customDomain: projectData.customDomain,
      }).returning();

      if (newProject && newProject.projectId) {
        for (const member of projectData.members) {
          await db.insert(schema.teamMembers).values({
            projectId: newProject.projectId,
            name: member.name,
            linkedin: member.linkedin,
          });
        }

        for (const category of projectData.categories) {
          const optionId = await getOptionId(category.categoryName, category.optionName);
          if (optionId) {
            const cat = await db.query.categories.findFirst({
              where: eq(schema.categories.category, category.categoryName)
            });
            if (cat) {
              await db.insert(schema.projectOptions).values({
                projectId: newProject.projectId,
                categoryId: cat.categoryId,
                optionId: optionId,
              });
            }
          }
        }
      }
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main(); 
