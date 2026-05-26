import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding professional SwapDocs catalog...");

  await prisma.serviceTemplateLine.deleteMany();
  await prisma.serviceTemplate.deleteMany();
  await prisma.serviceRate.deleteMany();
  await prisma.service.deleteMany();

  const services = [
    {
      name: "Web application development",
      description: "Own work for websites, applications and internal dashboards.",
      category: "web_app",
      lineType: "own_work" as const,
      defaultUnitType: "hour" as const,
      rates: [
        { label: "Frontend implementation", unitType: "hour", rate: 18, internalCost: 0, clientPrice: 18 },
        { label: "Backend API development", unitType: "hour", rate: 20, internalCost: 0, clientPrice: 20 },
        { label: "Database modeling", unitType: "hour", rate: 20, internalCost: 0, clientPrice: 20 },
      ],
    },
    {
      name: "Managed hosting",
      description: "Managed hosting or VPS service for clients.",
      category: "hosting",
      lineType: "recurring_service" as const,
      provider: "External provider",
      defaultUnitType: "monthly" as const,
      rates: [
        { label: "Managed hosting", unitType: "monthly", rate: 39, internalCost: 15, clientPrice: 39 },
        { label: "Managed VPS", unitType: "monthly", rate: 186, internalCost: 80, clientPrice: 186 },
      ],
    },
    {
      name: "Domain registration",
      description: "Domain registration and yearly renewal.",
      category: "hosting",
      lineType: "recurring_service" as const,
      provider: "Domain registrar",
      defaultUnitType: "yearly" as const,
      rates: [
        { label: "Domain registration", unitType: "yearly", rate: 18, internalCost: 12, clientPrice: 18 },
      ],
    },
    {
      name: "Monthly maintenance",
      description: "Preventive review, support and small monthly improvements.",
      category: "maintenance",
      lineType: "own_work" as const,
      defaultUnitType: "monthly" as const,
      rates: [
        { label: "Monthly maintenance", unitType: "monthly", rate: 79, internalCost: 25, clientPrice: 79 },
      ],
    },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        name: service.name,
        description: service.description,
        category: service.category,
        lineType: service.lineType,
        provider: "provider" in service ? service.provider : null,
        defaultUnitType: service.defaultUnitType,
        rates: { create: service.rates },
      },
    });
  }

  const templates = [
    {
      name: "Complete web application",
      description: "Professional web/app delivery with managed infrastructure.",
      category: "web_app",
      lines: [
        { description: "Requirements analysis and solution design", hours: 15, rate: 15, amount: 225, clientPrice: 225, sortOrder: 0 },
        { description: "Backend API development", hours: 18, rate: 20, amount: 360, clientPrice: 360, sortOrder: 1 },
        { description: "Frontend implementation", hours: 12, rate: 18, amount: 216, clientPrice: 216, sortOrder: 2 },
        { description: "Database modeling", hours: 5, rate: 20, amount: 100, clientPrice: 100, sortOrder: 3 },
        { description: "Testing and corrections", hours: 5, rate: 15, amount: 75, clientPrice: 75, sortOrder: 4 },
        { description: "Deployment and configuration", hours: 7, rate: 18, amount: 126, clientPrice: 126, sortOrder: 5 },
        { description: "Managed VPS hosting", hours: 1, rate: 186, amount: 186, lineType: "recurring_service" as const, unitType: "monthly" as const, internalCost: 80, clientPrice: 186, provider: "External provider", isRecurring: true, recurrenceMonths: 1, sortOrder: 6 },
        { description: "Project management and contingency", hours: 1, rate: 300, amount: 300, lineType: "margin" as const, unitType: "fixed" as const, clientPrice: 300, sortOrder: 7 },
      ],
    },
    {
      name: "Backend API development",
      description: "Backend delivery with API, database model and tests.",
      category: "backend_api",
      lines: [
        { description: "Technical analysis", hours: 4, rate: 15, amount: 60, clientPrice: 60, sortOrder: 0 },
        { description: "Database model and migrations", hours: 6, rate: 20, amount: 120, clientPrice: 120, sortOrder: 1 },
        { description: "Endpoints and business logic", hours: 14, rate: 20, amount: 280, clientPrice: 280, sortOrder: 2 },
        { description: "API testing", hours: 4, rate: 15, amount: 60, clientPrice: 60, sortOrder: 3 },
        { description: "Project management", hours: 1, rate: 100, amount: 100, lineType: "margin" as const, unitType: "fixed" as const, clientPrice: 100, sortOrder: 4 },
      ],
    },
    {
      name: "Managed hosting and domain",
      description: "Recurring hosting and domain services managed for the client.",
      category: "hosting",
      lines: [
        { description: "Managed hosting", hours: 1, rate: 39, amount: 39, lineType: "recurring_service" as const, unitType: "monthly" as const, internalCost: 15, clientPrice: 39, provider: "External provider", isRecurring: true, recurrenceMonths: 1, sortOrder: 0 },
        { description: "Domain registration", hours: 1, rate: 18, amount: 18, lineType: "recurring_service" as const, unitType: "yearly" as const, internalCost: 12, clientPrice: 18, provider: "Domain registrar", isRecurring: true, recurrenceMonths: 12, sortOrder: 1 },
        { description: "Monthly maintenance", hours: 2, rate: 18, amount: 36, clientPrice: 36, sortOrder: 2 },
      ],
    },
    {
      name: "Monthly maintenance",
      description: "Monthly maintenance, support and preventive review.",
      category: "maintenance",
      lines: [
        { description: "Monthly maintenance", hours: 1, rate: 79, amount: 79, lineType: "recurring_service" as const, unitType: "monthly" as const, internalCost: 25, clientPrice: 79, isRecurring: true, recurrenceMonths: 1, sortOrder: 0 },
      ],
    },
  ];

  for (const template of templates) {
    await prisma.serviceTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category,
        lines: { create: template.lines },
      },
    });
  }

  console.log(`Seeded ${services.length} services and ${templates.length} templates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
