import { useState } from 'react';
import {
  Plus,
  Thermometer,
  Gauge,
  Clock,
  Check,
  UserCheck,
  Package,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { formatDateTime, generateBatchNo } from '@/utils/date';
import { STERILIZATION_METHOD_LABELS, SterilizationMethod } from '@/types';

export default function SterilizationRelease() {
  const batches = useAppStore((state) => state.sterilizationBatches);
  const packages = useAppStore((state) => state.packages);
  const addSterilizationBatch = useAppStore((state) => state.addSterilizationBatch);
  const completeSterilization = useAppStore((state) => state.completeSterilization);
  const releaseBatch = useAppStore((state) => state.releaseBatch);
  const currentUser = useAppStore((state) => state.currentUser);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<typeof batches[0] | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaser1, setReleaser1] = useState('');
  const [releaser2, setReleaser2] = useState('');

  const [formData, setFormData] = useState({
    batchNo: generateBatchNo(),
    sterilizer: '灭菌器A',
    sterilizationMethod: 'pressure_steam' as SterilizationMethod,
    temperature: 134,
    pressure: 210,
    duration: 30,
    validDays: 14,
    selectedPackageIds: [] as string[],
  });

  const cleanedPackages = packages.filter((p) => p.status === 'cleaned');

  const handleCreateBatch = () => {
    if (formData.selectedPackageIds.length === 0) {
      alert('请至少选择一个器械包');
      return;
    }

    addSterilizationBatch({
      batchNo: formData.batchNo,
      sterilizer: formData.sterilizer,
      sterilizationMethod: formData.sterilizationMethod,
      params: {
        temperature: formData.temperature,
        pressure: formData.pressure,
        duration: formData.duration,
      },
      biologicalTest: 'pending',
      packageIds: formData.selectedPackageIds,
      operator: currentUser,
      validDays: formData.validDays,
    });

    setShowCreateModal(false);
    setFormData({
      batchNo: generateBatchNo(),
      sterilizer: '灭菌器A',
      sterilizationMethod: 'pressure_steam',
      temperature: 134,
      pressure: 210,
      duration: 30,
      validDays: 14,
      selectedPackageIds: [],
    });
  };

  const togglePackage = (pkgId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPackageIds: prev.selectedPackageIds.includes(pkgId)
        ? prev.selectedPackageIds.filter((id) => id !== pkgId)
        : [...prev.selectedPackageIds, pkgId],
    }));
  };

  const handleComplete = (batchId: string, passed: boolean) => {
    completeSterilization(batchId, passed ? 'passed' : 'failed');
  };

  const handleRelease = () => {
    if (!selectedBatch) return;
    if (!releaser1 || !releaser2) {
      alert('请填写两位放行人员');
      return;
    }
    releaseBatch(selectedBatch.id, releaser1, releaser2);
    setShowReleaseModal(false);
    setSelectedBatch(null);
    setReleaser1('');
    setReleaser2('');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      running: '运行中',
      completed: '已完成',
      released: '已放行',
      failed: '失败',
    };
    return labels[status] || status;
  };

  const getBatchPackages = (batch: typeof batches[0]) => {
    return packages.filter((p) => batch.packageIds.includes(p.id));
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">灭菌放行管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            灭菌批次管理、参数记录、双人放行确认
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-primary-200 hover:bg-primary-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          新建灭菌批次
        </button>
      </div>

      {/* 批次列表 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => {
          const batchPackages = getBatchPackages(batch);
          const canRelease =
            batch.status === 'completed' && batch.biologicalTest === 'passed';

          return (
            <div
              key={batch.id}
              className="rounded-xl bg-white shadow-card transition-all hover:shadow-card-hover"
            >
              {/* 批次头部 */}
              <div className="border-b border-neutral-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-800">{batch.batchNo}</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {batch.sterilizer} · {STERILIZATION_METHOD_LABELS[batch.sterilizationMethod]}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      batch.status === 'running'
                        ? 'bg-primary-100 text-primary-700'
                        : batch.status === 'completed'
                        ? 'bg-success-100 text-success-700'
                        : batch.status === 'released'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        batch.status === 'running'
                          ? 'bg-primary-500 animate-pulse'
                          : batch.status === 'released' || batch.status === 'completed'
                          ? 'bg-success-500'
                          : 'bg-danger-500'
                      }`}
                    />
                    {getStatusLabel(batch.status)}
                  </span>
                </div>
              </div>

              {/* 参数 */}
              <div className="grid grid-cols-3 gap-2 border-b border-neutral-50 px-5 py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary-500">
                    <Thermometer className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-lg font-bold text-neutral-800">
                    {batch.params.temperature}
                  </p>
                  <p className="text-xs text-neutral-500">℃</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary-500">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-lg font-bold text-neutral-800">
                    {batch.params.pressure}
                  </p>
                  <p className="text-xs text-neutral-500">kPa</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="mt-1 text-lg font-bold text-neutral-800">
                    {batch.params.duration}
                  </p>
                  <p className="text-xs text-neutral-500">分钟</p>
                </div>
              </div>

              {/* 包数量 */}
              <div className="px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">器械包数量</span>
                  <span className="font-medium text-neutral-800">
                    {batch.packageIds.length} 个
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {batchPackages.slice(0, 3).map((pkg) => (
                    <span
                      key={pkg.id}
                      className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                    >
                      {pkg.name}
                    </span>
                  ))}
                  {batchPackages.length > 3 && (
                    <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      +{batchPackages.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* 生物监测 */}
              <div className="border-t border-neutral-50 px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">生物监测</span>
                  <span
                    className={`font-medium ${
                      batch.biologicalTest === 'passed'
                        ? 'text-success-600'
                        : batch.biologicalTest === 'failed'
                        ? 'text-danger-600'
                        : 'text-warning-600'
                    }`}
                  >
                    {batch.biologicalTest === 'passed'
                      ? '合格'
                      : batch.biologicalTest === 'failed'
                      ? '不合格'
                      : '待检测'}
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 border-t border-neutral-100 p-4">
                {batch.status === 'running' && (
                  <>
                    <button
                      onClick={() => handleComplete(batch.id, true)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success-500 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      灭菌合格
                    </button>
                    <button
                      onClick={() => handleComplete(batch.id, false)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-danger-200 bg-danger-50 py-2 text-sm font-medium text-danger-600 hover:bg-danger-100 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      灭菌失败
                    </button>
                  </>
                )}
                {canRelease && (
                  <button
                    onClick={() => {
                      setSelectedBatch(batch);
                      setShowReleaseModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-500 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                  >
                    <UserCheck className="h-4 w-4" />
                    双人放行
                  </button>
                )}
                {batch.status === 'released' && (
                  <div className="w-full text-center">
                    <p className="text-xs text-neutral-500">
                      放行人：{batch.releaser1} + {batch.releaser2}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {batch.releaseTime && formatDateTime(batch.releaseTime)}
                    </p>
                  </div>
                )}
                {batch.status === 'failed' && (
                  <div className="w-full text-center">
                    <p className="text-xs text-danger-500">灭菌失败，请异常处理</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 新建批次弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建灭菌批次"
        size="xl"
        footer={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateBatch}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              开始灭菌
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                批次编号
              </label>
              <input
                type="text"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                灭菌器
              </label>
              <select
                value={formData.sterilizer}
                onChange={(e) => setFormData({ ...formData, sterilizer: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="灭菌器A">灭菌器A</option>
                <option value="灭菌器B">灭菌器B</option>
                <option value="灭菌器C">灭菌器C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              灭菌方式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.keys(STERILIZATION_METHOD_LABELS) as SterilizationMethod[]
              ).map((method) => (
                <button
                  key={method}
                  onClick={() => setFormData({ ...formData, sterilizationMethod: method })}
                  className={`rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                    formData.sterilizationMethod === method
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {STERILIZATION_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                温度 (℃)
              </label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                压力 (kPa)
              </label>
              <input
                type="number"
                value={formData.pressure}
                onChange={(e) =>
                  setFormData({ ...formData, pressure: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                时长 (分钟)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              有效期 (天)
            </label>
            <input
              type="number"
              value={formData.validDays}
              onChange={(e) =>
                setFormData({ ...formData, validDays: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">
                选择器械包
              </label>
              <span className="text-xs text-neutral-500">
                已选 {formData.selectedPackageIds.length} 个
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
              {cleanedPackages.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {cleanedPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => togglePackage(pkg.id)}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                        formData.selectedPackageIds.includes(pkg.id)
                          ? 'bg-primary-50'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                          formData.selectedPackageIds.includes(pkg.id)
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-neutral-300'
                        }`}
                      >
                        {formData.selectedPackageIds.includes(pkg.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-800">{pkg.name}</p>
                        <p className="text-xs text-neutral-500">{pkg.barcode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500">暂无可灭菌的器械包</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 双人放行弹窗 */}
      <Modal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        title="双人放行确认"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowReleaseModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRelease}
              className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
            >
              确认放行
            </button>
          </>
        }
      >
        {selectedBatch && (
          <div className="space-y-4">
            <div className="rounded-lg bg-success-50 p-4">
              <p className="text-sm font-medium text-success-700">
                批次 {selectedBatch.batchNo} 灭菌合格，准备放行
              </p>
              <p className="mt-1 text-xs text-success-600">
                共 {selectedBatch.packageIds.length} 个器械包，有效期 {selectedBatch.validDays} 天
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700">
                  <Users className="h-4 w-4" />
                  第一放行人人
                </label>
                <input
                  type="text"
                  value={releaser1}
                  onChange={(e) => setReleaser1(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700">
                  <Users className="h-4 w-4" />
                  第二放行人人
                </label>
                <input
                  type="text"
                  value={releaser2}
                  onChange={(e) => setReleaser2(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">
                操作人：<span className="font-medium text-neutral-700">{currentUser}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                放行时间：<span className="font-medium text-neutral-700">
                  {formatDateTime(new Date())}
                </span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
