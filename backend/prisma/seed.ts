import { PrismaClient, ProficiencyLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial skills profile...');

  const initialSkills = [
    {
      name: 'NestJS',
      category: 'Backend',
      proficiencyLevel: ProficiencyLevel.ADVANCED,
      yearsExperience: 3.0,
      evidenceNotes:
        'Architected production REST APIs, implemented custom guard interceptors, role-based access control, and integrated Prisma ORM with PostgreSQL.',
    },
    {
      name: 'PostgreSQL',
      category: 'Database',
      proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
      yearsExperience: 3.5,
      evidenceNotes:
        'Designed relational schemas, foreign key cascades, written complex joins, and indexed high-query columns. Experience with migrations and local Docker setup.',
    },
    {
      name: 'Angular',
      category: 'Frontend',
      proficiencyLevel: ProficiencyLevel.INTERMEDIATE,
      yearsExperience: 2.0,
      evidenceNotes:
        'Built single-page applications using standalone components, Angular Signals for reactive state, ReactiveFormsModule, and HTTP interceptors.',
    },
    {
      name: 'Docker',
      category: 'DevOps',
      proficiencyLevel: ProficiencyLevel.BEGINNER,
      yearsExperience: 1.0,
      evidenceNotes:
        'Created Dockerfiles for Node apps and orchestrated local multi-container development environments using docker-compose. Limited production Kubernetes experience.',
    },
  ];

  for (const skill of initialSkills) {
    await prisma.userSkill.upsert({
      where: { name: skill.name },
      update: skill,
      create: skill,
    });
  }

  console.log('✅ Skills profile seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

