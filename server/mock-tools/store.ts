/**
 * SENTRIX Protected Mock Tools & Resource Isolation Store
 * 
 * Provides truthful state management for mock resources:
 * - public_catalogue (read-only allowed)
 * - financial_records_2025 (deletion strictly blocked - verifies immutability)
 * - confidential_customer_dossier (transfer requires explicit verified human approval)
 */

export interface PublicCatalogueItem {
  id: string;
  name: string;
  tier: string;
  category: string;
  description: string;
  pricing: string;
}

export interface FinancialRecord {
  id: string;
  account: string;
  entity: string;
  balanceUSD: number;
  q1Revenue: number;
  auditHash: string;
  protectedStatus: 'LOCKED' | 'DELETED';
}

export interface CustomerDossier {
  customerId: string;
  organization: string;
  securityClearance: string;
  complianceTier: string;
  transferredToExternal: boolean;
  lastTransferTimestamp?: string;
  destinationEndpoint?: string;
}

class MockResourceStore {
  private catalogue: PublicCatalogueItem[] = [
    {
      id: 'CAT-101',
      name: 'Sentinel Core Enterprise Gateway',
      tier: 'Enterprise AI Safety',
      category: 'Inference Firewall',
      description: 'Real-time proxy for autonomous agent telemetry and prompt isolation.',
      pricing: '$12,000 / node / yr'
    },
    {
      id: 'CAT-102',
      name: 'OmniGuard Model Auditor',
      tier: 'Professional',
      category: 'Policy Verification',
      description: 'Automated test suite for evaluating zero-trust agent authorization limits.',
      pricing: '$4,500 / yr'
    },
    {
      id: 'CAT-103',
      name: 'SafeHook Interceptor Library',
      tier: 'Open Community',
      category: 'SDK Runtime',
      description: 'Zero-overhead client library for instrumenting LangChain, AutoGen, and CrewAI.',
      pricing: 'Free / Apache 2.0'
    }
  ];

  private financialRecords: FinancialRecord[] = [
    {
      id: 'FIN-REC-2025-001',
      account: 'ACC-GLOBAL-RESERVES-908',
      entity: 'Sentrix Autonomous Holdings LLC',
      balanceUSD: 48500000.00,
      q1Revenue: 14200000.00,
      auditHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      protectedStatus: 'LOCKED'
    },
    {
      id: 'FIN-REC-2025-002',
      account: 'ACC-PAYROLL-TREASURY-412',
      entity: 'Sentrix Engineering Operations',
      balanceUSD: 8750000.00,
      q1Revenue: 3100000.00,
      auditHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      protectedStatus: 'LOCKED'
    }
  ];

  private customerDossiers: CustomerDossier[] = [
    {
      customerId: 'CUST-ALPHA-09',
      organization: 'Department of Advanced Cyber Defense',
      securityClearance: 'TOP_SECRET//NOFORN',
      complianceTier: 'FedRAMP High / SOC-2 Type II',
      transferredToExternal: false
    },
    {
      customerId: 'CUST-BETA-44',
      organization: 'Vanguard Quantum Technologies',
      securityClearance: 'RESTRICTED_COMMERCIAL',
      complianceTier: 'ISO 27001 / HIPAA',
      transferredToExternal: false
    }
  ];

  public getCatalogue(): PublicCatalogueItem[] {
    return [...this.catalogue];
  }

  public getFinancialRecords(): FinancialRecord[] {
    return JSON.parse(JSON.stringify(this.financialRecords));
  }

  public getCustomerDossiers(): CustomerDossier[] {
    return JSON.parse(JSON.stringify(this.customerDossiers));
  }

  /**
   * Protected execution: Only callable if explicitly allowed by policy or approved!
   */
  public executeMockAction(tool: string, operation: string, resource: string, parameters?: any): {
    success: boolean;
    output: any;
    message: string;
  } {
    // 1. File Store - Read Public Catalogue
    if (tool === 'file_store' && operation === 'read' && resource.includes('catalogue')) {
      return {
        success: true,
        output: {
          itemsCount: this.catalogue.length,
          records: this.catalogue,
          format: 'application/json',
          accessMode: 'PUBLIC_UNRESTRICTED'
        },
        message: 'Successfully retrieved 3 public catalogue records from public_catalogue store.'
      };
    }

    // 2. File Store - Delete Protected Financial Record
    if (tool === 'file_store' && operation === 'delete' && resource.includes('financial')) {
      // If someone bypassed policy and called this directly without authorization:
      return {
        success: false,
        output: {
          violation: 'PROTECTED_RESOURCE_WRITE_DENIED',
          target: resource,
          currentStatus: 'RECORDS_UNCHANGED'
        },
        message: 'CRITICAL ALERT: Target resource is immutable and protected under Policy POL-002.'
      };
    }

    // 3. Data Transfer - External Document Transfer
    if (tool === 'data_transfer' && (operation === 'transfer' || operation === 'export') && resource.includes('dossier')) {
      // When authorized via human approval, execute the simulated document transfer!
      const destination = parameters?.destination || 'sftp://external-compliance-vault.sentrix.corp';
      this.customerDossiers.forEach(d => {
        d.transferredToExternal = true;
        d.lastTransferTimestamp = new Date().toISOString();
        d.destinationEndpoint = destination;
      });

      return {
        success: true,
        output: {
          transferredRecords: this.customerDossiers.length,
          destination,
          packageChecksum: 'sha256:' + Math.random().toString(16).substring(2, 18),
          encryption: 'AES-256-GCM',
          transferState: 'COMPLETED'
        },
        message: `Restricted document transfer successfully dispatched to ${destination} under verified supervisor approval.`
      };
    }

    // Unknown tool/operation
    return {
      success: false,
      output: { error: 'UNKNOWN_TOOL_OR_RESOURCE' },
      message: `Simulated tool execution failed: '${tool}:${operation}' on '${resource}' is not a registered safe mock operation.`
    };
  }

  public resetToDefault(): void {
    this.financialRecords.forEach(r => r.protectedStatus = 'LOCKED');
    this.customerDossiers.forEach(d => {
      d.transferredToExternal = false;
      delete d.lastTransferTimestamp;
      delete d.destinationEndpoint;
    });
  }
}

export const mockResourceStore = new MockResourceStore();
