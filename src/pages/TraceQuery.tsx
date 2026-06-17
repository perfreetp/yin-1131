import { useState } from 'react';
import {
  Search,
  Package,
  User,
  Armchair,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Flame,
  Droplets,
  PackageOpen,
  UserCheck,
  XCircle,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime, formatDate } from '@/utils/date';
import {
  InstrumentPackage,
  UsageRecord,
  TraceEvent,
  STATUS_LABELS,
} from '@/types';

type QueryType = 'package' | 'patient' | 'chair' | 'date';

export default function TraceQuery() {
  const packages = useAppStore((state) => state.packages);
  const usageRecords = useAppStore((state) => state.usageRecords);
  const getTraceEvents = useAppStore((state) => state.getTraceEvents);
  const exceptions = useAppStore((state) => state.exceptions);
  const sterilizationBatches = useAppStore((state) => state.sterilizationBatches);

  const [queryType, setQueryType] = useState<QueryType>('package');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const [selectedPackage, setSelectedPackage] = useState<InstrumentPackage | null>(null);
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);

  const queryTypes = [
    { value: 'package', label: '按器械包', icon: Package },
    { value: 'patient', label: '按患者', icon: User },
    { value: 'chair', label: '按椅位', icon: Armchair },
    { value: 'date', label: '按日期', icon: Calendar },
  ];

  const getSearchResults = () => {
    if (queryType === 'package') {
      if (!searchTerm) return packages.slice(0, 10);
      return packages.filter(
        (p) =>
          p.name.includes(searchTerm) ||
          p.barcode.includes(searchTerm)
      );
    } else if (queryType === 'patient') {
      if (!searchTerm) return [];
      const patientRecords = usageRecords.filter((u) =>
        u.patientName.includes(searchTerm)
      );
      const patientPackageIds = [...new Set(patientRecords.map((r) => r.packageId))];
      return packages.filter((p) => patientPackageIds.includes(p.id));
    } else if (queryType === 'chair') {
      if (!searchTerm) return [];
      const chairRecords = usageRecords.filter((u) =>
        u.chairNumber.includes(searchTerm)
      );
      const chairPackageIds = [...new Set(chairRecords.map((r) => r.packageId))];
      return packages.filter((p) => chairPackageIds.includes(p.id));
    } else {
      const dateRecords = usageRecords.filter(
        (u) => formatDate(u.usedAt) === selectedDate
      );
      const datePackageIds = [...new Set(dateRecords.map((r) => r.packageId))];
      return packages.filter((p) => datePackageIds.includes(p.id));
    }
  };

  const searchResults = getSearchResults();

  const handleViewTrace = (pkg: InstrumentPackage) => {
    setSelectedPackage(pkg);
    setTraceEvents(getTraceEvents(pkg.id));
    setShowTraceModal(true);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Package className="h-4 w-4" />;
      case 'usage':
        return <UserCheck className="h-4 w-4" />;
      case 'recycle':
        return <PackageOpen className="h-4 w-4" />;
      case 'cleaning':
        return <Droplets className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'sterilization':
      case 'sterilization_end':
        return <Flame className="h-4 w-4" />;
      case 'release':
        return <CheckCircle className="h-4 w-4" />;
      case 'exception':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-primary-100 text-primary-600';
      case 'usage':
        return 'bg-success-100 text-success-600';
      case 'recycle':
        return 'bg-warning-100 text-warning-600';
      case 'cleaning':
        return 'bg-primary-100 text-primary-600';
      case 'quality':
        return 'bg-success-100 text-success-600';
      case 'sterilization':
        return 'bg-danger-100 text-danger-600';
      case 'sterilization_end':
        return 'bg-success-100 text-success-600';
      case 'release':
        return 'bg-success-100 text-success-600';
      case 'exception':
        return 'bg-danger-100 text-danger-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const getUsageRecordsForPackage = (packageId: string) => {
    return usageRecords
      .filter((u) => u.packageId === packageId)
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());
  };

  return (
    <div className="space-y-6">
      {/* 四入口查询卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {queryTypes.map((item) => {
          const Icon = item.icon;
          const isActive = queryType === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setQueryType(item.value as QueryType)}
              className={`rounded-xl p-5 text-left transition-all ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-200'
                  : 'bg-white text-neutral-700 shadow-card hover:shadow-card-hover'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isActive ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-500'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-base font-semibold">{item.label}</p>
              <p className={`mt-1 text-xs ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                {item.value === 'package' && '扫码或输入包名称'}
                {item.value === 'patient' && '输入患者姓名查询'}
                {item.value === 'chair' && '输入椅位号查询'}
                {item.value === 'date' && '选择日期范围查询'}
              </p>
            </button>
          );
        })}
      </div>

      {/* 搜索栏 */}
      <div className="rounded-xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-4">
          {queryType !== 'date' ? (
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={
                  queryType === 'package'
                    ? '请输入器械包名称或条码...'
                    : queryType === 'patient'
                    ? '请输入患者姓名...'
                    : '请输入椅位号，如：1号椅位...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-3 pl-12 pr-4 text-base focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-neutral-500" />
                <span className="text-sm text-neutral-600">选择日期：</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-md shadow-primary-200 hover:bg-primary-600 transition-all">
            <Search className="h-4 w-4" />
            查询
          </button>
        </div>
      </div>

      {/* 查询结果 */}
      <div className="rounded-xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-800">
            查询结果
            <span className="ml-2 text-sm font-normal text-neutral-500">
              共 {searchResults.length} 条记录
            </span>
          </h3>
        </div>

        <div className="divide-y divide-neutral-100">
          {searchResults.map((pkg) => {
            const usages = getUsageRecordsForPackage(pkg.id);
            const latestUsage = usages[0];
            const relatedExceptions = exceptions.filter(
              (e) => e.relatedPackageId === pkg.id && e.status !== 'closed'
            );

            return (
              <div
                key={pkg.id}
                onClick={() => handleViewTrace(pkg)}
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50"
              >
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                    pkg.status === 'sterilized'
                      ? 'bg-success-100 text-success-600'
                      : pkg.status === 'in_use'
                      ? 'bg-primary-100 text-primary-600'
                      : pkg.status === 'abnormal' || pkg.status === 'expired'
                      ? 'bg-danger-100 text-danger-600'
                      : 'bg-warning-100 text-warning-600'
                  }`}
                >
                  <Package className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-800">{pkg.name}</span>
                    <StatusBadge status={pkg.status} size="sm" />
                    {relatedExceptions.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                        <AlertCircle className="h-3 w-3" />
                        {relatedExceptions.length} 个异常
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    条码：{pkg.barcode}
                  </p>
                  {latestUsage && (
                    <div className="mt-1.5 flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {latestUsage.patientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Armchair className="h-3 w-3" />
                        {latestUsage.chairNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(latestUsage.usedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 flex-shrink-0 text-neutral-300" />
              </div>
            );
          })}

          {searchResults.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-lg font-medium text-neutral-600">
                {queryType === 'package' && '请输入器械包名称或条码进行查询'}
                {queryType === 'patient' && '未找到相关患者的器械包记录'}
                {queryType === 'chair' && '未找到该椅位的器械包记录'}
                {queryType === 'date' && '该日期暂无器械包使用记录'}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                尝试使用其他关键词或条件查询
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 追溯详情弹窗 */}
      <Modal
        isOpen={showTraceModal}
        onClose={() => setShowTraceModal(false)}
        title="器械包追溯链路"
        size="xl"
        footer={
          <button
            onClick={() => setShowTraceModal(false)}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            关闭
          </button>
        }
      >
        {selectedPackage && (
          <div className="space-y-6">
            {/* 器械包基本信息 */}
            <div className="rounded-xl bg-neutral-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-neutral-800">
                    {selectedPackage.name}
                  </h4>
                  <p className="mt-1 text-sm text-neutral-500">
                    条码：{selectedPackage.barcode}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedPackage.instruments.map((inst, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-white px-2 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
                <StatusBadge status={selectedPackage.status} />
              </div>
            </div>

            {/* 时间轴追溯链路 */}
            <div>
              <h5 className="mb-4 text-sm font-semibold text-neutral-700">
                完整追溯链路
              </h5>
              <div className="relative">
                {traceEvents.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    {/* 时间线 */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white ${getEventColor(
                          event.type
                        )}`}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      {index < traceEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-neutral-200" />
                      )}
                    </div>

                    {/* 事件内容 */}
                    <div className="pb-6 flex-1">
                      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-neutral-100">
                        <div className="flex items-center justify-between">
                          <h6 className="font-medium text-neutral-800">
                            {event.title}
                          </h6>
                          <span className="text-xs text-neutral-500">
                            {formatDateTime(event.time)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          操作人：{event.operator}
                        </p>

                        {/* 详情展示 */}
                        {Object.keys(event.details).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 rounded bg-neutral-50 px-2 py-1.5"
                              >
                                <span className="text-neutral-500 capitalize">
                                  {key === 'patient'
                                    ? '患者'
                                    : key === 'chair'
                                    ? '椅位'
                                    : key === 'doctor'
                                    ? '医生'
                                    : key === 'batchNo'
                                    ? '批次号'
                                    : key === 'method'
                                    ? '灭菌方式'
                                    : key === 'temperature'
                                    ? '温度(℃)'
                                    : key === 'pressure'
                                    ? '压力(kPa)'
                                    : key === 'duration'
                                    ? '时长(min)'
                                    : key === 'validDays'
                                    ? '有效期(天)'
                                    : key === 'name'
                                    ? '名称'
                                    : key === 'barcode'
                                    ? '条码'
                                    : key === 'biologicalTest'
                                    ? '生物监测'
                                    : key === 'remark'
                                    ? '备注'
                                    : key === 'description'
                                    ? '描述'
                                    : key === 'status'
                                    ? '状态'
                                    : key}
                                </span>
                                <span className="font-medium text-neutral-700">
                                  {typeof value === 'boolean'
                                    ? value
                                      ? '是'
                                      : '否'
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {traceEvents.length === 0 && (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    暂无追溯记录
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
