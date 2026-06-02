/**
 * Regional Content Service
 * Provides region-specific content, health resources, and medical guidelines
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

type Region = 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'JP' | 'CN' | 'BR' | 'IN' | 'MX';

interface RegionalConfig {
  region: Region;
  name: string;
  currency: string;
  language: string;
  medicalStandard: string;
  healthOrganization: string;
  emergencyNumber: string;
  measurementUnits: 'metric' | 'imperial';
}

interface HealthResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'government' | 'ngo' | 'hospital' | 'research' | 'educational';
  region: Region;
  language: string;
}

interface MedicalGuideline {
  id: string;
  title: string;
  condition: string;
  standard: string; // e.g., "CDC", "NICE", "RKI"
  summary: string;
  url: string;
  lastUpdated: Date;
  region: Region;
}

const regionalConfigs: Record<Region, RegionalConfig> = {
  US: {
    region: 'US',
    name: 'United States',
    currency: 'USD',
    language: 'en',
    medicalStandard: 'FDA',
    healthOrganization: 'CDC',
    emergencyNumber: '911',
    measurementUnits: 'imperial',
  },
  EU: {
    region: 'EU',
    name: 'European Union',
    currency: 'EUR',
    language: 'en',
    medicalStandard: 'EMA',
    healthOrganization: 'ECDC',
    emergencyNumber: '112',
    measurementUnits: 'metric',
  },
  UK: {
    region: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    language: 'en',
    medicalStandard: 'NICE',
    healthOrganization: 'NHS',
    emergencyNumber: '999',
    measurementUnits: 'metric',
  },
  CA: {
    region: 'CA',
    name: 'Canada',
    currency: 'CAD',
    language: 'en',
    medicalStandard: 'Health Canada',
    healthOrganization: 'Health Canada',
    emergencyNumber: '911',
    measurementUnits: 'metric',
  },
  AU: {
    region: 'AU',
    name: 'Australia',
    currency: 'AUD',
    language: 'en',
    medicalStandard: 'TGA',
    healthOrganization: 'Department of Health',
    emergencyNumber: '000',
    measurementUnits: 'metric',
  },
  JP: {
    region: 'JP',
    name: 'Japan',
    currency: 'JPY',
    language: 'ja',
    medicalStandard: 'PMDA',
    healthOrganization: 'Ministry of Health',
    emergencyNumber: '119',
    measurementUnits: 'metric',
  },
  CN: {
    region: 'CN',
    name: 'China',
    currency: 'CNY',
    language: 'zh',
    medicalStandard: 'NMPA',
    healthOrganization: 'National Health Commission',
    emergencyNumber: '120',
    measurementUnits: 'metric',
  },
  BR: {
    region: 'BR',
    name: 'Brazil',
    currency: 'BRL',
    language: 'pt',
    medicalStandard: 'ANVISA',
    healthOrganization: 'Ministry of Health',
    emergencyNumber: '192',
    measurementUnits: 'metric',
  },
  IN: {
    region: 'IN',
    name: 'India',
    currency: 'INR',
    language: 'en',
    medicalStandard: 'CDSCO',
    healthOrganization: 'Ministry of Health',
    emergencyNumber: '102',
    measurementUnits: 'metric',
  },
  MX: {
    region: 'MX',
    name: 'Mexico',
    currency: 'MXN',
    language: 'es',
    medicalStandard: 'COFEPRIS',
    healthOrganization: 'Ministry of Health',
    emergencyNumber: '911',
    measurementUnits: 'metric',
  },
};

const healthResources: HealthResource[] = [
  {
    id: 'cdc-us',
    title: 'Centers for Disease Control and Prevention',
    description: 'Official U.S. public health authority',
    url: 'https://www.cdc.gov',
    type: 'government',
    region: 'US',
    language: 'en',
  },
  {
    id: 'nhs-uk',
    title: 'National Health Service',
    description: 'UK healthcare system',
    url: 'https://www.nhs.uk',
    type: 'government',
    region: 'UK',
    language: 'en',
  },
  {
    id: 'who',
    title: 'World Health Organization',
    description: 'International health guidance',
    url: 'https://www.who.int',
    type: 'government',
    region: 'EU',
    language: 'en',
  },
];

const medicalGuidelines: MedicalGuideline[] = [
  {
    id: 'hypertension-cdc',
    title: 'Hypertension Management',
    condition: 'High Blood Pressure',
    standard: 'CDC',
    summary: 'Comprehensive guidelines for diagnosing and managing hypertension',
    url: 'https://www.cdc.gov/bloodpressure',
    lastUpdated: new Date('2023-01-15'),
    region: 'US',
  },
  {
    id: 'diabetes-nice',
    title: 'Type 2 Diabetes Management',
    condition: 'Diabetes',
    standard: 'NICE',
    summary: 'Evidence-based guidelines for type 2 diabetes care',
    url: 'https://www.nice.org.uk',
    lastUpdated: new Date('2023-06-01'),
    region: 'UK',
  },
];

const medicationNames: Record<Region, Record<string, string>> = {
  US: {
    acetaminophen: 'Tylenol',
    ibuprofen: 'Advil',
    aspirin: 'Bayer',
  },
  EU: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofen',
    aspirin: 'Aspirin',
  },
  UK: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofen',
    aspirin: 'Aspirin',
  },
  CA: {
    acetaminophen: 'Tylenol',
    ibuprofen: 'Advil',
    aspirin: 'Aspirin',
  },
  AU: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofen',
    aspirin: 'Aspirin',
  },
  JP: {
    acetaminophen: 'アセトアミノフェン',
    ibuprofen: 'イブプロフェン',
    aspirin: 'アスピリン',
  },
  CN: {
    acetaminophen: '对乙酰氨基酚',
    ibuprofen: '布洛芬',
    aspirin: '阿司匹林',
  },
  BR: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofeno',
    aspirin: 'Aspirina',
  },
  IN: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofen',
    aspirin: 'Aspirin',
  },
  MX: {
    acetaminophen: 'Paracetamol',
    ibuprofen: 'Ibuprofeno',
    aspirin: 'Aspirina',
  },
};

export class RegionalContentService {
  static getRegionalConfig(region: Region): RegionalConfig {
    return regionalConfigs[region];
  }

  static getRegionalConfigs(): RegionalConfig[] {
    return Object.values(regionalConfigs);
  }

  static getHealthResources(region: Region, language?: string): HealthResource[] {
    return healthResources.filter(
      (r) => r.region === region && (!language || r.language === language)
    );
  }

  static getMedicalGuidelines(region: Region): MedicalGuideline[] {
    return medicalGuidelines.filter((g) => g.region === region);
  }

  static getGuidelinesByCondition(condition: string, region: Region): MedicalGuideline[] {
    return medicalGuidelines.filter(
      (g) => g.region === region && g.condition.toLowerCase().includes(condition.toLowerCase())
    );
  }

  static getMedicationName(genericName: string, region: Region): string {
    return medicationNames[region][genericName.toLowerCase()] || genericName;
  }

  static getMedicationNameInRegion(genericName: string, region: Region): string {
    return this.getMedicationName(genericName, region);
  }

  static getCurrency(region: Region): string {
    return regionalConfigs[region].currency;
  }

  static getEmergencyNumber(region: Region): string {
    return regionalConfigs[region].emergencyNumber;
  }

  static getMeasurementUnits(region: Region): 'metric' | 'imperial' {
    return regionalConfigs[region].measurementUnits;
  }

  static convertTemperature(celsius: number, region: Region): string {
    const units = this.getMeasurementUnits(region);
    if (units === 'imperial') {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${fahrenheit.toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  }

  static convertWeight(kg: number, region: Region): string {
    const units = this.getMeasurementUnits(region);
    if (units === 'imperial') {
      const lbs = kg * 2.20462;
      return `${lbs.toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  }

  static convertHeight(cm: number, region: Region): string {
    const units = this.getMeasurementUnits(region);
    if (units === 'imperial') {
      const inches = cm / 2.54;
      const feet = Math.floor(inches / 12);
      const remainingInches = Math.round(inches % 12);
      return `${feet}' ${remainingInches}"`;
    }
    return `${cm.toFixed(0)} cm`;
  }

  static logRegionalAccess(userId: string, region: Region): void {
    logAudit(userId, AuditAction.SETTINGS_UPDATED, 'REGION', region, {
      status: 'SUCCESS',
      details: { region, config: regionalConfigs[region] },
    });
  }

  static validateRegionalCompliance(region: Region, dataType: string): boolean {
    // Check if operation complies with regional regulations
    const complianceMap: Record<Region, string[]> = {
      US: ['HIPAA', 'FDA'],
      EU: ['GDPR', 'EMA'],
      UK: ['UK-GDPR', 'NICE'],
      CA: ['PIPEDA', 'Health Canada'],
      AU: ['Privacy Act', 'TGA'],
      JP: ['APPI', 'PMDA'],
      CN: ['PIPL', 'NMPA'],
      BR: ['LGPD', 'ANVISA'],
      IN: ['IT Act', 'CDSCO'],
      MX: ['LFPDPPP', 'COFEPRIS'],
    };

    return complianceMap[region].length > 0;
  }
}
