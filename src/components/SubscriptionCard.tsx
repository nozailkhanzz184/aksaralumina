import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Clock, Upload, ShieldCheck, Zap, Copy, QrCode } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { account } from '../lib/appwrite';
import { toast } from 'sonner';

export const SubscriptionCard = ({ user }: { user: any }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [txId, setTxId] = useState('');
  const [showQRIS, setShowQRIS] = useState(false);
  
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
              <li className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-500">GoPay / Shopeepay</span>
                <div className="flex items-center gap-2">
                  <span>0857-1451-3616</span>
                  <button type="button" onClick={() => copyToClipboard('085714513616', 'E-Wallet')} className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors" title="Salin nomor E-Wallet">
                    <Copy size={14} />
                  </button>
                </div>
              </li>
              <li className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-500">BCA</span>
                <div className="flex items-center gap-2">
                  <span>5745442525 a.n Abdul Karim</span>
                  <button type="button" onClick={() => copyToClipboard('5745442525', 'BCA')} className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors" title="Salin rekening BCA">
                    <Copy size={14} />
                  </button>
                </div>
              </li>
              <li className="flex flex-col border-b border-neutral-200 pb-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">QRIS (Semua Pembayaran)</span>
                  <button 
                    type="button" 
                    onClick={() => setShowQRIS(!showQRIS)} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg transition-colors"
                  >
                    <QrCode size={14} />
                    {showQRIS ? 'Tutup QRIS' : 'Lihat QRIS'}
                  </button>
                </div>
                {showQRIS && (
                  <div className="mt-3 mb-1 flex flex-col items-center justify-center p-4 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                    <img src="/qris.png" alt="QRIS Telur Gulung Rehan" className="w-full max-w-[200px] h-auto object-contain mb-2" />
                    <p className="text-[11px] text-neutral-500 text-center font-medium">A.n. Telur Gulung Rehan</p>
                    <p className="text-[10px] text-neutral-400 text-center">NMID: ID1023300477420</p>
                  </div>
                )}
              </li>
            </ul>
            
            <div className="mt-4 mb-3">
              <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Crypto (Pilih Jaringan)</p>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-neutral-200 rounded-lg p-2.5 gap-2">
                  <div>
                    <div className="text-sm font-medium text-neutral-800">USDT / USDC / ETH</div>
                    <div className="text-xs text-neutral-500">Base / BSC / Polygon / Optimism</div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-neutral-500 font-mono truncate w-[100px]" title="0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825">0x0b90...C825</span>
                    <button type="button" onClick={() => copyToClipboard('0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825', 'EVM Crypto')} className="p-1.5 bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors" title="Salin alamat EVM">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-neutral-200 rounded-lg p-2.5 gap-2">
                  <div>
                    <div className="text-sm font-medium text-neutral-800">Solana (SOL / USDC)</div>
                    <div className="text-xs text-neutral-500">Jaringan: Solana</div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-neutral-500 font-mono truncate w-[100px]" title="4S2tC1ze5STbQKtRF54dRwDzYwNWnXwuhqNXB985g6YC">4S2tC1...g6YC</span>
                    <button type="button" onClick={() => copyToClipboard('4S2tC1ze5STbQKtRF54dRwDzYwNWnXwuhqNXB985g6YC', 'Solana')} className="p-1.5 bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors" title="Salin alamat Solana">
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
