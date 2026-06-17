import { useState } from 'react';
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Package,
  Layers,
  Search,
  Filter,
  ChevronRight,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  UserCheck,
  Droplets,
  PackageOpen,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/utils/date';
import {
  ExceptionType,
  ExceptionStatus,
  EXCEPTION_TYPE_LABELS,
  InstrumentPackage,
  TraceEvent,
} from '@/types';

export default function ExceptionHandling() {
  const navigate = useNavigate();
  const exceptions = useAppStore((state) => state.exceptions);
  const packages = useAppStore((state) => state.packages);
  const batches = useAppStore((state) => state.sterilizationBatches);
  const addException = useAppStore((state) => state.addException);
  const updateException = useAppStore((state) => state.updateException);
  const closeException = useAppStore((state) => state.closeException);
  const getTraceEvents = useAppStore((state) => state.getTraceEvents);
  const currentUser = useAppStore((state) => state.currentUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedException, setSelectedException] = useState<typeof exceptions[0] | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ExceptionType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showTraceModal, setShowTraceModal] = useState(false);
  const [tracePackage, setTracePackage] = useState<InstrumentPackage | null>(null);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);

  const [formData, setFormData] = useState({
    type: 'damaged' as ExceptionType,
    relatedPackageId: '',
    relatedBatchId: '',
    description: '',
  });

  const [handleResult, setHandleResult] = useState('');

  const filteredExceptions = exceptions.filter((e) => {
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const matchesSearch =
      e.description.includes(searchTerm) ||
      e.relatedPackageName?.includes(searchTerm) ||
      e.relatedBatchNo?.includes(searchTerm);
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingCount = exceptions.filter((e) => e.status === 'pending').length;
  const processingCount = exceptions.filter((e) => e.status === 'processing').length;
  const closedCount = exceptions.filter((e) => e.status === 'closed').length;

  const handleAddException = () => {
    if (!formData.description) {
      alert('请填写异常描述');
      return;
    }

    const relatedPkg = packages.find((p) => p.id === formData.relatedPackageId);
    const relatedBatch = batches.find((b) => b.id === formData.relatedBatchId);

    addException({
      type: formData.type,
      relatedPackageId: formData.relatedPackageId || undefined,
      relatedPackageBarcode: relatedPkg?.barcode,
      relatedPackageName: relatedPkg?.name,
      relatedBatchId: formData.relatedBatchId || undefined,
      relatedBatchNo: relatedBatch?.batchNo,
      description: formData.description,
      reporter: currentUser,
    });

    setShowAddModal(false);
    setFormData({
      type: 'damaged',
      relatedPackageId: '',
      relatedBatchId: '',
      description: '',
    });
  };

  const startProcessing = (id: string) => {
    updateException(id, {
      status: 'processing',
      handler: currentUser,
    });
  };

  const handleClose = () => {
    if (!selectedException) return;
    if (!handleResult) {
      alert('请填写处理结果');
      return;
    }
    closeException(selectedException.id, currentUser, handleResult);
    setShowDetailModal(false);
    setSelectedException(null);
    setHandleResult('');
  };

  const handleViewTrace = (pkg: InstrumentPackage) => {
    setTracePackage(pkg);
    setTraceEvents(getTraceEvents(pkg.id));
    setShowTraceModal(true);
  };

  const handleGoToTracePage = (pkg: InstrumentPackage) => {
    setShowDetailModal(false);
    setShowTraceModal(false);
    navigate('/trace');
  };

  const getBatchPackages = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return [];
    return packages.filter((p) => batch.packageIds.includes(p.id));
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
      case 'borrow':
      case 'return':
        return <ArrowRightLeft className="h-4 w-4" />;
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
      case 'borrow':
        return 'bg-warning-100 text-warning-600';
      case 'return':
        return 'bg-success-100 text-success-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const typeColors: Record<ExceptionType, string> = {
    missing: 'bg-warning-100 text-warning-700',
    damaged: 'bg-danger-100 text-danger-700',
    cleaning_failed: 'bg-danger-100 text-danger-700',
    sterilization_failed: 'bg-danger-100 text-danger-700',
    other: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">待处理</p>
              <p className="mt-2 text-2xl font-bold text-danger-600">{pendingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
              <AlertTriangle className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">处理中</p>
              <p className="mt-2 text-2xl font-bold text-primary-600">{processingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Clock className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">已闭环</p>
              <p className="mt-2 text-2xl font-bold text-success-600">{closedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索异常描述、相关器械包..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | 'all')}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="closed">已闭环</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ExceptionType | 'all')}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">全部类型</option>
              {Object.entries(EXCEPTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-danger-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-danger-200 hover:bg-danger-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          上报异常
        </button>
      </div>

      {/* 异常列表 */}
      <div className="space-y-3">
        {filteredExceptions.map((exception) => (
          <div
            key={exception.id}
            onClick={() => {
              setSelectedException(exception);
              setShowDetailModal(true);
            }}
            className="flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 shadow-card transition-all hover:shadow-card-hover"
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                exception.status === 'pending'
                  ? 'bg-danger-100'
                  : exception.status === 'processing'
                  ? 'bg-primary-100'
                  : 'bg-success-100'
              }`}
            >
              {exception.status === 'pending' && (
                <AlertCircle className="h-5 w-5 text-danger-600" />
              )}
              {exception.status === 'processing' && (
                <Clock className="h-5 w-5 text-primary-600" />
              )}
              {exception.status === 'closed' && (
                <CheckCircle className="h-5 w-5 text-success-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    typeColors[exception.type]
                  }`}
                >
                  {EXCEPTION_TYPE_LABELS[exception.type]}
                </span>
                <StatusBadge status={exception.status} size="sm" />
              </div>
              <p className="mt-1.5 truncate text-sm font-medium text-neutral-800">
                {exception.description}
              </p>
              <div className="mt-1.5 flex items-center gap-4 text-xs text-neutral-500">
                {exception.relatedPackageName && (
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {exception.relatedPackageName}
                  </span>
                )}
                {exception.relatedBatchNo && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {exception.relatedBatchNo}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {exception.reporter}
                </span>
                <span>{formatDateTime(exception.reportTime)}</span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 flex-shrink-0 text-neutral-300" />
          </div>
        ))}

        {filteredExceptions.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-lg font-medium text-neutral-800">暂无异常记录</p>
            <p className="mt-1 text-sm text-neutral-500">
              所有器械包运行正常，继续保持！
            </p>
          </div>
        )}
      </div>

      {/* 新增异常弹窗 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="上报异常"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddException}
              className="rounded-lg bg-danger-500 px-4 py-2 text-sm font-medium text-white hover:bg-danger-600 transition-colors"
            >
              提交上报
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              异常类型 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(EXCEPTION_TYPE_LABELS) as ExceptionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, type })}
                  className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                    formData.type === type
                      ? 'border-danger-500 bg-danger-50 text-danger-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {EXCEPTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              相关器械包
            </label>
            <select
              value={formData.relatedPackageId}
              onChange={(e) =>
                setFormData({ ...formData, relatedPackageId: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">无（不关联器械包）</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.barcode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              相关灭菌批次
            </label>
            <select
              value={formData.relatedBatchId}
              onChange={(e) =>
                setFormData({ ...formData, relatedBatchId: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">无（不关联批次）</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNo} - {batch.sterilizer}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              异常描述 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述异常情况..."
              rows={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-sm text-neutral-600">
              上报人：<span className="font-medium text-neutral-800">{currentUser}</span>
            </p>
          </div>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="异常详情"
        size="xl"
        footer={
          selectedException?.status === 'pending' ? (
            <>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  startProcessing(selectedException.id);
                  setSelectedException({
                    ...selectedException,
                    status: 'processing',
                    handler: currentUser,
                  });
                }}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                开始处理
              </button>
            </>
          ) : selectedException?.status === 'processing' ? (
            <>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleClose}
                className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
              >
                闭环处理
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDetailModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              关闭
            </button>
          )
        }
      >
        {selectedException && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  typeColors[selectedException.type]
                }`}
              >
                {EXCEPTION_TYPE_LABELS[selectedException.type]}
              </span>
              <StatusBadge status={selectedException.status} />
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-700">异常描述</p>
              <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-800">
                {selectedException.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">上报人</p>
                <p className="mt-1 text-sm font-medium text-neutral-800">
                  {selectedException.reporter}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">上报时间</p>
                <p className="mt-1 text-sm font-medium text-neutral-800">
                  {formatDateTime(selectedException.reportTime)}
                </p>
              </div>
              {selectedException.relatedPackageName && (
                <div>
                  <p className="text-sm text-neutral-500">相关器械包</p>
                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {selectedException.relatedPackageName}
                    <span className="ml-1 text-xs text-neutral-500">
                      ({selectedException.relatedPackageBarcode})
                    </span>
                  </p>
                </div>
              )}
              {selectedException.relatedBatchNo && (
                <div>
                  <p className="text-sm text-neutral-500">相关批次</p>
                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {selectedException.relatedBatchNo}
                  </p>
                </div>
              )}
              {selectedException.handler && (
                <div>
                  <p className="text-sm text-neutral-500">处理人</p>
                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {selectedException.handler}
                  </p>
                </div>
              )}
            </div>

            {/* 关联批次的器械包列表 */}
            {selectedException.relatedBatchId && (
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <Flame className="h-4 w-4 text-danger-500" />
                  批次关联器械包
                  <span className="text-xs font-normal text-neutral-500">
                    （点击可查看追溯链路）
                  </span>
                </p>
                <div className="space-y-2">
                  {getBatchPackages(selectedException.relatedBatchId).map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTrace(pkg);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                          <Package className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {pkg.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {pkg.barcode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={pkg.status} size="sm" />
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedException.status === 'processing' && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-neutral-700">
                  处理结果
                </p>
                <textarea
                  value={handleResult}
                  onChange={(e) => setHandleResult(e.target.value)}
                  placeholder="请填写处理结果..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            )}

            {selectedException.handleResult && (
              <div>
                <p className="text-sm font-medium text-neutral-700">处理结果</p>
                <p className="mt-2 rounded-lg bg-success-50 p-3 text-sm text-success-800">
                  {selectedException.handleResult}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  闭环时间：{selectedException.handleTime && formatDateTime(selectedException.handleTime)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 追溯详情弹窗 */}
      <Modal
        isOpen={showTraceModal}
        onClose={() => setShowTraceModal(false)}
        title="器械包追溯链路"
        size="xl"
        footer={
          tracePackage && (
            <>
              <button
                onClick={() => setShowTraceModal(false)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => handleGoToTracePage(tracePackage)}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                <Search className="h-4 w-4" />
                前往追溯查询页
              </button>
            </>
          )
        }
      >
        {tracePackage && (
          <div className="space-y-6">
            {/* 器械包基本信息 */}
            <div className="rounded-xl bg-neutral-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-neutral-800">
                    {tracePackage.name}
                  </h4>
                  <p className="mt-1 text-sm text-neutral-500">
                    条码：{tracePackage.barcode}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tracePackage.instruments.map((inst, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-white px-2 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
                <StatusBadge status={tracePackage.status} />
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

                        {Object.keys(event.details).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 rounded bg-neutral-50 px-2 py-1.5"
                              >
                                <span className="text-neutral-500">
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
                                    : key === 'borrower'
                                    ? '借出人'
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
