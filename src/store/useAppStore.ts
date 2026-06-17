import { create } from 'zustand';
import {
  InstrumentPackage,
  CleaningRecord,
  SterilizationBatch,
  ExceptionRecord,
  UsageRecord,
  BorrowRecord,
  PackageStatus,
  CleaningSteps,
  CleaningParams,
  ExceptionType,
  TraceEvent,
} from '@/types';
import {
  mockPackages,
  mockCleaningRecords,
  mockSterilizationBatches,
  mockExceptions,
  mockUsageRecords,
  mockBorrowRecords,
} from '@/mock/data';
import { generateId, addDays, formatDateTime } from '@/utils/date';

interface AppState {
  packages: InstrumentPackage[];
  cleaningRecords: CleaningRecord[];
  sterilizationBatches: SterilizationBatch[];
  exceptions: ExceptionRecord[];
  usageRecords: UsageRecord[];
  borrowRecords: BorrowRecord[];
  currentUser: string;

  addPackage: (pkg: Omit<InstrumentPackage, 'id' | 'createTime' | 'status'>) => void;
  updatePackage: (id: string, updates: Partial<InstrumentPackage>) => void;
  updatePackageStatus: (id: string, status: PackageStatus) => void;

  addCleaningRecord: (record: Omit<CleaningRecord, 'id' | 'createdAt'>) => void;
  updateCleaningRecord: (id: string, updates: Partial<CleaningRecord>) => void;
  updateCleaningSteps: (id: string, steps: Partial<CleaningSteps>) => void;
  updateCleaningParams: (id: string, params: Partial<CleaningParams>) => void;
  completeQualityCheck: (id: string, passed: boolean, inspector: string, remark?: string) => void;

  addSterilizationBatch: (batch: Omit<SterilizationBatch, 'id' | 'startTime' | 'status'>) => void;
  completeSterilization: (batchId: string, biologicalTest: 'passed' | 'failed') => void;
  releaseBatch: (batchId: string, releaser1: string, releaser2: string) => void;

  addException: (exception: Omit<ExceptionRecord, 'id' | 'reportTime' | 'status'>) => void;
  updateException: (id: string, updates: Partial<ExceptionRecord>) => void;
  closeException: (id: string, handler: string, result: string) => void;

  addUsageRecord: (record: Omit<UsageRecord, 'id' | 'usedAt'>) => void;

  addBorrowRecord: (record: Omit<BorrowRecord, 'id' | 'borrowTime' | 'status'>) => void;
  returnBorrow: (id: string) => void;

  getPackageById: (id: string) => InstrumentPackage | undefined;
  getPackageByBarcode: (barcode: string) => InstrumentPackage | undefined;
  getTraceEvents: (packageId: string) => TraceEvent[];
  getSterileInventory: () => InstrumentPackage[];
  getNearExpiryPackages: () => InstrumentPackage[];
  getExpiredPackages: () => InstrumentPackage[];
}

export const useAppStore = create<AppState>((set, get) => ({
  packages: mockPackages,
  cleaningRecords: mockCleaningRecords,
  sterilizationBatches: mockSterilizationBatches,
  exceptions: mockExceptions,
  usageRecords: mockUsageRecords,
  borrowRecords: mockBorrowRecords,
  currentUser: '张护士',

  addPackage: (pkg) =>
    set((state) => ({
      packages: [
        ...state.packages,
        {
          ...pkg,
          id: generateId(),
          createTime: new Date().toISOString(),
          status: 'sterilized' as PackageStatus,
        },
      ],
    })),

  updatePackage: (id, updates) =>
    set((state) => ({
      packages: state.packages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  updatePackageStatus: (id, status) =>
    set((state) => ({
      packages: state.packages.map((p) => (p.id === id ? { ...p, status } : p)),
    })),

  addCleaningRecord: (record) =>
    set((state) => ({
      cleaningRecords: [
        ...state.cleaningRecords,
        { ...record, id: generateId(), createdAt: new Date().toISOString() },
      ],
    })),

  updateCleaningRecord: (id, updates) =>
    set((state) => ({
      cleaningRecords: state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  updateCleaningSteps: (id, steps) =>
    set((state) => ({
      cleaningRecords: state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, steps: { ...r.steps, ...steps } } : r
      ),
    })),

  updateCleaningParams: (id, params) =>
    set((state) => ({
      cleaningRecords: state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, params: { ...r.params, ...params } } : r
      ),
    })),

  completeQualityCheck: (id, passed, inspector, remark) =>
    set((state) => ({
      cleaningRecords: state.cleaningRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              qualityCheck: {
                passed,
                inspector,
                checkTime: new Date().toISOString(),
                remark,
              },
            }
          : r
      ),
      packages: passed
        ? state.packages.map((p) =>
            state.cleaningRecords.find((r) => r.id === id)?.packageId === p.id
              ? { ...p, status: 'cleaned' as PackageStatus }
              : p
          )
        : state.packages,
    })),

  addSterilizationBatch: (batch) =>
    set((state) => ({
      sterilizationBatches: [
        ...state.sterilizationBatches,
        { ...batch, id: generateId(), startTime: new Date().toISOString(), status: 'running' },
      ],
      packages: state.packages.map((p) =>
        batch.packageIds.includes(p.id) ? { ...p, status: 'sterilizing' as PackageStatus } : p
      ),
    })),

  completeSterilization: (batchId, biologicalTest) =>
    set((state) => ({
      sterilizationBatches: state.sterilizationBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              endTime: new Date().toISOString(),
              biologicalTest,
              status: biologicalTest === 'passed' ? 'completed' : 'failed',
            }
          : b
      ),
      packages:
        biologicalTest === 'failed'
          ? state.packages.map((p) =>
              state.sterilizationBatches
                .find((b) => b.id === batchId)
                ?.packageIds.includes(p.id)
                ? { ...p, status: 'abnormal' as PackageStatus }
                : p
            )
          : state.packages,
    })),

  releaseBatch: (batchId, releaser1, releaser2) =>
    set((state) => {
      const batch = state.sterilizationBatches.find((b) => b.id === batchId);
      if (!batch) return state;

      const expireDate = addDays(new Date(), batch.validDays);

      return {
        sterilizationBatches: state.sterilizationBatches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                releaser1,
                releaser2,
                releaseTime: new Date().toISOString(),
                status: 'released',
              }
            : b
        ),
        packages: state.packages.map((p) =>
          batch.packageIds.includes(p.id)
            ? {
                ...p,
                status: 'sterilized' as PackageStatus,
                sterilizationExpireAt: expireDate.toISOString(),
              }
            : p
        ),
      };
    }),

  addException: (exception) =>
    set((state) => ({
      exceptions: [
        ...state.exceptions,
        { ...exception, id: generateId(), reportTime: new Date().toISOString(), status: 'pending' },
      ],
      packages: exception.relatedPackageId
        ? state.packages.map((p) =>
            p.id === exception.relatedPackageId
              ? { ...p, status: 'abnormal' as PackageStatus }
              : p
          )
        : state.packages,
    })),

  updateException: (id, updates) =>
    set((state) => ({
      exceptions: state.exceptions.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  closeException: (id, handler, result) =>
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'closed',
              handler,
              handleResult: result,
              handleTime: new Date().toISOString(),
            }
          : e
      ),
    })),

  addUsageRecord: (record) =>
    set((state) => ({
      usageRecords: [
        ...state.usageRecords,
        { ...record, id: generateId(), usedAt: new Date().toISOString() },
      ],
      packages: state.packages.map((p) =>
        p.id === record.packageId
          ? {
              ...p,
              status: 'in_use' as PackageStatus,
              lastUsedAt: new Date().toISOString(),
              currentPatient: record.patientName,
              currentChair: record.chairNumber,
            }
          : p
      ),
    })),

  addBorrowRecord: (record) =>
    set((state) => ({
      borrowRecords: [
        ...state.borrowRecords,
        { ...record, id: generateId(), borrowTime: new Date().toISOString(), status: 'borrowed' },
      ],
    })),

  returnBorrow: (id) =>
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === id ? { ...r, status: 'returned', returnTime: new Date().toISOString() } : r
      ),
    })),

  getPackageById: (id) => get().packages.find((p) => p.id === id),

  getPackageByBarcode: (barcode) => get().packages.find((p) => p.barcode === barcode),

  getTraceEvents: (packageId) => {
    const state = get();
    const pkg = state.packages.find((p) => p.id === packageId);
    if (!pkg) return [];

    const events: TraceEvent[] = [];

    events.push({
      id: `create-${pkg.id}`,
      type: 'create',
      title: '器械包建档',
      time: pkg.createTime,
      operator: '系统',
      details: { name: pkg.name, barcode: pkg.barcode },
    });

    const usages = state.usageRecords
      .filter((u) => u.packageId === packageId)
      .sort((a, b) => new Date(a.usedAt).getTime() - new Date(b.usedAt).getTime());
    usages.forEach((u) => {
      events.push({
        id: `usage-${u.id}`,
        type: 'usage',
        title: '开包使用',
        time: u.openTime,
        operator: u.doctor,
        details: {
          patient: u.patientName,
          chair: u.chairNumber,
          doctor: u.doctor,
        },
      });
    });

    const cleanings = state.cleaningRecords
      .filter((c) => c.packageId === packageId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    cleanings.forEach((c) => {
      events.push({
        id: `recycle-${c.id}`,
        type: 'recycle',
        title: '回收登记',
        time: c.recycleTime,
        operator: c.operator,
        details: { patient: c.patientName, chair: c.chairNumber },
      });

      const completedSteps = Object.entries(c.steps).filter(([, v]) => v).length;
      if (completedSteps > 0) {
        events.push({
          id: `cleaning-${c.id}`,
          type: 'cleaning',
          title: `清洗消毒 (${completedSteps}/6步)`,
          time: c.createdAt,
          operator: c.operator,
          details: c.params,
        });
      }

      if (c.qualityCheck) {
        events.push({
          id: `qc-${c.id}`,
          type: 'quality',
          title: c.qualityCheck.passed ? '质检合格' : '质检不合格',
          time: c.qualityCheck.checkTime,
          operator: c.qualityCheck.inspector,
          details: { remark: c.qualityCheck.remark },
        });
      }
    });

    const batches = state.sterilizationBatches.filter((b) => b.packageIds.includes(packageId));
    batches.forEach((b) => {
      events.push({
        id: `ster-start-${b.id}`,
        type: 'sterilization',
        title: '开始灭菌',
        time: b.startTime,
        operator: b.operator,
        details: {
          batchNo: b.batchNo,
          method: b.sterilizationMethod,
          ...b.params,
        },
      });

      if (b.endTime) {
        events.push({
          id: `ster-end-${b.id}`,
          type: 'sterilization_end',
          title: `灭菌完成 - 生物监测${b.biologicalTest === 'passed' ? '合格' : '不合格'}`,
          time: b.endTime,
          operator: b.operator,
          details: { biologicalTest: b.biologicalTest },
        });
      }

      if (b.releaseTime) {
        events.push({
          id: `release-${b.id}`,
          type: 'release',
          title: '双人放行',
          time: b.releaseTime,
          operator: `${b.releaser1} + ${b.releaser2}`,
          details: { validDays: b.validDays },
        });
      }
    });

    const exceptions = state.exceptions.filter((e) => e.relatedPackageId === packageId);
    exceptions.forEach((e) => {
      events.push({
        id: `exception-${e.id}`,
        type: 'exception',
        title: `异常：${e.type}`,
        time: e.reportTime,
        operator: e.reporter,
        details: { description: e.description, status: e.status },
      });
    });

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  },

  getSterileInventory: () => {
    return get()
      .packages.filter((p) => p.status === 'sterilized')
      .sort((a, b) => {
        if (!a.sterilizationExpireAt) return 1;
        if (!b.sterilizationExpireAt) return -1;
        return new Date(a.sterilizationExpireAt).getTime() - new Date(b.sterilizationExpireAt).getTime();
      });
  },

  getNearExpiryPackages: () => {
    const now = new Date();
    const sevenDaysLater = addDays(now, 7);
    return get().packages.filter((p) => {
      if (!p.sterilizationExpireAt || p.status !== 'sterilized') return false;
      const expire = new Date(p.sterilizationExpireAt);
      return expire >= now && expire <= sevenDaysLater;
    });
  },

  getExpiredPackages: () => {
    const now = new Date();
    return get().packages.filter((p) => {
      if (!p.sterilizationExpireAt) return false;
      return new Date(p.sterilizationExpireAt) < now && p.status === 'sterilized';
    });
  },
}));
