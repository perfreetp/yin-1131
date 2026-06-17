import { useState } from 'react';
import { Plus, Search, Filter, Barcode, Edit2, Trash2, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { formatDateTime, generateBarcode } from '@/utils/date';
import { PackageStatus } from '@/types';

const statusOptions: { value: PackageStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'in_use', label: '使用中' },
  { value: 'recycled', label: '已回收' },
  { value: 'cleaning', label: '清洗中' },
  { value: 'cleaned', label: '已清洗' },
  { value: 'sterilizing', label: '灭菌中' },
  { value: 'sterilized', label: '已灭菌' },
  { value: 'expired', label: '已过期' },
  { value: 'abnormal', label: '异常' },
];

export default function PackageLedger() {
  const packages = useAppStore((state) => state.packages);
  const addPackage = useAppStore((state) => state.addPackage);
  const updatePackage = useAppStore((state) => state.updatePackage);
  const currentUser = useAppStore((state) => state.currentUser);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<typeof packages[0] | null>(null);
  const [viewingPackage, setViewingPackage] = useState<typeof packages[0] | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: generateBarcode(),
    instruments: '' as string | string[],
  });

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.includes(searchTerm) ||
      pkg.barcode.includes(searchTerm) ||
      pkg.instruments.some((inst) => inst.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: packages.length,
    in_use: packages.filter((p) => p.status === 'in_use').length,
    cleaning: packages.filter((p) => p.status === 'cleaning' || p.status === 'recycled').length,
    sterilizing: packages.filter((p) => p.status === 'sterilizing' || p.status === 'cleaned').length,
    sterilized: packages.filter((p) => p.status === 'sterilized').length,
    abnormal: packages.filter((p) => p.status === 'abnormal' || p.status === 'expired').length,
  };

  const openAddModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      barcode: generateBarcode(),
      instruments: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: typeof packages[0]) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      barcode: pkg.barcode,
      instruments: pkg.instruments.join('\n'),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const instrumentsArray = Array.isArray(formData.instruments)
      ? formData.instruments
      : formData.instruments.split('\n').map((s) => s.trim()).filter(Boolean);

    if (editingPackage) {
      updatePackage(editingPackage.id, {
        name: formData.name,
        barcode: formData.barcode,
        instruments: instrumentsArray,
      });
    } else {
      addPackage({
        name: formData.name,
        barcode: formData.barcode,
        instruments: instrumentsArray,
        sterilizationExpireAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const statCards = [
    { label: '器械包总数', value: statusCounts.total, color: 'primary', icon: '📦' },
    { label: '使用中', value: statusCounts.in_use, color: 'warning', icon: '⚡' },
    { label: '清洗消毒中', value: statusCounts.cleaning, color: 'primary', icon: '💧' },
    { label: '灭菌中', value: statusCounts.sterilizing, color: 'primary', icon: '🔥' },
    { label: '无菌库存', value: statusCounts.sterilized, color: 'success', icon: '✅' },
    { label: '异常/过期', value: statusCounts.abnormal, color: 'danger', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-4 shadow-card transition-all hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <div className={`h-2 w-2 rounded-full ${
                card.color === 'primary' ? 'bg-primary-500' :
                card.color === 'success' ? 'bg-success-500' :
                card.color === 'warning' ? 'bg-warning-500' :
                'bg-danger-500'
              }`} />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-neutral-800">{card.value}</div>
              <div className="mt-1 text-sm text-neutral-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索器械包名称、条码、器械..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PackageStatus | 'all')}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary-200 hover:bg-primary-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          新增器械包
        </button>
      </div>

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  条码编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  器械包名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  包内器械
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  最近使用
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  有效期至
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-primary-500" />
                      <span className="font-mono text-sm text-neutral-700">{pkg.barcode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-800">{pkg.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pkg.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm text-neutral-500">
                      {pkg.instruments.join('、')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {pkg.lastUsedAt ? formatDateTime(pkg.lastUsedAt) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {pkg.sterilizationExpireAt
                      ? formatDateTime(pkg.sterilizationExpireAt)
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingPackage(pkg)}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                        title="查看"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPackages.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-4xl">📦</div>
            <p className="mt-3 text-sm text-neutral-500">暂无器械包数据</p>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? '编辑器械包' : '新增器械包'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              器械包名称 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：基础治疗包、拔牙器械包"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              条码编号
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <button
                onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                自动生成
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              包内器械清单
            </label>
            <textarea
              value={Array.isArray(formData.instruments) ? formData.instruments.join('\n') : formData.instruments}
              onChange={(e) => setFormData({ ...formData, instruments: e.target.value })}
              placeholder="每行一件器械，如：&#10;口镜&#10;探针&#10;镊子"
              rows={6}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <p className="mt-1 text-xs text-neutral-400">每行输入一件器械名称</p>
          </div>
        </div>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        isOpen={!!viewingPackage}
        onClose={() => setViewingPackage(null)}
        title="器械包详情"
        size="lg"
      >
        {viewingPackage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">条码编号</p>
                <p className="mt-1 font-mono font-medium text-neutral-800">
                  {viewingPackage.barcode}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">当前状态</p>
                <div className="mt-1">
                  <StatusBadge status={viewingPackage.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">建档时间</p>
                <p className="mt-1 text-sm text-neutral-800">
                  {formatDateTime(viewingPackage.createTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">最近使用</p>
                <p className="mt-1 text-sm text-neutral-800">
                  {viewingPackage.lastUsedAt
                    ? formatDateTime(viewingPackage.lastUsedAt)
                    : '-'}
                </p>
              </div>
              {viewingPackage.currentPatient && (
                <div>
                  <p className="text-sm text-neutral-500">当前患者</p>
                  <p className="mt-1 text-sm text-neutral-800">
                    {viewingPackage.currentPatient}
                  </p>
                </div>
              )}
              {viewingPackage.currentChair && (
                <div>
                  <p className="text-sm text-neutral-500">当前椅位</p>
                  <p className="mt-1 text-sm text-neutral-800">
                    {viewingPackage.currentChair}
                  </p>
                </div>
              )}
              {viewingPackage.sterilizationExpireAt && (
                <div className="col-span-2">
                  <p className="text-sm text-neutral-500">无菌有效期至</p>
                  <p className="mt-1 text-sm text-neutral-800">
                    {formatDateTime(viewingPackage.sterilizationExpireAt)}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-neutral-500">包内器械（{viewingPackage.instruments.length}件）</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {viewingPackage.instruments.map((inst, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
