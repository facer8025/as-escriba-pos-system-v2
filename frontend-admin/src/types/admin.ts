// ============================================================================
// Tipos para el Panel Administrativo de ESCRIBA
// ============================================================================

// --- Roles ---
export type AdminRoleCode = 'SA' | 'AC' | 'AF' | 'ST' | 'AU'

export interface AdminRole {
  id: number
  code: AdminRoleCode
  name: string
  description: string
}

// --- Usuarios Admin ---
export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: AdminRoleCode
  roleName: string
  phone?: string
  avatarUrl?: string
  position?: string
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE'
  totpEnabled: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  createdBy?: string
}

export interface CreateAdminUserRequest {
  email: string
  firstName: string
  lastName: string
  role: AdminRoleCode
  phone?: string
  position?: string
  password?: string // Si no se envía, se genera automáticamente
  ipWhitelist?: string
}

// --- Tenants (Empresas Clientes) ---
export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export interface Tenant {
  id: string
  nit: string
  dv?: string
  businessName: string
  tradeName?: string
  taxRegime?: string
  ciiuCode?: string
  city?: string
  department?: string
  phone?: string
  email: string
  logoUrl?: string
  status: TenantStatus
  schemaName: string
  timezone: string
  registeredAt: string
  activatedAt?: string
  suspendedAt?: string
  cancelledAt?: string
  suspensionReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTenantRequest {
  // Pestaña 1: Datos de la empresa
  personType: 'LEGAL' | 'NATURAL'
  nit: string
  businessName: string
  tradeName?: string
  taxRegime: string
  ciiuCode?: string
  address?: string
  department: string
  city: string
  phone: string
  email: string
  website?: string
  logo?: File
  // Pestaña 2: Admin principal
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPhone?: string
  adminPassword?: string
  // Pestaña 3: Plan y licencia
  planId: number
  licenseType: 'TRIAL' | 'PAID'
  licenseStartDate: string
  licenseDuration: string // 1M / 3M / 6M / 1Y / CUSTOM
  licenseEndDate?: string
  autoRenew: boolean
  gracePeriodDays: number
  discountPct: number
  discountReason?: string
  notes?: string
  // Pestaña 4: Configuración técnica
  timezone?: string
  initialModules?: string[]
}

export interface TenantDetail extends Tenant {
  currentLicense?: LicenseInfo
  metrics?: TenantMetrics
  plan?: PlanSummary
}

export interface LicenseInfo {
  id: string
  planId: number
  planName: string
  planSlug: string
  licenseType: 'TRIAL' | 'PAID'
  status: string
  startsAt: string
  expiresAt: string
  autoRenew: boolean
  gracePeriodDays: number
  pricePaidMonthly: number
  discountPct: number
  discountReason?: string
}

export interface PlanSummary {
  id: number
  name: string
  slug: string
  priceMonthly: number
  maxUsers?: number
  maxBranches?: number
  maxProducts?: number
}

export interface TenantMetrics {
  monthlySales: number
  monthlyInvoices: number
  totalProducts: number
  activeUsersThisWeek: number
  monthlyPurchaseOrders: number
  storageUsedMB: number
  storageLimitMB: number
}

// --- Planes ---
export interface Plan {
  id: number
  name: string
  slug: string
  descriptionShort?: string
  descriptionLong?: string
  priceMonthly: number
  priceAnnual: number
  annualDiscountPct: number
  currency: string
  trialDays: number
  badgeColor: string
  isFeatured: boolean
  isVisibleWeb: boolean
  status: 'ACTIVE' | 'ARCHIVED'
  maxUsers?: number
  maxBranches?: number
  maxProducts?: number
  maxMonthlyInvoices?: number
  storageGb?: number
  supportLevel?: string
  modules: PlanModuleInfo[]
  createdAt: string
}

export interface PlanModuleInfo {
  code: string
  name: string
  isIncluded: boolean
  limitValue?: number
  category: string
}

export interface CreatePlanRequest {
  name: string
  descriptionShort?: string
  descriptionLong?: string
  priceMonthly: number
  priceAnnual: number
  badgeColor: string
  isFeatured: boolean
  isVisibleWeb: boolean
  trialDays: number
  maxUsers?: number
  maxBranches?: number
  maxProducts?: number
  maxMonthlyInvoices?: number
  storageGb?: number
  supportLevel?: string
  modules: string[] // Códigos de módulos incluidos
}

// --- Licencias ---
export interface License {
  id: string
  tenantId: string
  tenantName: string
  planId: number
  planName: string
  licenseType: 'TRIAL' | 'PAID'
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED'
  startsAt: string
  expiresAt: string
  autoRenew: boolean
  gracePeriodDays: number
  pricePaidMonthly: number
  discountPct: number
  discountReason?: string
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateLicenseRequest {
  tenantId: string
  planId: number
  licenseType: 'TRIAL' | 'PAID'
  startDate: string
  duration: string // 1M / 3M / 6M / 1Y / CUSTOM
  endDate?: string
  autoRenew: boolean
  gracePeriodDays: number
  discountPct: number
  discountReason?: string
  notes?: string
  notifyTenant: boolean
}

// --- Facturas ---
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID'

export interface TenantInvoice {
  id: string
  tenantId: string
  tenantName: string
  invoiceNumber: string
  concept: string
  amountNet: number
  taxPct: number
  taxAmount: number
  total: number
  issuedAt: string
  dueDate: string
  paidAt?: string
  status: InvoiceStatus
  paymentMethod?: string
  paymentReference?: string
  pdfUrl?: string
}

export interface CreateInvoiceRequest {
  tenantId: string
  concept: string
  description?: string
  issueDate: string
  dueDate: string
  amountNet: number
  taxPct: number
  expectedPaymentMethod: string
  notes?: string
  notifyTenant: boolean
}

export interface RegisterPaymentRequest {
  invoiceId: string
  paymentDate: string
  amount: number
  paymentMethod: string
  reference?: string
  notes?: string
}

// --- Tickets de Soporte ---
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'CLOSED'
export type TicketCategory = 'BILLING' | 'DIAN' | 'POS' | 'INVENTORY' | 'TECHNICAL' | 'COMMERCIAL'

export interface SupportTicket {
  id: string
  ticketNumber: string
  tenantId?: string
  tenantName?: string
  subject: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: string
  assignedToName?: string
  slaDeadline?: string
  slaBreached: boolean
  createdByType: 'ADMIN' | 'TENANT'
  createdAt: string
  updatedAt: string
  closedAt?: string
  lastMessage?: string
}

export interface TicketMessage {
  id: string
  ticketId: string
  senderType: 'ADMIN' | 'TENANT'
  senderId: string
  senderName: string
  body: string
  isInternalNote: boolean
  attachments?: { name: string; url: string }[]
  createdAt: string
}

// --- Comunicaciones ---
export type AnnouncementType = 'GENERAL' | 'MAINTENANCE' | 'NEW_FEATURE' | 'ALERT' | 'NEWSLETTER'
export type AnnouncementChannel = 'EMAIL' | 'BANNER' | 'IN_APP' | 'SMS'

export interface TicketStatsResponse {
  openTickets: number
  inProgressTickets: number
  waitingCustomerTickets: number
  closedToday: number
  slaBreached: number
  avgResolutionHours: number
  criticalOpen: number
  highOpen: number
}

export interface Announcement {
  id: string
  title: string
  type: AnnouncementType
  bodyHtml: string
  channels: AnnouncementChannel[]
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED'
  totalRecipients: number
  openRate?: number
  scheduledAt?: string
  sentAt?: string
  createdAt: string
  createdBy?: string
}

// --- Feature Flags ---
export interface FeatureFlag {
  id: string
  code: string
  description?: string
  defaultState: 'ACTIVE_FOR_ALL' | 'SPECIFIC_COMPANIES' | 'INACTIVE'
  rolloutPct: number
  createdAt: string
}

export interface TenantFeatureFlag {
  tenantId: string
  flagCode: string
  isEnabled: boolean
}

export interface CreateFeatureFlagRequest {
  code: string
  description?: string
  defaultState: string
  rolloutPct?: number
}

// --- Módulos ---
export interface Module {
  id: number
  code: string
  name: string
  description?: string
  category: string
  isCore: boolean
}

// --- Dashboard ---
export interface DashboardKPIs {
  activeCompanies: number
  trialCompanies: number
  suspendedCompanies: number
  mrr: number
  arr: number
  newContractsMonth: number
  licensesExpiring30d: number
  openTickets: number
  services: ServiceHealth[]
  recentActivity: RecentActivity[]
}

export interface ServiceHealth {
  serviceName: string
  status: 'UP' | 'DEGRADED' | 'DOWN'
  uptime30d: number
  lastIncident?: string
}

export interface RecentActivity {
  user: string
  action: string
  target: string
  time: string
  module: string
}

// --- Auditoría ---
export interface AuditLogEntry {
  id: number
  timestamp: string
  adminUserId?: string
  adminEmail?: string
  adminRole?: string
  category: string
  action: string
  description?: string
  targetTenantId?: string
  targetTenantName?: string
  module?: string
  entityType?: string
  ipAddress?: string
  result: 'SUCCESS' | 'ERROR' | 'BLOCKED'
}

export interface AuditLogDetail extends AuditLogEntry {
  dataBefore?: unknown
  dataAfter?: unknown
  userAgent?: string
  requestId?: string
}

// --- Seguridad ---
export interface SecurityAlert {
  id: string
  ruleCode: string
  triggeredAt: string
  adminUserId?: string
  adminEmail?: string
  tenantId?: string
  tenantName?: string
  description: string
  status: 'NEW' | 'REVIEWED' | 'FALSE_POSITIVE'
}

// --- Configuración del Sistema ---
export interface SystemConfig {
  maintenanceMode: boolean
  maintenanceMessage: string
  defaultGracePeriodDays: number
  defaultTrialDurationDays: number
  clientPortalUrl: string
  supportEmail: string
  auditLogRetentionDays: number
  workHoursStart: string
  workHoursEnd: string
}

// --- Paginación ---
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
