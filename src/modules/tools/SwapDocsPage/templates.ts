export const SERVICE_TEMPLATES = [
  {
    id: "complete-web-application",
    name: "Complete web application",
    summary: "1.588 EUR · delivery + managed infrastructure",
    description: "Professional web/app delivery with analysis, backend, frontend, database, testing, deployment, hosting and project management.",
    proformaItems: [
      { description: "Requirements analysis and solution design", hours: 15, rate: 15, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 225 },
      { description: "Backend API development", hours: 18, rate: 20, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 360 },
      { description: "Frontend implementation", hours: 12, rate: 18, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 216 },
      { description: "Database modeling", hours: 5, rate: 20, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 100 },
      { description: "Testing and corrections", hours: 5, rate: 15, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 75 },
      { description: "Deployment and configuration", hours: 7, rate: 18, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 126 },
      { description: "Managed VPS hosting", hours: 1, rate: 186, lineType: "recurring_service", unitType: "monthly", internalCost: 80, clientPrice: 186, provider: "External provider", recurrenceMonths: 1 },
      { description: "Project management and contingency", hours: 1, rate: 300, lineType: "margin", unitType: "fixed", internalCost: 0, clientPrice: 300 },
    ],
  },
  {
    id: "backend-api-development",
    name: "Backend API development",
    summary: "620 EUR · API + database",
    description: "Backend delivery with REST API, business logic, database model and basic testing.",
    proformaItems: [
      { description: "Technical analysis", hours: 4, rate: 15, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 60 },
      { description: "Database model and migrations", hours: 6, rate: 20, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 120 },
      { description: "Endpoints and business logic", hours: 14, rate: 20, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 280 },
      { description: "API testing", hours: 4, rate: 15, lineType: "own_work", unitType: "hour", internalCost: 0, clientPrice: 60 },
      { description: "Project management", hours: 1, rate: 100, lineType: "margin", unitType: "fixed", internalCost: 0, clientPrice: 100 },
    ],
  },
  {
    id: "managed-hosting-domain",
    name: "Managed hosting and domain",
    summary: "39 EUR/month + 18 EUR/year",
    description: "Recurring external services managed for the client.",
    proformaItems: [
      { description: "Managed hosting", hours: 1, rate: 39, lineType: "recurring_service", unitType: "monthly", internalCost: 15, clientPrice: 39, provider: "External provider", recurrenceMonths: 1 },
      { description: "Domain registration", hours: 1, rate: 18, lineType: "recurring_service", unitType: "yearly", internalCost: 12, clientPrice: 18, provider: "Domain registrar", recurrenceMonths: 12 },
      { description: "Monthly maintenance", hours: 2, rate: 18, lineType: "own_work", unitType: "monthly", internalCost: 0, clientPrice: 36, recurrenceMonths: 1 },
    ],
  },
  {
    id: "monthly-maintenance",
    name: "Monthly maintenance",
    summary: "79 EUR/month",
    description: "Monthly maintenance, support and preventive review.",
    proformaItems: [
      { description: "Monthly maintenance", hours: 1, rate: 79, lineType: "recurring_service", unitType: "monthly", internalCost: 25, clientPrice: 79, recurrenceMonths: 1 },
    ],
  },
] as const;

export const ESTIMATION_TEMPLATES = [
  {
    id: "professional-work-plan",
    name: "Professional work plan",
    items: [
      { category: "Analysis", task: "Initial requirements session", optimistic: 1, probable: 2, pessimistic: 4 },
      { category: "Backend", task: "Implement data model and API", optimistic: 8, probable: 14, pessimistic: 22 },
      { category: "Frontend", task: "Build user interface and forms", optimistic: 8, probable: 12, pessimistic: 20 },
      { category: "Testing", task: "Validate main workflows and fix issues", optimistic: 3, probable: 5, pessimistic: 9 },
      { category: "Deployment", task: "Deploy and configure production environment", optimistic: 2, probable: 4, pessimistic: 7 },
    ],
  },
] as const;

export const COST_TEMPLATES = [
  {
    id: "legacy-web-application-costs",
    name: "Legacy web application costs",
    items: [
      { stage: "Analysis", task: "Requirements analysis", hours: 6, unitCost: 15 },
      { stage: "Backend", task: "Backend API implementation", hours: 18, unitCost: 20 },
      { stage: "Frontend", task: "Frontend implementation", hours: 12, unitCost: 18 },
      { stage: "Database", task: "Database modeling", hours: 5, unitCost: 20 },
      { stage: "Testing", task: "Testing and corrections", hours: 5, unitCost: 15 },
      { stage: "Deployment", task: "Deployment and configuration", hours: 7, unitCost: 18 },
      { stage: "Infrastructure", task: "Managed VPS provider cost", hours: 1, unitCost: 80, notes: "Legacy internal cost only." },
      { stage: "Management", task: "Project management and contingency", hours: 1, unitCost: 300 },
    ],
  },
] as const;
