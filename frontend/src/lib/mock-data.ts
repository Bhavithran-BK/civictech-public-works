import { Project } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-101',
    referenceCode: 'GCC-WD172-RD-04',
    title: 'Anna Salai Smart Arterial Paving & Storm Drain Rebuild',
    purpose: 'Re-laying bituminous asphalt wearing course and widening stormwater culverts ahead of the northeast monsoon.',
    type: 'road',
    departmentId: 'dept-roads',
    departmentName: 'Greater Chennai Corporation (GCC)',
    departmentBadgeColor: '#0284c7',
    contractor: 'L&T Infrastructure Engineering Ltd',
    budgetInr: 18500000,
    startDate: '2026-08-15',
    plannedEndDate: '2026-10-30',
    status: 'delayed',
    healthScore: 54,
    wardNumber: 172,
    wardName: 'Teynampet Central',
    roadName: 'Anna Salai Arterial Corrdior',
    coordinates: { lat: 13.0428, lng: 80.2526 },
    corridorPath: [
      [13.0480, 80.2560],
      [13.0450, 80.2540],
      [13.0428, 80.2526],
      [13.0390, 80.2500]
    ],
    lastOfficialUpdateDaysAgo: 9,
    unresolvedReportsCount: 4,
    delays: [
      {
        id: 'del-1',
        projectId: 'prj-101',
        reason: 'Underground fiber optical cables from non-empaneled telcos damaged during excavator milling.',
        previousEndDate: '2026-09-30',
        newEndDate: '2026-10-30',
        loggedAt: '2026-09-28',
        officerName: 'S. Ramanathan (Executive Engineer, GCC)'
      }
    ],
    updates: [
      {
        id: 'upd-1',
        projectId: 'prj-101',
        author: 'S. Ramanathan',
        authorRole: 'Executive Engineer, Ward 172',
        note: 'Sub-base aggregate compaction finished for 600m segment. Awaiting utility clearance from CMWSSB.',
        createdAt: '2026-10-01'
      }
    ],
    citizenReports: [
      {
        id: 'rep-1',
        projectId: 'prj-101',
        kind: 'no_activity',
        description: 'Road has been dug up for 8 days with zero machinery or crew present. Causing severe morning bottle-neck.',
        reportedLat: 13.0430,
        reportedLng: 80.2528,
        distanceMeters: 28,
        verified: true,
        createdAt: '2026-10-08',
        reporterHandle: 'Citizen #4092'
      },
      {
        id: 'rep-2',
        projectId: 'prj-101',
        kind: 'safety_hazard',
        description: 'Uncovered 5ft ditch without reflector barricades near Anna Flyover junction. Two two-wheelers nearly fell.',
        reportedLat: 13.0435,
        reportedLng: 80.2530,
        distanceMeters: 45,
        verified: true,
        createdAt: '2026-10-07',
        reporterHandle: 'Resident #118'
      }
    ],
    conflicts: [
      {
        conflictingProjectId: 'prj-104',
        conflictingProjectTitle: 'CMWSSB Drinking Water Main Transmission Line',
        departmentName: 'CMWSSB (Metro Water)',
        overlapDistanceMeters: 12,
        conflictType: 'spatial_temporal',
        suggestedAction: 'Coordinate Joint Trenching: Hold road resurfacing until water pipeline is placed to avoid repaving twice.',
        estimatedAvoidableCostInr: 3400000
      }
    ]
  },
  {
    id: 'prj-102',
    referenceCode: 'CMWSSB-PL-2026-89',
    title: 'Adyar Riverbank Feeder Sewage Pipeline Replacement',
    purpose: 'Replacing deteriorated ductile iron sewer line to curb domestic backflows during cloudburst surges.',
    type: 'water_pipeline',
    departmentId: 'dept-water',
    departmentName: 'CMWSSB (Metro Water)',
    departmentBadgeColor: '#0d9488',
    contractor: 'Southern Waterworks Consortia',
    budgetInr: 9200000,
    startDate: '2026-09-01',
    plannedEndDate: '2026-11-20',
    status: 'on_track',
    healthScore: 88,
    wardNumber: 173,
    wardName: 'Adyar North',
    roadName: 'Gandhi Mandapam Road',
    coordinates: { lat: 13.0125, lng: 80.2435 },
    corridorPath: [
      [13.0150, 80.2410],
      [13.0135, 80.2425],
      [13.0125, 80.2435],
      [13.0100, 80.2450]
    ],
    lastOfficialUpdateDaysAgo: 2,
    unresolvedReportsCount: 0,
    delays: [],
    updates: [
      {
        id: 'upd-2',
        projectId: 'prj-102',
        author: 'Dr. V. Karthik',
        authorRole: 'Superintending Engineer, CMWSSB',
        note: 'Trenching along eastern footpath completed. 350mm DI pipes delivered to site.',
        createdAt: '2026-10-07'
      }
    ],
    citizenReports: [
      {
        id: 'rep-3',
        projectId: 'prj-102',
        kind: 'progress_verified',
        description: 'Barricading in place and crew actively lowering pipe segments.',
        reportedLat: 13.0126,
        reportedLng: 80.2436,
        distanceMeters: 15,
        verified: true,
        createdAt: '2026-10-08',
        reporterHandle: 'AdyarWalkers Club'
      }
    ]
  },
  {
    id: 'prj-103',
    referenceCode: 'TANGEDCO-CAB-441',
    title: 'Underground 33kV HT Cable Conversion Project',
    purpose: 'Eliminating hazardous overhead wires by laying shielded 33kV high tension cables beneath public footway.',
    type: 'electricity',
    departmentId: 'dept-power',
    departmentName: 'TANGEDCO (Electricity Board)',
    departmentBadgeColor: '#d97706',
    contractor: 'PowerGrid Solutions Pvt Ltd',
    budgetInr: 12400000,
    startDate: '2026-07-10',
    plannedEndDate: '2026-09-15',
    status: 'stalled',
    healthScore: 28,
    wardNumber: 155,
    wardName: 'Mylapore Heritage',
    roadName: 'Luz Church Road',
    coordinates: { lat: 13.0368, lng: 80.2612 },
    corridorPath: [
      [13.0390, 80.2590],
      [13.0380, 80.2600],
      [13.0368, 80.2612],
      [13.0345, 80.2630]
    ],
    lastOfficialUpdateDaysAgo: 21,
    unresolvedReportsCount: 7,
    delays: [
      {
        id: 'del-2',
        projectId: 'prj-103',
        reason: 'Contractor dispute over trench restoration unit rates.',
        previousEndDate: '2026-08-30',
        newEndDate: '2026-09-15',
        loggedAt: '2026-08-25',
        officerName: 'M. Anbazhagan (Divisional Engineer)'
      }
    ],
    updates: [],
    citizenReports: [
      {
        id: 'rep-4',
        projectId: 'prj-103',
        kind: 'no_activity',
        description: 'Trench left abandoned for past 3 weeks. Mud has washed into shops during last night rain.',
        reportedLat: 13.0370,
        reportedLng: 80.2615,
        distanceMeters: 30,
        verified: true,
        createdAt: '2026-10-06',
        reporterHandle: 'Mylapore Merchant Union'
      },
      {
        id: 'rep-5',
        projectId: 'prj-103',
        kind: 'safety_hazard',
        description: 'Exposed live junction cables left sticking out near school gate.',
        reportedLat: 13.0367,
        reportedLng: 80.2611,
        distanceMeters: 10,
        verified: true,
        createdAt: '2026-10-09',
        reporterHandle: 'Parent Council'
      }
    ]
  },
  {
    id: 'prj-104',
    referenceCode: 'CMWSSB-WT-172-11',
    title: 'CMWSSB Drinking Water Main Transmission Line',
    purpose: 'Laying 600mm MS pipeline connection from Chembarambakkam plant to Teynampet reservoir.',
    type: 'water_pipeline',
    departmentId: 'dept-water',
    departmentName: 'CMWSSB (Metro Water)',
    departmentBadgeColor: '#0d9488',
    contractor: 'Apex Pipeworks Infra',
    budgetInr: 14200000,
    startDate: '2026-11-05',
    plannedEndDate: '2026-12-25',
    status: 'planned',
    healthScore: 95,
    wardNumber: 172,
    wardName: 'Teynampet Central',
    roadName: 'Anna Salai Arterial Corridor',
    coordinates: { lat: 13.0435, lng: 80.2530 },
    corridorPath: [
      [13.0470, 80.2555],
      [13.0440, 80.2535],
      [13.0435, 80.2530],
      [13.0400, 80.2505]
    ],
    lastOfficialUpdateDaysAgo: 1,
    unresolvedReportsCount: 0,
    delays: [],
    updates: [],
    citizenReports: [],
    conflicts: [
      {
        conflictingProjectId: 'prj-101',
        conflictingProjectTitle: 'Anna Salai Smart Arterial Paving & Storm Drain Rebuild',
        departmentName: 'Greater Chennai Corporation (GCC)',
        overlapDistanceMeters: 15,
        conflictType: 'spatial_temporal',
        suggestedAction: 'Schedule joint trenching with GCC before road resurfacing completes.',
        estimatedAvoidableCostInr: 3400000
      }
    ]
  },
  {
    id: 'prj-105',
    referenceCode: 'CMRL-PH2-MET-09',
    title: 'Chennai Metro Rail Phase 2 - Corridor 4 Trench Utility Shifting',
    purpose: 'Diversion of 110kV utilities and storm lines prior to elevated viaduct pillar construction.',
    type: 'metro',
    departmentId: 'dept-metro',
    departmentName: 'Chennai Metro Rail Ltd (CMRL)',
    departmentBadgeColor: '#7c3aed',
    contractor: 'Tata Projects - CMRL JV',
    budgetInr: 45000000,
    startDate: '2026-06-01',
    plannedEndDate: '2027-01-31',
    status: 'on_track',
    healthScore: 92,
    wardNumber: 171,
    wardName: 'Alwarpet South',
    roadName: 'TTK Road & Chamiers Road Junction',
    coordinates: { lat: 13.0335, lng: 80.2490 },
    corridorPath: [
      [13.0360, 80.2510],
      [13.0345, 80.2498],
      [13.0335, 80.2490],
      [13.0310, 80.2475]
    ],
    lastOfficialUpdateDaysAgo: 3,
    unresolvedReportsCount: 1,
    delays: [],
    updates: [
      {
        id: 'upd-3',
        projectId: 'prj-105',
        author: 'P. Balakrishnan',
        authorRole: 'Chief Project Manager, CMRL',
        note: 'Utility diversion on eastern carriageway 85% finished. Traffic advisory issued.',
        createdAt: '2026-10-06'
      }
    ],
    citizenReports: [
      {
        id: 'rep-6',
        projectId: 'prj-105',
        kind: 'progress_verified',
        description: 'Proper sound barriers and marshals managing vehicle bypass.',
        reportedLat: 13.0338,
        reportedLng: 80.2492,
        distanceMeters: 35,
        verified: true,
        createdAt: '2026-10-08',
        reporterHandle: 'Alwarpet Resident Group'
      }
    ]
  },
  {
    id: 'prj-106',
    referenceCode: 'GCC-DRN-2026-302',
    title: 'Velachery Micro-Canal Storm Drain Deepening',
    purpose: 'Deepening precast RCC stormwater box drains to mitigate monsoon waterlogging in low-lying residential sectors.',
    type: 'drainage',
    departmentId: 'dept-roads',
    departmentName: 'Greater Chennai Corporation (GCC)',
    departmentBadgeColor: '#0284c7',
    contractor: 'Coromandel Civil Constructions',
    budgetInr: 7800000,
    startDate: '2026-08-01',
    plannedEndDate: '2026-10-15',
    status: 'at_risk',
    healthScore: 61,
    wardNumber: 178,
    wardName: 'Velachery West',
    roadName: 'Velachery Main Road',
    coordinates: { lat: 12.9815, lng: 80.2180 },
    corridorPath: [
      [12.9840, 80.2160],
      [12.9825, 80.2170],
      [12.9815, 80.2180],
      [12.9790, 80.2200]
    ],
    lastOfficialUpdateDaysAgo: 6,
    unresolvedReportsCount: 2,
    delays: [],
    updates: [],
    citizenReports: [
      {
        id: 'rep-7',
        projectId: 'prj-106',
        kind: 'poor_quality',
        description: 'Precast slabs placed unevenly with gaps allowing debris ingress.',
        reportedLat: 12.9818,
        reportedLng: 80.2182,
        distanceMeters: 25,
        verified: true,
        createdAt: '2026-10-07',
        reporterHandle: 'Velachery Welfare'
      }
    ]
  }
];
