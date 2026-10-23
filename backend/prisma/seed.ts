import {
  InterviewStatus,
  PrismaClient,
  ProficiencyLevel,
  RoundType,
} from '@prisma/client';

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

  console.log('🌱 Seeding sample confirmed interviews...');

  const sampleInterviews = [
    {
      company: 'Stripe',
      role: 'Senior Backend Engineer',
      roundType: RoundType.SYSTEM_DESIGN,
      status: InterviewStatus.UPCOMING,
      scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      jobDescriptionText: `We are looking for a Senior Backend Engineer to join our Global Payment Infrastructure team.

Responsibilities:
- Architect high-throughput, fault-tolerant payment ingestion APIs handling millions of transactions.
- Design distributed event-driven systems using Apache Kafka to ensure idempotent event processing.
- Maintain high concurrency and data integrity across distributed PostgreSQL databases.
- Deploy and monitor microservices running on Kubernetes with Prometheus/Grafana.

Requirements:
- 4+ years building production backend services with Node.js/TypeScript or Go.
- Deep understanding of distributed transactions, ACID guarantees, and database locking.
- Hands-on production experience with Apache Kafka, RabbitMQ, or AWS SQS.
- Practical experience with container orchestration using Docker and Kubernetes.`,
      notes: 'Focus on distributed idempotency, saga pattern, and partition key strategy.',
    },
    {
      company: 'Datadog',
      role: 'Fullstack Engineer',
      roundType: RoundType.TECHNICAL,
      status: InterviewStatus.UPCOMING,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      jobDescriptionText: `Looking for a Fullstack Engineer to develop telemetry visualization dashboards.

Requirements:
- 2+ years of experience with modern Angular or React frontend architectures.
- Experience with NestJS or Express for RESTful API development.
- Strong fundamentals in PostgreSQL database design, indexing, and query optimization.
- Familiarity with Docker containerization and CI/CD workflows.`,
      notes: 'Prepare for live coding of an API endpoint and Angular reactive state management.',
    },
  ];

  for (const interviewData of sampleInterviews) {
    const existing = await prisma.interview.findFirst({
      where: { company: interviewData.company, role: interviewData.role },
    });

    if (!existing) {
      const created = await prisma.interview.create({
        data: {
          ...interviewData,
          checklistItems: {
            create: [
              { label: 'Research company background, product, and engineering culture' },
              { label: 'Prepare 3–5 reverse questions for the interviewer' },
              { label: 'Review past projects using STAR method (Situation, Task, Action, Result)' },
              { label: 'Review identified skill gaps and practice sample questions' },
            ],
          },
        },
      });
      console.log(`  Created interview: ${created.company} (${created.role}) -> ID: ${created.id}`);
    } else {
      console.log(`  Interview already exists: ${existing.company} (${existing.role}) -> ID: ${existing.id}`);
    }
  }

  console.log('✅ Interviews seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
