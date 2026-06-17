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

const STORAGE_KEY = 'dental-trace-data';

interface PersistedData {
  packages: InstrumentPackage[];
  cleaningRecords: CleaningRecord[];
  sterilizationBatches: SterilizationBatch[];
  exceptions: ExceptionRecord[];
  usageRecords: UsageRecord[];
  borrowRecords: BorrowRecord[];
}

function loadFromStorage(): PersistedData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return null;
}

function saveToStorage(data: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

const storedData = loadFromStorage();

interface AppState {
  packages: InstrumentPackage[];
  cleaningRecords: CleaningRecord[];
  sterilizationBatches: SterilizationBatch[];
  exceptions: ExceptionRecord[];
  usageRecords: UsageRecord[];
  borrowRecords: BorrowRecord[];
  currentUser: string;

  persist: () => void;
  resetData: () => void;

  addPackage: (pkg: Omit<InstrumentPackage, 'id' | 'createTime' | 'status'>) => void;
  updatePackage: (id: string, updates: Partial<InstrumentPackage>) => void;
  updatePackageStatus: (id: string, status: PackageStatus) => void;

  addCleaningRecord: (record: Omit<CleaningRecord, 'id' | 'createdAt'>) => CleaningRecord;
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
  getAvailableBorrowPackages: () => InstrumentPackage[];
  isPackageBorrowed: (packageId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  packages: storedData?.packages ?? mockPackages,
  cleaningRecords: storedData?.cleaningRecords ?? mockCleaningRecords,
  sterilizationBatches: storedData?.sterilizationBatches ?? mockSterilizationBatches,
  exceptions: storedData?.exceptions ?? mockExceptions,
  usageRecords: storedData?.usageRecords ?? mockUsageRecords,
  borrowRecords: storedData?.borrowRecords ?? mockBorrowRecords,
  currentUser: '张护士',

  persist: () => {
    const state = get();
    saveToStorage({
      packages: state.packages,
      cleaningRecords: state.cleaningRecords,
      sterilizationBatches: state.sterilizationBatches,
      exceptions: state.exceptions,
      usageRecords: state.usageRecords,
      borrowRecords: state.borrowRecords,
    });
  },

  resetData: () => {
    set({
      packages: mockPackages,
      cleaningRecords: mockCleaningRecords,
      sterilizationBatches: mockSterilizationBatches,
      exceptions: mockExceptions,
      usageRecords: mockUsageRecords,
      borrowRecords: mockBorrowRecords,
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  addPackage: (pkg) =>
    set((state) => {
      const newPackages = [
        ...state.packages,
        {
          ...pkg,
          id: generateId(),
          createTime: new Date().toISOString(),
          status: 'sterilized' as PackageStatus,
        },
      ];
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { packages: newPackages };
    }),

  updatePackage: (id, updates) =>
    set((state) => {
      const newPackages = state.packages.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { packages: newPackages };
    }),

  updatePackageStatus: (id, status) =>
    set((state) => {
      const newPackages = state.packages.map((p) => (p.id === id ? { ...p, status } : p));
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { packages: newPackages };
    }),

  addCleaningRecord: (record) => {
    const newRecord: CleaningRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const newCleaningRecords = [...state.cleaningRecords, newRecord];
      saveToStorage({
        packages: state.packages,
        cleaningRecords: newCleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { cleaningRecords: newCleaningRecords };
    });
    return newRecord;
  },

  updateCleaningRecord: (id, updates) =>
    set((state) => {
      const newCleaningRecords = state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveToStorage({
        packages: state.packages,
        cleaningRecords: newCleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { cleaningRecords: newCleaningRecords };
    }),

  updateCleaningSteps: (id, steps) =>
    set((state) => {
      const newCleaningRecords = state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, steps: { ...r.steps, ...steps } } : r
      );
      saveToStorage({
        packages: state.packages,
        cleaningRecords: newCleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { cleaningRecords: newCleaningRecords };
    }),

  updateCleaningParams: (id, params) =>
    set((state) => {
      const newCleaningRecords = state.cleaningRecords.map((r) =>
        r.id === id ? { ...r, params: { ...r.params, ...params } } : r
      );
      saveToStorage({
        packages: state.packages,
        cleaningRecords: newCleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { cleaningRecords: newCleaningRecords };
    }),

  completeQualityCheck: (id, passed, inspector, remark) =>
    set((state) => {
      const newCleaningRecords = state.cleaningRecords.map((r) =>
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
      );
      const newPackages = passed
        ? state.packages.map((p) =>
            state.cleaningRecords.find((r) => r.id === id)?.packageId === p.id
              ? { ...p, status: 'cleaned' as PackageStatus }
              : p
          )
        : state.packages;
      saveToStorage({
        packages: newPackages,
        cleaningRecords: newCleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        cleaningRecords: newCleaningRecords,
        packages: newPackages,
      };
    }),

  addSterilizationBatch: (batch) =>
    set((state) => {
      const newBatch: SterilizationBatch = {
        ...batch,
        id: generateId(),
        startTime: new Date().toISOString(),
        status: 'running',
      };
      const newSterilizationBatches = [...state.sterilizationBatches, newBatch];
      const newPackages = state.packages.map((p) =>
        batch.packageIds.includes(p.id) ? { ...p, status: 'sterilizing' as PackageStatus } : p
      );
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: newSterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        sterilizationBatches: newSterilizationBatches,
        packages: newPackages,
      };
    }),

  completeSterilization: (batchId, biologicalTest) =>
    set((state) => {
      const newSterilizationBatches = state.sterilizationBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              endTime: new Date().toISOString(),
              biologicalTest,
              status: biologicalTest === 'passed' ? ('completed' as const) : ('failed' as const),
            }
          : b
      );
      const newPackages =
        biologicalTest === 'failed'
          ? state.packages.map((p) =>
              state.sterilizationBatches
                .find((b) => b.id === batchId)
                ?.packageIds.includes(p.id)
                ? { ...p, status: 'abnormal' as PackageStatus }
                : p
            )
          : state.packages;
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: newSterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        sterilizationBatches: newSterilizationBatches,
        packages: newPackages,
      };
    }),

  releaseBatch: (batchId, releaser1, releaser2) =>
    set((state) => {
      const batch = state.sterilizationBatches.find((b) => b.id === batchId);
      if (!batch) return state;

      const expireDate = addDays(new Date(), batch.validDays);

      const newSterilizationBatches = state.sterilizationBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              releaser1,
              releaser2,
              releaseTime: new Date().toISOString(),
              status: 'released' as const,
            }
          : b
      );
      const newPackages = state.packages.map((p) =>
        batch.packageIds.includes(p.id)
          ? {
              ...p,
              status: 'sterilized' as PackageStatus,
              sterilizationExpireAt: expireDate.toISOString(),
            }
          : p
      );
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: newSterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        sterilizationBatches: newSterilizationBatches,
        packages: newPackages,
      };
    }),

  addException: (exception) =>
    set((state) => {
      const newException: ExceptionRecord = {
        ...exception,
        id: generateId(),
        reportTime: new Date().toISOString(),
        status: 'pending',
      };
      const newExceptions = [...state.exceptions, newException];
      const newPackages = exception.relatedPackageId
        ? state.packages.map((p) =>
            p.id === exception.relatedPackageId
              ? { ...p, status: 'abnormal' as PackageStatus }
              : p
          )
        : state.packages;
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: newExceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        exceptions: newExceptions,
        packages: newPackages,
      };
    }),

  updateException: (id, updates) =>
    set((state) => {
      const newExceptions = state.exceptions.map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveToStorage({
        packages: state.packages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: newExceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { exceptions: newExceptions };
    }),

  closeException: (id, handler, result) =>
    set((state) => {
      const newExceptions = state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'closed' as const,
              handler,
              handleResult: result,
              handleTime: new Date().toISOString(),
            }
          : e
      );
      saveToStorage({
        packages: state.packages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: newExceptions,
        usageRecords: state.usageRecords,
        borrowRecords: state.borrowRecords,
      });
      return { exceptions: newExceptions };
    }),

  addUsageRecord: (record) =>
    set((state) => {
      const newUsageRecord: UsageRecord = {
        ...record,
        id: generateId(),
        usedAt: new Date().toISOString(),
      };
      const newUsageRecords = [...state.usageRecords, newUsageRecord];
      const newPackages = state.packages.map((p) =>
        p.id === record.packageId
          ? {
              ...p,
              status: 'in_use' as PackageStatus,
              lastUsedAt: new Date().toISOString(),
              currentPatient: record.patientName,
              currentChair: record.chairNumber,
            }
          : p
      );
      saveToStorage({
        packages: newPackages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: newUsageRecords,
        borrowRecords: state.borrowRecords,
      });
      return {
        usageRecords: newUsageRecords,
        packages: newPackages,
      };
    }),

  addBorrowRecord: (record) =>
    set((state) => {
      const newBorrowRecord: BorrowRecord = {
        ...record,
        id: generateId(),
        borrowTime: new Date().toISOString(),
        status: 'borrowed',
      };
      const newBorrowRecords = [...state.borrowRecords, newBorrowRecord];
      saveToStorage({
        packages: state.packages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: newBorrowRecords,
      });
      return { borrowRecords: newBorrowRecords };
    }),

  returnBorrow: (id) =>
    set((state) => {
      const newBorrowRecords = state.borrowRecords.map((r) =>
        r.id === id ? { ...r, status: 'returned' as const, returnTime: new Date().toISOString() } : r
      );
      saveToStorage({
        packages: state.packages,
        cleaningRecords: state.cleaningRecords,
        sterilizationBatches: state.sterilizationBatches,
        exceptions: state.exceptions,
        usageRecords: state.usageRecords,
        borrowRecords: newBorrowRecords,
      });
      return { borrowRecords: newBorrowRecords };
    }),

  getPackageById: (id) => get().packages.find((p) => p.id === id),

  getPackageByBarcode: (barcode) => get().packages.find((p) => p.barcode === barcode),

  isPackageBorrowed: (packageId) => {
    const state = get();
    return state.borrowRecords.some(
      (r) => r.packageId === packageId && r.status === 'borrowed'
    );
  },

  getAvailableBorrowPackages: () => {
    const state = get();
    const borrowedPackageIds = state.borrowRecords
      .filter((r) => r.status === 'borrowed')
      .map((r) => r.packageId);
    return state.packages.filter(
      (p) => p.status === 'sterilized' && !borrowedPackageIds.includes(p.id)
    );
  },

  getSterileInventory: () => {
    const state = get();
    const borrowedPackageIds = state.borrowRecords
      .filter((r) => r.status === 'borrowed')
      .map((r) => r.packageId);
    return state.packages
      .filter(
        (p) => p.status === 'sterilized' && !borrowedPackageIds.includes(p.id)
      )
      .sort((a, b) => {
        if (!a.sterilizationExpireAt) return 1;
        if (!b.sterilizationExpireAt) return -1;
        return new Date(a.sterilizationExpireAt).getTime() - new Date(b.sterilizationExpireAt).getTime();
      });
  },

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

    const borrows = state.borrowRecords.filter((b) => b.packageId === packageId);
    borrows.forEach((b) => {
      events.push({
        id: `borrow-${b.id}`,
        type: 'borrow',
        title: b.status === 'borrowed' ? '借出' : '借出',
        time: b.borrowTime,
        operator: b.borrower,
        details: { borrower: b.borrower, remark: b.remark, status: b.status },
      });
      if (b.returnTime) {
        events.push({
          id: `return-${b.id}`,
          type: 'return',
          title: '归还',
          time: b.returnTime,
          operator: b.borrower,
          details: { borrower: b.borrower },
        });
      }
    });

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
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
