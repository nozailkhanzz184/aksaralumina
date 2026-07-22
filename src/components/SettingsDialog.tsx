import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Wallet, 
  User, 
  LogOut,
  CloudUpload,
  RefreshCw,
  Download,
  Upload, 
  Loader2, 
  Save, 
  X
} from 'lucide-react';
import { SubscriptionCard } from './SubscriptionCard';

import { loadKey, loadModel, loadModelHistory, saveKey, saveModel, DEFAULT_MODEL } from '../lib/openrouter';
import { useI18n } from '../lib/i18n';

interface Props {
  user: any;
  loading: boolean;
  syncing: boolean;
  logout: () => Promise<void>;
  onClose: () => void;
  onSyncMerge?: () => Promise<void>;
  onSyncOverwrite?: () => Promise<void>;
  onExport?: () => void;
  onImport?: () => void;
}

type TabType = 'api' | 'wallet' | 'profile' | 'sync' | null;

export const SettingsDialog = ({ user, loading, syncing, logout, onClose, onSyncMerge, onSyncOverwrite, onExport, onImport }: Props) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>(window.innerWidth < 640 ? null : 'api');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const modelHistory = loadModelHistory();

  useEffect(() => {
    setApiKey(loadKey());
    setModel(loadModel());
  }, []);

  const handleSaveSettings = () => {
    saveKey(apiKey.trim());
    saveModel(model.trim());
    // Optionally close or show toast
  };

  const NavItem = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive 
            ? 'bg-[#eff6ff] text-[#1c64f2]' 
            : 'text-neutral-700 hover:bg-neutral-100'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-[#1c64f2]' : 'text-neutral-500'} />
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative bg-[#f8fafc] w-full max-w-[280px] h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 border-r border-neutral-200">
        
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="flex items-center justify-between px-2 mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Menu</h3>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="mb-6">
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.general')}</div>
            <div className="space-y-1">
              <NavItem id="api" icon={Key} label={t('menu.api')} />
              <NavItem id="sync" icon={RefreshCw} label={t('menu.sync') || 'Sync'} />
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.personal')}</div>
            <div className="space-y-1">
                            <NavItem id="wallet" icon={Wallet} label={t('menu.wallet')} />
              <NavItem id="profile" icon={User} label={t('menu.profile')} />
            </div>
          </div>
        </div>

      </div>

      {/* Content Area (Desktop only or shown conditionally) */}
      <div className="relative flex-1 bg-white h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-8 duration-300 delay-100 max-w-md hidden sm:flex">
         <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
           <h2 className="text-xl font-semibold capitalize">{activeTab ? activeTab.replace('-', ' ') : ''}</h2>
           <button onClick={onClose} className="sm:hidden p-2 text-neutral-400 hover:text-neutral-700">
             <X size={20} />
           </button>
         </div>
         <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.profile.title')}</h4>
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
                ) : user ? (
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="font-medium text-neutral-900 truncate">{user.email}</p>
                      <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">ID: {user.$id}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title={t('settings.logout')}
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
                )}
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('menu.sync') || 'Sync'}</h4>
                {user ? (
                  <div className="space-y-3">
                    <button
                      onClick={onSyncMerge}
                      disabled={syncing}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-left shadow-sm"
                    >
                      <div className={`p-2 rounded-lg bg-blue-50 text-blue-600 ${syncing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.syncMerge') || 'Sync Merge'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.merge.desc') || 'Merge local data with cloud'}</p>
                      </div>
                    </button>
                    <button
                      onClick={onSyncOverwrite}
                      disabled={syncing}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-left shadow-sm"
                    >
                      <div className={`p-2 rounded-lg bg-orange-50 text-orange-600 ${syncing ? 'animate-pulse' : ''}`}>
                        <CloudUpload size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.syncOverwrite') || 'Force Overwrite Cloud'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.overwrite.desc') || 'Overwrite cloud data'}</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
                )}
              
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('sync.offline.title') || 'Offline File'}</h4>
                  <div className="space-y-3 mt-4">
                    <button
                      onClick={onExport}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.exportJSON') || 'Export JSON'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.export.desc') || 'Download local data as JSON'}</p>
                      </div>
                    </button>
                    <button
                      onClick={onImport}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.importJSON') || 'Import JSON'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.import.desc') || 'Restore data from JSON file'}</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}
            {activeTab === 'api' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-1">OpenRouter Configuration</h4>
                  <p className="text-xs text-neutral-500 mb-4">{t('settings.api.desc')}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c64f2]/20 focus:border-[#1c64f2] transition-all bg-neutral-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={DEFAULT_MODEL}
                    list="settings-model-history"
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1c64f2]/20 focus:border-[#1c64f2] transition-all bg-neutral-50 focus:bg-white"
                  />
                  <datalist id="settings-model-history">
                    {modelHistory.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full flex items-center justify-center gap-2 bg-[#1c64f2] hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors mt-2 shadow-sm"
                >
                  <Save size={18} /> {t('settings.api.save')}
                </button>
              </div>
            )}

            
            
            
            
            {activeTab === 'wallet' && (
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.wallet.title')}</h4>
                 <SubscriptionCard user={user} />
                 
              </div>
            )}
         </div>
      </div>
      
      {/* Mobile Content Area Overlay */}
      <div className={`sm:hidden fixed inset-0 z-50 bg-white transition-transform duration-300 ${activeTab ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="flex flex-col h-full">
            <div className="p-4 border-b border-neutral-100 flex items-center bg-white gap-3">
              <button onClick={() => setActiveTab(null as any)} className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h2 className="text-lg font-semibold capitalize flex-1">{activeTab ? activeTab.replace('-', ' ') : ''}</h2>
              <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              
              {activeTab === 'profile' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.profile.title')}</h4>
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
                ) : user ? (
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="font-medium text-neutral-900 truncate">{user.email}</p>
                      <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">ID: {user.$id}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title={t('settings.logout')}
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
                )}
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('menu.sync') || 'Sync'}</h4>
                {user ? (
                  <div className="space-y-3">
                    <button
                      onClick={onSyncMerge}
                      disabled={syncing}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-left shadow-sm"
                    >
                      <div className={`p-2 rounded-lg bg-blue-50 text-blue-600 ${syncing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.syncMerge') || 'Sync Merge'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.merge.desc') || 'Merge local data with cloud'}</p>
                      </div>
                    </button>
                    <button
                      onClick={onSyncOverwrite}
                      disabled={syncing}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-left shadow-sm"
                    >
                      <div className={`p-2 rounded-lg bg-orange-50 text-orange-600 ${syncing ? 'animate-pulse' : ''}`}>
                        <CloudUpload size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.syncOverwrite') || 'Force Overwrite Cloud'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.overwrite.desc') || 'Overwrite cloud data'}</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
                )}
              
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('sync.offline.title') || 'Offline File'}</h4>
                  <div className="space-y-3 mt-4">
                    <button
                      onClick={onExport}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Download size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.exportJSON') || 'Export JSON'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.export.desc') || 'Download local data as JSON'}</p>
                      </div>
                    </button>
                    <button
                      onClick={onImport}
                      className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{t('btn.importJSON') || 'Import JSON'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{t('sync.import.desc') || 'Restore data from JSON file'}</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}
            {activeTab === 'api' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-1">OpenRouter Configuration</h4>
                  <p className="text-xs text-neutral-500 mb-4">{t('settings.api.desc')}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c64f2]/20 focus:border-[#1c64f2] transition-all bg-neutral-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={DEFAULT_MODEL}
                    list="settings-model-history"
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1c64f2]/20 focus:border-[#1c64f2] transition-all bg-neutral-50 focus:bg-white"
                  />
                  <datalist id="settings-model-history">
                    {modelHistory.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full flex items-center justify-center gap-2 bg-[#1c64f2] hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors mt-2 shadow-sm"
                >
                  <Save size={18} /> {t('settings.api.save')}
                </button>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.wallet.title')}</h4>
                 <SubscriptionCard user={user} />
                 
              </div>
            )}

            </div>
         </div>
      </div>

    </div>
  );
};
