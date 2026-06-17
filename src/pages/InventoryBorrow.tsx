import { useState } from 'react';
import {
  PackageOpen,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ArrowRightLeft,
  PlayCircle,
  User,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { formatDateTime, getDaysUntilExpire, isNearExpiry, isExpired } from '@/utils/date';

export default function InventoryBorrow() {
  const packages = useAppStore((state) => state.packages);
  const borrowRecords = useAppStore((state) => state.borrowRecords);
  const addUsageRecord = useAppStore((state) => state.addUsageRecord);
  const addBorrowRecord = useAppStore((state) => state.addBorrowRecord);
  const returnBorrow = useAppStore((state) => state.returnBorrow);
  const getSterileInventory = useAppStore((state) => state.getSterileInventory);
  const getNearExpiryPackages = useAppStore((state) => state.getNearExpiryPackages);
  const getExpiredPackages = useAppStore((state) => state.getExpiredPackages);
  const isPackageBorrowed = useAppStore((state) => state.isPackageBorrowed);
  const currentUser = useAppStore((state) => state.currentUser);

  const [activeTab, setActiveTab] = useState<'inventory' | 'borrow'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUseModal, setShowUseModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof packages[0] | null>(null);

  const [useForm, setUseForm] = useState({
    patientName: '',
    patientId: '',
    chairNumber: '',
    doctor: '',
  });

  const [borrowForm, setBorrowForm] = useState({
    borrower: '',
    remark: '',
  });

  const sterileInventory = getSterileInventory();
  const nearExpiryPackages = getNearExpiryPackages();
  const expiredPackages = getExpiredPackages();

  const filteredInventory = sterileInventory.filter(
    (pkg) =>
      pkg.name.includes(searchTerm) ||
      pkg.barcode.includes(searchTerm) ||
      pkg.instruments.some((inst) => inst.includes(searchTerm))
  );

  const handleOpenUse = (pkg: typeof packages[0]) => {
    setSelectedPackage(pkg);
    setUseForm({ patientName: '', patientId: '', chairNumber: '', doctor: '' });
    setShowUseModal(true);
  };

  const handleUseSubmit = () => {
    if (!selectedPackage) return;
    if (!useForm.patientName || !useForm.chairNumber || !useForm.doctor) {
      alert('请填写患者姓名、椅位和医生');
      return;
    }

    addUsageRecord({
      packageId: selectedPackage.id,
      packageBarcode: selectedPackage.barcode,
      packageName: selectedPackage.name,
      patientName: useForm.patientName,
      patientId: useForm.patientId || undefined,
      chairNumber: useForm.chairNumber,
      doctor: useForm.doctor,
      openTime: new Date().toISOString(),
    });

    setShowUseModal(false);
    setSelectedPackage(null);
    setUseForm({ patientName: '', patientId: '', chairNumber: '', doctor: '' });
  };

  const handleOpenBorrow = (pkg: typeof packages[0]) => {
    if (isPackageBorrowed(pkg.id)) {
      alert('该器械包已被借出，无法重复借出');
      return;
    }
    setSelectedPackage(pkg);
    setBorrowForm({ borrower: '', remark: '' });
    setShowBorrowModal(true);
  };

  const handleBorrowSubmit = () => {
    if (!selectedPackage) return;
    if (!borrowForm.borrower) {
      alert('请填写借出人/单位');
      return;
    }
    if (isPackageBorrowed(selectedPackage.id)) {
      alert('该器械包已被借出，无法重复借出');
      return;
    }

    addBorrowRecord({
      packageId: selectedPackage.id,
      packageBarcode: selectedPackage.barcode,
      packageName: selectedPackage.name,
      borrower: borrowForm.borrower,
      remark: borrowForm.remark || undefined,
    });

    setShowBorrowModal(false);
    setSelectedPackage(null);
    setBorrowForm({ borrower: '', remark: '' });
  };

  const handleReturn = (recordId: string) => {
    returnBorrow(recordId);
  };

  const getExpiryBadge = (expireAt?: string) => {
    if (!expireAt) return null;
    if (isExpired(expireAt)) {
      return <span className="rounded bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">已过期</span>;
    }
    if (isNearExpiry(expireAt)) {
      const days = getDaysUntilExpire(expireAt);
      return <span className="rounded bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">临期 {days}天</span>;
    }
    const days = getDaysUntilExpire(expireAt);
    return <span className="rounded bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">还有 {days}天</span>;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">无菌库存</p>
              <p className="mt-2 text-2xl font-bold text-success-600">
                {sterileInventory.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
              <PackageOpen className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">临期预警</p>
              <p className="mt-2 text-2xl font-bold text-warning-600">
                {nearExpiryPackages.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">已过期</p>
              <p className="mt-2 text-2xl font-bold text-danger-600">
                {expiredPackages.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
              <AlertTriangle className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">外借中</p>
              <p className="mt-2 text-2xl font-bold text-primary-600">
                {borrowRecords.filter((r) => r.status === 'borrowed').length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <ArrowRightLeft className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="rounded-xl bg-white shadow-card">
        <div className="flex border-b border-neutral-100 px-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            库存管理
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === 'borrow'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            借还记录
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="p-4">
            {/* 搜索 */}
            <div className="mb-4 flex items-center gap-3">
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
            </div>

            {/* 库存列表 */}
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      条码编号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      器械包名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      包内器械
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      有效期状态
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
                  {filteredInventory.map((pkg) => {
                    const expired = isExpired(pkg.sterilizationExpireAt || '');
                    const nearExpiry = isNearExpiry(pkg.sterilizationExpireAt || '');

                    return (
                      <tr
                        key={pkg.id}
                        className={`transition-colors hover:bg-neutral-50 ${
                          expired ? 'bg-danger-50' : nearExpiry ? 'bg-warning-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-sm text-neutral-700">
                          {pkg.barcode}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-neutral-800">{pkg.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate text-sm text-neutral-500">
                            {pkg.instruments.join('、')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getExpiryBadge(pkg.sterilizationExpireAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {pkg.sterilizationExpireAt
                            ? formatDateTime(pkg.sterilizationExpireAt)
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenUse(pkg)}
                              disabled={expired}
                              className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              开包使用
                            </button>
                            <button
                              onClick={() => handleOpenBorrow(pkg)}
                              disabled={expired}
                              className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                              借出
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-4xl">📦</div>
                  <p className="mt-3 text-sm text-neutral-500">暂无无菌库存</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'borrow' && (
          <div className="p-4">
            <div className="space-y-3">
              {borrowRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <ArrowRightLeft className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{record.packageName}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {record.packageBarcode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-neutral-500">借出人</p>
                      <p className="mt-1 text-sm font-medium text-neutral-800">
                        {record.borrower}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-500">借出时间</p>
                      <p className="mt-1 text-sm text-neutral-700">
                        {formatDateTime(record.borrowTime)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-500">状态</p>
                      <div className="mt-1">
                        <StatusBadge
                          status={record.status === 'borrowed' ? 'in_use' : 'sterilized'}
                          size="sm"
                        />
                      </div>
                    </div>
                    {record.status === 'borrowed' && (
                      <button
                        onClick={() => handleReturn(record.id)}
                        className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
                      >
                        确认归还
                      </button>
                    )}
                    {record.status === 'returned' && record.returnTime && (
                      <div className="text-center">
                        <p className="text-xs text-neutral-500">归还时间</p>
                        <p className="mt-1 text-sm text-neutral-700">
                          {formatDateTime(record.returnTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {borrowRecords.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-4xl">📋</div>
                  <p className="mt-3 text-sm text-neutral-500">暂无借还记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 开包使用弹窗 */}
      <Modal
        isOpen={showUseModal}
        onClose={() => setShowUseModal(false)}
        title="开包使用登记"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowUseModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUseSubmit}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              确认开包
            </button>
          </>
        }
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-3">
              <p className="text-sm font-medium text-primary-700">
                {selectedPackage.name}
              </p>
              <p className="mt-1 text-xs text-primary-600">
                {selectedPackage.barcode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  患者姓名 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={useForm.patientName}
                  onChange={(e) => setUseForm({ ...useForm, patientName: e.target.value })}
                  placeholder="请输入患者姓名"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  患者编号
                </label>
                <input
                  type="text"
                  value={useForm.patientId}
                  onChange={(e) => setUseForm({ ...useForm, patientId: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700">
                  <Stethoscope className="h-4 w-4" />
                  椅位 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={useForm.chairNumber}
                  onChange={(e) => setUseForm({ ...useForm, chairNumber: e.target.value })}
                  placeholder="如：1号椅位"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700">
                  <User className="h-4 w-4" />
                  医生 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={useForm.doctor}
                  onChange={(e) => setUseForm({ ...useForm, doctor: e.target.value })}
                  placeholder="请输入医生姓名"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">
                操作人：<span className="font-medium text-neutral-700">{currentUser}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                开包时间：<span className="font-medium text-neutral-700">
                  {formatDateTime(new Date())}
                </span>
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* 借出弹窗 */}
      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title="借出登记"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowBorrowModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBorrowSubmit}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              确认借出
            </button>
          </>
        }
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-3">
              <p className="text-sm font-medium text-primary-700">
                {selectedPackage.name}
              </p>
              <p className="mt-1 text-xs text-primary-600">
                {selectedPackage.barcode}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                借出人/单位 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={borrowForm.borrower}
                onChange={(e) => setBorrowForm({ ...borrowForm, borrower: e.target.value })}
                placeholder="请输入借出人或单位名称"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                备注
              </label>
              <textarea
                value={borrowForm.remark}
                onChange={(e) => setBorrowForm({ ...borrowForm, remark: e.target.value })}
                placeholder="可选，填写借用原因等"
                rows={3}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">
                操作人：<span className="font-medium text-neutral-700">{currentUser}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                借出时间：<span className="font-medium text-neutral-700">
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
