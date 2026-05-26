import type { Locale } from "@/lib/locale";

type LabelMap = Record<string, { es: string; en: string }>;

const statusLabels: LabelMap = {
  draft: { es: "Borrador", en: "Draft" },
  sent: { es: "Enviada", en: "Sent" },
  accepted: { es: "Aceptada", en: "Accepted" },
  rejected: { es: "Rechazada", en: "Rejected" },
  converted: { es: "Convertida", en: "Converted" },
  cancelled: { es: "Cancelada", en: "Cancelled" },
  paid: { es: "Pagada", en: "Paid" },
  overdue: { es: "Vencida", en: "Overdue" },
  pending: { es: "Pendiente", en: "Pending" },
  in_progress: { es: "En curso", en: "In progress" },
  done: { es: "Hecha", en: "Done" },
  completed: { es: "Completado", en: "Completed" },
  active: { es: "Activo", en: "Active" },
  inactive: { es: "Inactivo", en: "Inactive" },
};

const lineTypeLabels: LabelMap = {
  own_work: { es: "Trabajo propio", en: "Own work" },
  external_cost: { es: "Coste externo", en: "External cost" },
  recurring_service: { es: "Recurrente", en: "Recurring" },
  margin: { es: "Gestión", en: "Management" },
};

const unitLabels: LabelMap = {
  hour: { es: "Hora", en: "Hour" },
  fixed: { es: "Fijo", en: "Fixed" },
  monthly: { es: "Mensual", en: "Monthly" },
  yearly: { es: "Anual", en: "Yearly" },
};

const paymentMethodLabels: LabelMap = {
  bank_transfer: { es: "Transferencia bancaria", en: "Bank transfer" },
  card: { es: "Tarjeta", en: "Card" },
  paypal: { es: "PayPal", en: "PayPal" },
  bizum: { es: "Bizum", en: "Bizum" },
  cash: { es: "Efectivo", en: "Cash" },
  other: { es: "Otro método", en: "Other method" },
};

const categoryLabels: LabelMap = {
  Analysis: { es: "Análisis", en: "Analysis" },
  Backend: { es: "Backend", en: "Backend" },
  Frontend: { es: "Frontend", en: "Frontend" },
  Database: { es: "Base de datos", en: "Database" },
  Testing: { es: "Pruebas", en: "Testing" },
  Deployment: { es: "Despliegue", en: "Deployment" },
  Infrastructure: { es: "Infraestructura", en: "Infrastructure" },
  Management: { es: "Gestión", en: "Management" },
  General: { es: "General", en: "General" },
  Template: { es: "Plantilla", en: "Template" },
  Proforma: { es: "Proforma", en: "Proforma" },
};

const professionalLabels: LabelMap = {
  "Complete web application": { es: "Aplicación web completa", en: "Complete web application" },
  "Backend API development": { es: "Desarrollo de API backend", en: "Backend API development" },
  "Frontend implementation": { es: "Implementación frontend", en: "Frontend implementation" },
  "Database modeling": { es: "Modelado de base de datos", en: "Database modeling" },
  "Deployment and configuration": { es: "Despliegue y configuración", en: "Deployment and configuration" },
  "Managed hosting and domain": { es: "Hosting gestionado y dominio", en: "Managed hosting and domain" },
  "Managed hosting": { es: "Hosting gestionado", en: "Managed hosting" },
  "Managed VPS hosting": { es: "Hosting VPS gestionado", en: "Managed VPS hosting" },
  "Domain registration": { es: "Registro de dominio", en: "Domain registration" },
  "Monthly maintenance": { es: "Mantenimiento mensual", en: "Monthly maintenance" },
  "Requirements analysis and solution design": { es: "Análisis de requisitos y diseño de solución", en: "Requirements analysis and solution design" },
  "Testing and corrections": { es: "Pruebas y correcciones", en: "Testing and corrections" },
  "Project management and contingency": { es: "Gestión del proyecto y contingencia", en: "Project management and contingency" },
  "Technical analysis": { es: "Análisis técnico", en: "Technical analysis" },
  "Database model and migrations": { es: "Modelo de datos y migraciones", en: "Database model and migrations" },
  "Endpoints and business logic": { es: "Endpoints y lógica de negocio", en: "Endpoints and business logic" },
  "API testing": { es: "Pruebas de API", en: "API testing" },
  "Project management": { es: "Gestión del proyecto", en: "Project management" },
  "Professional work plan": { es: "Plan de trabajo profesional", en: "Professional work plan" },
  "Initial requirements session": { es: "Sesión inicial de requisitos", en: "Initial requirements session" },
  "Implement data model and API": { es: "Implementar modelo de datos y API", en: "Implement data model and API" },
  "Build user interface and forms": { es: "Construir interfaz y formularios", en: "Build user interface and forms" },
  "Validate main workflows and fix issues": { es: "Validar flujos principales y corregir incidencias", en: "Validate main workflows and fix issues" },
  "Deploy and configure production environment": { es: "Desplegar y configurar producción", en: "Deploy and configure production environment" },
  "External provider": { es: "Proveedor externo", en: "External provider" },
  "Domain registrar": { es: "Registrador de dominios", en: "Domain registrar" },
};

const summaryLabels: LabelMap = {
  "1.588 EUR · delivery + managed infrastructure": { es: "1.588 EUR · entrega + infraestructura gestionada", en: "1.588 EUR · delivery + managed infrastructure" },
  "620 EUR · API + database": { es: "620 EUR · API + base de datos", en: "620 EUR · API + database" },
  "39 EUR/month + 18 EUR/year": { es: "39 EUR/mes + 18 EUR/año", en: "39 EUR/month + 18 EUR/year" },
  "79 EUR/month": { es: "79 EUR/mes", en: "79 EUR/month" },
  "Professional web/app delivery with analysis, backend, frontend, database, testing, deployment, hosting and project management.": {
    es: "Entrega profesional web/app con análisis, backend, frontend, base de datos, pruebas, despliegue, hosting y gestión.",
    en: "Professional web/app delivery with analysis, backend, frontend, database, testing, deployment, hosting and project management.",
  },
  "Backend delivery with REST API, business logic, database model and basic testing.": {
    es: "Entrega backend con API REST, lógica de negocio, modelo de datos y pruebas básicas.",
    en: "Backend delivery with REST API, business logic, database model and basic testing.",
  },
  "Recurring external services managed for the client.": {
    es: "Servicios externos recurrentes gestionados para el cliente.",
    en: "Recurring external services managed for the client.",
  },
  "Monthly maintenance, support and preventive review.": {
    es: "Mantenimiento mensual, soporte y revisión preventiva.",
    en: "Monthly maintenance, support and preventive review.",
  },
};

const paymentTermLabels: LabelMap = {
  "100% por transferencia bancaria al aceptar la proforma.": {
    es: "100% por transferencia bancaria al aceptar la proforma.",
    en: "100% by bank transfer when accepting the proforma.",
  },
  "50% al aceptar la proforma y 50% antes de la entrega.": {
    es: "50% al aceptar la proforma y 50% antes de la entrega.",
    en: "50% when accepting the proforma and 50% before delivery.",
  },
  "30% al iniciar, 40% en revisión intermedia y 30% antes de la entrega.": {
    es: "30% al iniciar, 40% en revisión intermedia y 30% antes de la entrega.",
    en: "30% at project start, 40% at intermediate review and 30% before delivery.",
  },
  "Pago mensual por adelantado para servicios recurrentes.": {
    es: "Pago mensual por adelantado para servicios recurrentes.",
    en: "Monthly payment in advance for recurring services.",
  },
  "Pago a 7 días desde la fecha de factura.": {
    es: "Pago a 7 días desde la fecha de factura.",
    en: "Payment within 7 days from the invoice date.",
  },
  "Pago a 15 días desde la fecha de factura.": {
    es: "Pago a 15 días desde la fecha de factura.",
    en: "Payment within 15 days from the invoice date.",
  },
};

const documentLabels: LabelMap = {
  proforma: { es: "Proforma", en: "Proforma" },
  invoice: { es: "Factura", en: "Invoice" },
  client: { es: "Cliente", en: "Client" },
  project: { es: "Proyecto", en: "Project" },
  issued: { es: "Emitida", en: "Issued" },
  dueDate: { es: "Vencimiento", en: "Due date" },
  paymentMethod: { es: "Forma de pago", en: "Payment method" },
  paymentTerms: { es: "Condiciones", en: "Terms" },
  concepts: { es: "Conceptos", en: "Items" },
  description: { es: "Descripción", en: "Description" },
  amount: { es: "Importe", en: "Amount" },
  total: { es: "Total", en: "Total" },
  subtotal: { es: "Subtotal", en: "Subtotal" },
  discount: { es: "Descuento", en: "Discount" },
  notes: { es: "Notas", en: "Notes" },
  issuerSignature: { es: "Firma del emisor", en: "Issuer signature" },
  clientSignature: { es: "Firma del cliente", en: "Client signature" },
  missingTaxId: { es: "NIF/CIF no indicado", en: "Tax ID not provided" },
  missingAddress: { es: "Dirección no indicada", en: "Address not provided" },
  missingEmail: { es: "Email no indicado", en: "Email not provided" },
  proformaFallbackTerms: { es: "Según aceptación de la proforma", en: "According to proforma acceptance" },
  invoiceFallbackTerms: { es: "Pago según condiciones acordadas", en: "Payment according to agreed terms" },
  proformaLegal1: {
    es: "Esta proforma tiene carácter informativo y no supone factura hasta su aceptación y emisión del documento fiscal correspondiente. Los precios indicados son válidos durante 15 días naturales salvo acuerdo escrito.",
    en: "This proforma is informational and does not constitute an invoice until it is accepted and the corresponding tax document is issued. Prices are valid for 15 calendar days unless otherwise agreed in writing.",
  },
  proformaLegal2: {
    es: "Los servicios recurrentes, dominios, hosting, licencias o proveedores externos quedan sujetos a disponibilidad, condiciones y renovaciones del proveedor. Los datos personales serán tratados únicamente para la gestión del servicio solicitado.",
    en: "Recurring services, domains, hosting, licenses or external providers are subject to provider availability, terms and renewals. Personal data will be processed only to manage the requested service.",
  },
  invoiceLegal1: {
    es: "Esta factura se emite por los servicios descritos en el presente documento. El pago deberá realizarse en el plazo acordado y cualquier devolución, rectificación o incidencia deberá solicitarse por escrito para su revisión administrativa.",
    en: "This invoice is issued for the services described in this document. Payment must be made within the agreed term and any refund, correction or incident must be requested in writing for administrative review.",
  },
  invoiceLegal2: {
    es: "Los datos personales serán tratados únicamente para la gestión fiscal, contable y contractual del servicio prestado, conforme a la normativa vigente de protección de datos.",
    en: "Personal data will be processed only for tax, accounting and contractual management of the provided service, in accordance with applicable data protection regulations.",
  },
  lineSingular: { es: "línea", en: "line" },
  linePlural: { es: "líneas", en: "lines" },
  back: { es: "Volver", en: "Back" },
  edit: { es: "Editar", en: "Edit" },
  sendByEmail: { es: "Enviar por email", en: "Send by email" },
  optionalMessage: { es: "Mensaje opcional", en: "Optional message" },
  createInvoice: { es: "Crear factura", en: "Create invoice" },
  invoicePrefix: { es: "Factura", en: "Invoice" },
  proformaPrefix: { es: "Proforma", en: "Proforma" },
};

function pick(locale: Locale, labels: LabelMap, value: string) {
  return labels[value]?.[locale] ?? value;
}

export function formatSwapDocsCurrency(locale: Locale, value: number) {
  return value.toLocaleString(locale === "es" ? "es-ES" : "en-US", { style: "currency", currency: "EUR" });
}

export function formatSwapDocsDate(locale: Locale, value: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", options ?? {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function swapDocsStatusLabel(locale: Locale, value: string) {
  return pick(locale, statusLabels, value);
}

export function swapDocsLineTypeLabel(locale: Locale, value: string) {
  return pick(locale, lineTypeLabels, value);
}

export function swapDocsUnitLabel(locale: Locale, value: string) {
  return pick(locale, unitLabels, value);
}

export function swapDocsPaymentMethodLabel(locale: Locale, value?: string | null) {
  return pick(locale, paymentMethodLabels, value || "bank_transfer");
}

export function swapDocsCategoryLabel(locale: Locale, value: string) {
  return pick(locale, categoryLabels, value);
}

export function swapDocsProfessionalLabel(locale: Locale, value: string) {
  return pick(locale, professionalLabels, value);
}

export function swapDocsSummaryLabel(locale: Locale, value: string) {
  return pick(locale, summaryLabels, value);
}

export function swapDocsPaymentTermsLabel(locale: Locale, value: string) {
  return pick(locale, paymentTermLabels, value);
}

export function swapDocsDocumentLabel(locale: Locale, value: string) {
  return pick(locale, documentLabels, value);
}

export function isInternalTemplateNote(value?: string | null) {
  return Boolean(value?.startsWith("Plantilla origen:") || value?.startsWith("Template origin:"));
}

export function publicDocumentDescription(locale: Locale, value: string) {
  const cleaned = value.replace(/^\[[^\]]+\]\s*/, "").trim();
  return swapDocsProfessionalLabel(locale, cleaned);
}
