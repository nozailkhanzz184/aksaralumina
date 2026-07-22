import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Clock, Upload, ShieldCheck, Zap } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { account } from '../lib/appwrite';
import { toast } from 'sonner';

export const SubscriptionCard = ({ user }: { user: any }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [txId, setTxId] = useState('');
  
  const prefs = user?.prefs || {};
  const proStatus = prefs.proStatus || 'free'; // 'free', 'pending', 'pro'
  
  const handleUpgrade = () => {
    setStep('payment');
  };
  
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim()) {
      toast.error('Masukkan bukti atau ID transaksi');
      return;
    }
    
    setLoading(true);
    try {
      await account.updatePrefs({
        ...prefs,
        proStatus: 'pending',
        paymentProof: txId,
        submittedAt: new Date().toISOString()
      });
      toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi.');
      // Refresh window or state slightly not robust, but okay for this prototype
      window.location.reload();
    } catch (err: any) {
      toast.error('Gagal mengirim bukti: ' + err.message);
    } finally {
      setLoading(false);
    }
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
              <span>Akses ke <strong>Model AI Premium</strong> (GPT-4, Claude 3)</span>
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
            <p className="text-sm text-neutral-600 mb-2">Silakan transfer <strong>Rp 5.000</strong> ke salah satu rekening/dompet berikut:</p>
            <ul className="text-sm font-medium text-neutral-800 space-y-2 mb-3">
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">GoPay / OVO / Dana</span>
                <span>0812-3456-7890</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">BCA</span>
                <span>1234567890 a.n Nozail Khan</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Crypto (USDT/USDC - Base)</span>
                <span className="truncate max-w-[120px]" title="0x1234567890abcdef1234567890abcdef12345678">0x1234...5678</span>
              </li>
            </ul>
            <p className="text-xs text-neutral-500 flex items-start gap-1">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
              Pembayaran manual menjamin keamanan 100% tanpa potongan pihak ketiga.
            </p>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
                ID Transaksi / Bukti Pembayaran
              </label>
              <input
                type="text"
                required
                value={txId}
                onChange={e => setTxId(e.target.value)}
                placeholder="Mis: Referensi BCA, Link gambar, atau TxHash"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="flex-1 bg-white border border-neutral-200 text-neutral-700 font-medium py-2.5 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Upload className="animate-bounce" size={18} /> : <CheckCircle2 size={18} />}
                Kirim Bukti
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
