import { useState } from 'react';
import {
  Scan,
  Plus,
  Check,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Thermometer,
  Droplets,
  Timer,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@/utils/date';
import { CLEANING_STEP_LABELS, CleaningSteps } from '@/types';

export default function CleaningRegister() {
  const packages = useAppStore((state) => state.packages);
  const cleaningRecords = useAppStore((state) => state.cleaningRecords);
  const addCleaningRecord = useAppStore((state) => state.addCleaningRecord);
  const updateCleaningSteps = useAppStore((state) => state.updateCleaningSteps);
  const updateCleaningParams = useAppStore((state) => state.updateCleaningParams);
  const completeQualityCheck = useAppStore((state) => state.completeQualityCheck);
  const updatePackageStatus = useAppStore((state) => state.updatePackageStatus);
  const currentUser = useAppStore((state) => state.currentUser);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [patientName, setPatientName] = useState('');
  const [chairNumber, setChairNumber] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<typeof cleaningRecords[0] | null>(null);
  const [showQcModal, setShowQcModal] = useState(false);
  const [qcPassed, setQcPassed] = useState(true);
  const [qcRemark, setQcRemark] = useState('');

  const recycledPackages = packages.filter((p) => p.status === 'recycled');
  const cleaningPackages = packages.filter((p) => p.status === 'cleaning');

  const handleScan = () => {
    const pkg = packages.find((p) => p.barcode === barcodeInput.trim());
    if (!pkg) {
      alert('未找到该条码的器械包');
      return;
    }
    if (pkg.status !== 'in_use' && pkg.status !== 'recycled') {
      alert('该器械包状态不支持回收登记');
      return;
    }

    const existingRecord = cleaningRecords.find(
      (r) => r.packageId === pkg.id && !r.qualityCheck
    );
    if (existingRecord) {
      setSelectedRecord(existingRecord);
      setBarcodeInput('');
      return;
    }

    const newRecord: Parameters<typeof addCleaningRecord>[0] = {
      packageId: pkg.id,
      packageBarcode: pkg.barcode,
      packageName: pkg.name,
      recycleTime: new Date().toISOString(),
      patientName: patientName || '未登记',
      chairNumber: chairNumber || '未登记',
      steps: {
        initialWash: false,
        enzymeWash: false,
        rinse: false,
        finalRinse: false,
        disinfection: false,
        drying: false,
      },
      params: {
        enzymeConcentration: 1000,
        washTemperature: 40,
        washTime: 15,
        disinfectionTemp: 90,
        disinfectionTime: 5,
      },
      qualityCheck: null,
      operator: currentUser,
    };

    const createdRecord = addCleaningRecord(newRecord);
    updatePackageStatus(pkg.id, 'cleaning');
    setSelectedRecord(createdRecord);

    setBarcodeInput('');
    setPatientName('');
    setChairNumber('');
  };

  const toggleStep = (step: keyof CleaningSteps) => {
    if (!selectedRecord) return;
    const newValue = !selectedRecord.steps[step];
    updateCleaningSteps(selectedRecord.id, { [step]: newValue });
    setSelectedRecord({
      ...selectedRecord,
      steps: { ...selectedRecord.steps, [step]: newValue },
    });
  };

  const updateParam = (key: string, value: number) => {
    if (!selectedRecord) return;
    updateCleaningParams(selectedRecord.id, { [key]: value });
    setSelectedRecord({
      ...selectedRecord,
      params: { ...selectedRecord.params, [key]: value },
    });
  };

  const handleQcSubmit = () => {
    if (!selectedRecord) return;
    completeQualityCheck(selectedRecord.id, qcPassed, currentUser, qcRemark);
    setShowQcModal(false);
    setSelectedRecord(null);
    setQcPassed(true);
    setQcRemark('');
  };

  const allStepsCompleted = selectedRecord
    ? Object.values(selectedRecord.steps).every(Boolean)
    : false;

  const stepKeys = Object.keys(CLEANING_STEP_LABELS) as (keyof CleaningSteps)[];
  const completedCount = selectedRecord
    ? Object.values(selectedRecord.steps).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：回收扫码区 */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-800">回收扫码登记</h2>
            <p className="mt-1 text-sm text-neutral-500">扫码快速登记回收的器械包</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  条码编号
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="扫描或输入条码"
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    onClick={handleScan}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                  >
                    <Scan className="h-4 w-4" />
                    扫描
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    患者姓名
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="可选"
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    椅位
                  </label>
                  <input
                    type="text"
                    value={chairNumber}
                    onChange={(e) => setChairNumber(e.target.value)}
                    placeholder="如：1号椅位"
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 待清洗列表 */}
          <div className="rounded-xl bg-white shadow-card">
            <div className="border-b border-neutral-100 px-5 py-4">
              <h3 className="font-medium text-neutral-800">清洗中列表</h3>
              <p className="mt-0.5 text-sm text-neutral-500">
                共 {cleaningRecords.filter((r) => !r.qualityCheck).length} 个待清洗
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {cleaningRecords
                .filter((r) => !r.qualityCheck)
                .map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`flex cursor-pointer items-center justify-between border-b border-neutral-50 px-5 py-3 transition-colors hover:bg-neutral-50 ${
                      selectedRecord?.id === record.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-neutral-800">{record.packageName}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {record.packageBarcode}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">
                        {Object.values(record.steps).filter(Boolean).length}/6步
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {formatDateTime(record.recycleTime)}
                      </div>
                    </div>
                  </div>
                ))}
              {cleaningRecords.filter((r) => !r.qualityCheck).length === 0 && (
                <div className="py-8 text-center">
                  <div className="text-3xl">✨</div>
                  <p className="mt-2 text-sm text-neutral-500">暂无待清洗器械包</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：清洗操作区 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRecord ? (
            <>
              {/* 器械包信息 */}
              <div className="rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-800">
                      {selectedRecord.packageName}
                    </h2>
                    <p className="mt-1 font-mono text-sm text-neutral-500">
                      {selectedRecord.packageBarcode}
                    </p>
                  </div>
                  <StatusBadge status="cleaning" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      患者：{selectedRecord.patientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      椅位：{selectedRecord.chairNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      回收：{formatDateTime(selectedRecord.recycleTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 清洗步骤 */}
              <div className="rounded-xl bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-800">清洗消毒步骤</h3>
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                    {completedCount}/6 完成
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  {stepKeys.map((step, index) => {
                    const isCompleted = selectedRecord.steps[step];
                    return (
                      <button
                        key={step}
                        onClick={() => toggleStep(step)}
                        className={`relative flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
                          isCompleted
                            ? 'border-success-500 bg-success-50'
                            : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        {isCompleted && (
                          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`text-2xl ${
                            isCompleted ? 'text-success-500' : 'text-neutral-400'
                          }`}
                        >
                          {['🧴', '🧪', '💧', '🚿', '☀️', '💨'][index]}
                        </div>
                        <span
                          className={`mt-2 text-sm font-medium ${
                            isCompleted ? 'text-success-700' : 'text-neutral-600'
                          }`}
                        >
                          {CLEANING_STEP_LABELS[step]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 关键参数 */}
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h3 className="text-lg font-semibold text-neutral-800">关键参数</h3>
                <p className="mt-1 text-sm text-neutral-500">记录清洗消毒关键参数</p>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm text-neutral-600">
                      <Droplets className="h-3.5 w-3.5" />
                      酶液浓度
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={selectedRecord.params.enzymeConcentration}
                        onChange={(e) =>
                          updateParam('enzymeConcentration', Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                      <span className="ml-1 text-sm text-neutral-500">mg/L</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm text-neutral-600">
                      <Thermometer className="h-3.5 w-3.5" />
                      清洗温度
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={selectedRecord.params.washTemperature}
                        onChange={(e) =>
                          updateParam('washTemperature', Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                      <span className="ml-1 text-sm text-neutral-500">℃</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm text-neutral-600">
                      <Timer className="h-3.5 w-3.5" />
                      清洗时间
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={selectedRecord.params.washTime}
                        onChange={(e) => updateParam('washTime', Number(e.target.value))}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                      <span className="ml-1 text-sm text-neutral-500">分钟</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm text-neutral-600">
                      <Thermometer className="h-3.5 w-3.5" />
                      消毒温度
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={selectedRecord.params.disinfectionTemp}
                        onChange={(e) =>
                          updateParam('disinfectionTemp', Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                      <span className="ml-1 text-sm text-neutral-500">℃</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm text-neutral-600">
                      <Timer className="h-3.5 w-3.5" />
                      消毒时间
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={selectedRecord.params.disinfectionTime}
                        onChange={(e) =>
                          updateParam('disinfectionTime', Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                      <span className="ml-1 text-sm text-neutral-500">分钟</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 质检按钮 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                  }}
                  className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  取消选择
                </button>
                <button
                  onClick={() => setShowQcModal(true)}
                  disabled={!allStepsCompleted}
                  className="flex items-center gap-2 rounded-lg bg-success-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-success-200 hover:bg-success-600 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  质量检查
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl bg-white shadow-card">
              <div className="text-6xl">🧼</div>
              <h3 className="mt-4 text-lg font-medium text-neutral-800">选择清洗中的器械包</h3>
              <p className="mt-2 text-sm text-neutral-500">
                从左侧列表选择或扫描条码开始清洗登记
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 质检弹窗 */}
      <Modal
        isOpen={showQcModal}
        onClose={() => setShowQcModal(false)}
        title="清洗质量检查"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowQcModal(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleQcSubmit}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                qcPassed
                  ? 'bg-success-500 hover:bg-success-600'
                  : 'bg-danger-500 hover:bg-danger-600'
              }`}
            >
              确认检查结果
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setQcPassed(true)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-4 transition-all ${
                qcPassed
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">质检合格</span>
            </button>
            <button
              onClick={() => setQcPassed(false)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-4 transition-all ${
                !qcPassed
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <XCircle className="h-5 w-5" />
              <span className="font-medium">质检不合格</span>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              检查备注
            </label>
            <textarea
              value={qcRemark}
              onChange={(e) => setQcRemark(e.target.value)}
              placeholder="填写检查备注..."
              rows={3}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-sm text-neutral-600">
              检查人：<span className="font-medium text-neutral-800">{currentUser}</span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
