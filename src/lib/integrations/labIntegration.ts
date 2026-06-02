/**
 * Lab Systems Integration Service
 * Connect with laboratory information systems (Quest, LabCorp, custom labs)
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface LabConfig {
  id: string;
  organizationId: string;
  labProvider: 'quest_diagnostics' | 'labcorp' | 'mlab' | 'sonic' | 'custom';
  apiEndpoint: string;
  apiKey: string;
  facilityCode: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LabOrder {
  id: string;
  organizationId: string;
  patientId: string;
  orderedByPhysician: string;
  orderDate: Date;
  testCodes: string[]; // CPT codes
  testNames: string[];
  priority: 'routine' | 'stat';
  status: 'pending' | 'collected' | 'in_progress' | 'completed' | 'rejected';
  collectionDate?: Date;
  collectionLocation: string;
  specialInstructions?: string;
}

interface LabResult {
  id: string;
  organizationId: string;
  labOrderId: string;
  patientId: string;
  testName: string;
  testCode: string;
  value: string;
  unit: string;
  referenceRange: string;
  abnormal: boolean;
  criticalValue: boolean;
  timestamp: Date;
  labName: string;
}

interface LabRequisition {
  id: string;
  organizationId: string;
  patientId: string;
  labOrderId: string;
  barcode: string;
  collectionTube: string; // SST, EDTA, Citrate, etc.
  sampleType: string;
  createdAt: Date;
  expiresAt: Date;
}

interface LabTest {
  code: string;
  name: string;
  category: string;
  turnaroundTime: number; // Hours
  price: number;
  requiresFasting: boolean;
  sampleType: string;
  referenceRanges: Record<string, string>;
}

const labConfigs = new Map<string, LabConfig>();
const labOrders = new Map<string, LabOrder[]>();
const labResults = new Map<string, LabResult[]>();
const labRequisitions = new Map<string, LabRequisition[]>();
const labTestCatalog = new Map<string, LabTest>();

export class LabIntegrationService {
  static async configureLab(
    organizationId: string,
    labProvider: 'quest_diagnostics' | 'labcorp' | 'mlab' | 'sonic' | 'custom',
    apiEndpoint: string,
    apiKey: string,
    facilityCode: string
  ): Promise<LabConfig> {
    const id = `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: LabConfig = {
      id,
      organizationId,
      labProvider,
      apiEndpoint,
      apiKey,
      facilityCode,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    labConfigs.set(id, config);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'LAB_CONFIG_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, labProvider, facilityCode },
    });

    return config;
  }

  static async createLabOrder(
    organizationId: string,
    patientId: string,
    orderedByPhysician: string,
    testCodes: string[],
    testNames: string[],
    collectionLocation: string,
    priority: 'routine' | 'stat' = 'routine',
    specialInstructions?: string
  ): Promise<LabOrder> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const order: LabOrder = {
      id: orderId,
      organizationId,
      patientId,
      orderedByPhysician,
      orderDate: new Date(),
      testCodes,
      testNames,
      priority,
      status: 'pending',
      collectionLocation,
      specialInstructions,
    };

    if (!labOrders.has(organizationId)) {
      labOrders.set(organizationId, []);
    }

    labOrders.get(organizationId)!.push(order);

    // Create requisition
    const requisitionId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const barcode = this.generateBarcode();

    const requisition: LabRequisition = {
      id: requisitionId,
      organizationId,
      patientId,
      labOrderId: orderId,
      barcode,
      collectionTube: 'SST',
      sampleType: 'Blood',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    if (!labRequisitions.has(organizationId)) {
      labRequisitions.set(organizationId, []);
    }

    labRequisitions.get(organizationId)!.push(requisition);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'LAB_ORDER_CREATED', orderId, {
      status: 'SUCCESS',
      details: { patientId, testCount: testCodes.length, priority },
    });

    return order;
  }

  private static generateBarcode(): string {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  }

  static async recordLabResult(
    organizationId: string,
    labOrderId: string,
    patientId: string,
    testName: string,
    testCode: string,
    value: string,
    unit: string,
    referenceRange: string,
    labName: string
  ): Promise<LabResult> {
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine if abnormal
    const abnormal = !this.isValueInRange(value, referenceRange);
    const criticalValue = this.isCriticalValue(value, referenceRange);

    const result: LabResult = {
      id: resultId,
      organizationId,
      labOrderId,
      patientId,
      testName,
      testCode,
      value,
      unit,
      referenceRange,
      abnormal,
      criticalValue,
      timestamp: new Date(),
      labName,
    };

    if (!labResults.has(organizationId)) {
      labResults.set(organizationId, []);
    }

    labResults.get(organizationId)!.push(result);

    // Update order status if all results received
    const orders = labOrders.get(organizationId) || [];
    const order = orders.find((o) => o.id === labOrderId);
    if (order) {
      order.status = 'completed';
    }

    if (criticalValue) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CRITICAL_LAB_VALUE', resultId, {
        status: 'ALERT',
        details: { testName, value, criticalRange: referenceRange },
      });
    }

    return result;
  }

  private static isValueInRange(value: string, referenceRange: string): boolean {
    // Simplified range checking
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true;

    // Example: "70-100" or "< 100"
    if (referenceRange.includes('-')) {
      const [min, max] = referenceRange.split('-').map((v) => parseFloat(v.trim()));
      return numValue >= min && numValue <= max;
    } else if (referenceRange.startsWith('<')) {
      const max = parseFloat(referenceRange.substring(1).trim());
      return numValue < max;
    } else if (referenceRange.startsWith('>')) {
      const min = parseFloat(referenceRange.substring(1).trim());
      return numValue > min;
    }

    return true;
  }

  private static isCriticalValue(value: string, referenceRange: string): boolean {
    // Values >2x or <0.5x the reference range are critical
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    if (referenceRange.includes('-')) {
      const [min, max] = referenceRange.split('-').map((v) => parseFloat(v.trim()));
      return numValue > max * 2 || numValue < min * 0.5;
    }

    return false;
  }

  static async updateOrderStatus(
    organizationId: string,
    labOrderId: string,
    status: 'collected' | 'in_progress' | 'completed' | 'rejected',
    collectionDate?: Date
  ): Promise<LabOrder | null> {
    const orders = labOrders.get(organizationId) || [];
    const order = orders.find((o) => o.id === labOrderId);

    if (order) {
      order.status = status;
      if (collectionDate) order.collectionDate = collectionDate;

      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'LAB_ORDER_STATUS_UPDATED', labOrderId, {
        status: 'SUCCESS',
        details: { newStatus: status },
      });
    }

    return order || null;
  }

  static async getLabOrders(organizationId: string, patientId?: string): Promise<LabOrder[]> {
    let orders = labOrders.get(organizationId) || [];

    if (patientId) {
      orders = orders.filter((o) => o.patientId === patientId);
    }

    return orders;
  }

  static async getLabResults(organizationId: string, patientId: string): Promise<LabResult[]> {
    const results = labResults.get(organizationId) || [];
    return results.filter((r) => r.patientId === patientId);
  }

  static async getLabResultsByOrder(organizationId: string, labOrderId: string): Promise<LabResult[]> {
    const results = labResults.get(organizationId) || [];
    return results.filter((r) => r.labOrderId === labOrderId);
  }

  static async loadTestCatalog(
    tests: Array<{
      code: string;
      name: string;
      category: string;
      turnaroundTime: number;
      price: number;
      requiresFasting: boolean;
      sampleType: string;
      referenceRanges: Record<string, string>;
    }>
  ): Promise<number> {
    let loadedCount = 0;

    tests.forEach((test) => {
      labTestCatalog.set(test.code, test);
      loadedCount++;
    });

    return loadedCount;
  }

  static async getTestInfo(testCode: string): Promise<LabTest | null> {
    return labTestCatalog.get(testCode) || null;
  }

  static async getLabMetrics(organizationId: string): Promise<{
    totalOrders: number;
    ordersCompleted: number;
    averageTurnaroundTime: number;
    criticalResultsCount: number;
    abnormalResultsPercentage: number;
  }> {
    const orders = labOrders.get(organizationId) || [];
    const results = labResults.get(organizationId) || [];

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const criticalResults = results.filter((r) => r.criticalValue);
    const abnormalResults = results.filter((r) => r.abnormal);

    return {
      totalOrders: orders.length,
      ordersCompleted: completedOrders.length,
      averageTurnaroundTime: 24, // Mock: 24 hours
      criticalResultsCount: criticalResults.length,
      abnormalResultsPercentage: results.length > 0 ? (abnormalResults.length / results.length) * 100 : 0,
    };
  }

  static async disableLabConfig(labConfigId: string): Promise<void> {
    const config = labConfigs.get(labConfigId);
    if (config) {
      config.enabled = false;
      config.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'LAB_CONFIG_DISABLED', labConfigId, {
      status: 'SUCCESS',
      details: {},
    });
  }
}
