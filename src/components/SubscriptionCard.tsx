import React, { useState } from 'react';
import { Crown, CheckCircle2, Clock, Upload, ShieldCheck, Zap, Copy } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { account } from '../lib/appwrite';
import { toast } from 'sonner';

export const SubscriptionCard = ({ user }: { user: any }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [pastedUrl, setPastedUrl] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const prefs = user?.prefs || {};
  const proStatus = prefs.proStatus || 'free'; // 'free', 'pending', 'pro'
  
  const copyToClipboard = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Alamat ${name} disalin`);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error('Clipboard kosong atau tidak ada URL');
        return;
      }
      const url = text.trim();
      setPastedUrl(url);
      toast.success('URL berhasil ditempel. Klik URL untuk memvalidasi atau kirim.');
    } catch (err: any) {
      toast.error('Gagal mengakses clipboard: ' + (err.message || 'Izin ditolak'));
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pastedUrl) return;
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await account.updatePrefs({
        ...prefs,
        proStatus: 'pending',
        paymentProof: pastedUrl,
        submittedAt: new Date().toISOString()
      });
      toast.success('Bukti URL berhasil dikirim. Menunggu verifikasi.');
      window.location.reload();
    } catch (err: any) {
      toast.error('Gagal mengirim bukti: ' + err.message);
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    setStep('payment');
  };

  if (!user) {
    return (
      <div className="bg-neutral-50 text-neutral-500 p-6 rounded-2xl border border-neutral-100 text-center">
        Silakan masuk (login) terlebih dahulu untuk mengelola langganan Anda.
      </div>
    );
  }

  if (proStatus === 'pending') {
    return (
      <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
        <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
          <Clock size={32} />
        </div>
        <h3 className="font-bold text-lg mb-1">Menunggu Verifikasi</h3>
        <p className="text-sm opacity-90">
          Bukti pembayaran Anda sedang kami verifikasi. Proses ini biasanya memakan waktu 1-24 jam.
        </p>
      </div>
    );
  }

  if (proStatus === 'pro') {
    return (
      <div className="bg-gradient-to-br from-amber-100 to-yellow-200 text-yellow-900 p-6 rounded-2xl border border-yellow-300 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-6 -right-6 text-yellow-400 opacity-20">
          <Crown size={120} />
        </div>
        <div className="bg-yellow-100 p-3 rounded-full mb-3 text-yellow-600 relative z-10 shadow-sm">
          <Crown size={32} />
        </div>
        <h3 className="font-bold text-xl mb-1 relative z-10">PRO Aktif</h3>
        <p className="text-sm opacity-90 relative z-10">
          Terima kasih! Anda kini menikmati semua fitur premium.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 p-1 rounded-2xl shadow-sm">
      {step === 'info' ? (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-lg">Tingkatkan ke PRO</h3>
              <p className="text-sm text-neutral-500">Rp 5.000 / minggu</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Tanpa Batas</strong> Penyimpanan Cloud</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Akses ke <strong>Model AI Premium</strong></span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Prioritas Sinkronisasi</strong> & Pencadangan Otomatis</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Mendukung pengembangan aplikasi ini</span>
            </div>
          </div>
          
          <button
            onClick={handleUpgrade}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 rounded-xl transition-transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          >
            <Zap size={18} className="text-amber-400" />
            Berlangganan Sekarang
          </button>
        </div>
      ) : (
        <div className="p-5">
          <h3 className="font-bold text-neutral-900 text-lg mb-4 border-b border-neutral-100 pb-3">Selesaikan Pembayaran</h3>
          
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-5">
            <p className="text-sm text-neutral-600 mb-2">Silakan transfer <strong>Rp 5.000</strong> ke alamat Crypto berikut:</p>
            
            <div className="mt-2 mb-3">
              <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Crypto (Pilih Jaringan)</p>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-neutral-200 rounded-lg p-2.5 gap-2">
                  <div>
                    <div className="text-sm font-medium text-neutral-800">USDT / USDC / ETH</div>
                    <div className="text-xs text-neutral-500">Base / BSC / Polygon / Optimism / Arbitrum</div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-neutral-500 font-mono truncate w-[100px]" title="0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825">0x0b90...C825</span>
                    <button type="button" onClick={() => copyToClipboard('0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825', 'EVM Crypto')} className="p-1.5 bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors" title="Salin alamat EVM">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 flex items-start gap-1">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
              Pembayaran manual menjamin keamanan 100% tanpa potongan pihak ketiga.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-neutral-600">
              Salin URL transaksi/eksplorer dari dompet Anda, lalu klik tombol di bawah:
            </p>

            {pastedUrl ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1 uppercase tracking-wider">
                    Klik untuk Validasi:
                  </label>
                  <a
                    href={pastedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono text-blue-700 underline truncate hover:bg-blue-100 transition-colors shadow-sm"
                    title="Klik untuk membuka link eksplorer dan memvalidasi"
                  >
                    {pastedUrl}
                  </a>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePasteUrl}
                    className="flex-1 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium py-2 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    Tempel Ulang
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleConfirmSubmit}
                    className="flex-[2] bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium py-2 px-3 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {loading ? <Upload className="animate-bounce" size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                    Konfirmasi & Kirim
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex-1 bg-white border border-neutral-200 text-neutral-700 font-medium py-2.5 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handlePasteUrl}
                  className="flex-[2] bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  <Upload size={18} className="text-amber-400" />
                  Tempel URL
                </button>
              </div>
                        )}
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-100 space-y-4">
            <h4 className="font-bold text-neutral-900 text-lg">Konfirmasi Pengiriman</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Apakah Anda yakin ingin mengirim URL eksplorer ini sebagai bukti pembayaran? Pastikan URL sudah benar.
            </p>
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
              <span className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">URL:</span>
              <span className="text-xs font-mono text-neutral-800 break-all">{pastedUrl}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-white border border-neutral-200 text-neutral-700 text-xs font-medium py-2.5 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteSubmit}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium py-2.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading ? <Upload className="animate-bounce" size={14} /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
