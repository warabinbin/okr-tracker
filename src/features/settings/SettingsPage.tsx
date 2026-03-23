import { useState } from 'react';
import { useSettingsStore } from '../../shared/store';
import { Card, Button, Badge } from '../../shared/components';
import { db } from '../../shared/db';
import { useOkrStore } from '../../shared/store';

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSwitch({ id, label, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between min-h-[44px]">
      <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer select-none">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

export function SettingsPage() {
  const { settings, updateSettings, stagnationThresholdDays, setStagnationThresholdDays } =
    useSettingsStore();
  const { setObjectives, setKeyResults, setActions, setActionLogs } = useOkrStore();

  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState(settings.aiApiKey);
  const [provider, setProvider] = useState(settings.aiProvider);
  const [exportDone, setExportDone] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  function handleSave() {
    updateSettings({ aiApiKey: apiKey, aiProvider: provider });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleRitual(key: keyof typeof settings.ritualSettings, value: boolean) {
    updateSettings({
      ritualSettings: { ...settings.ritualSettings, [key]: value },
    });
  }

  // JSON export
  async function handleExport() {
    try {
      const [objectives, keyResults, actions, actionLogs, weeklyRetros] = await Promise.all([
        db.objectives.toArray(),
        db.keyResults.toArray(),
        db.actions.toArray(),
        db.actionLogs.toArray(),
        db.weeklyRetros.toArray(),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: { objectives, keyResults, actions, actionLogs, weeklyRetros },
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `okr-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  // Delete all data
  async function handleDeleteAll() {
    try {
      await Promise.all([
        db.objectives.clear(),
        db.keyResults.clear(),
        db.actions.clear(),
        db.actionLogs.clear(),
        db.weeklyRetros.clear(),
        db.dailyFocus.clear(),
      ]);
      setObjectives([]);
      setKeyResults([]);
      setActions([]);
      setActionLogs([]);
      setDeleteConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      </div>

      {/* Stagnation Alert Settings */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">先延ばしアラート</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="stagnation-days" className="block text-sm font-medium text-gray-700 mb-1.5">
              未更新でアラートを出す日数
            </label>
            <div className="flex items-center gap-3">
              <input
                id="stagnation-days"
                type="range"
                min={3}
                max={60}
                step={1}
                value={stagnationThresholdDays}
                onChange={(e) => setStagnationThresholdDays(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-semibold text-blue-600 w-16 text-right">
                {stagnationThresholdDays}日
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3日</span>
              <span>60日</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              現在の設定: {stagnationThresholdDays}日間更新がないKRにアラートを表示します
            </p>
          </div>
        </div>
      </Card>

      {/* Ritual Settings */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">完了儀式設定</h2>
        <div className="space-y-1 divide-y divide-gray-50">
          <ToggleSwitch
            id="ritual-enabled"
            label="儀式を有効化"
            checked={settings.ritualSettings.enabled}
            onChange={(v) => toggleRitual('enabled', v)}
          />
          <ToggleSwitch
            id="ritual-confetti"
            label="紙吹雪エフェクト"
            checked={settings.ritualSettings.confettiEnabled}
            onChange={(v) => toggleRitual('confettiEnabled', v)}
          />
          <ToggleSwitch
            id="ritual-sound"
            label="サウンドを鳴らす"
            checked={settings.ritualSettings.soundEnabled}
            onChange={(v) => toggleRitual('soundEnabled', v)}
          />
        </div>
      </Card>

      {/* AI Settings */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">AI設定 (Phase 2)</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 mb-1.5">
              AIプロバイダー
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">ローカル</option>
            </select>
          </div>
          <div>
            <label htmlFor="ai-key" className="block text-sm font-medium text-gray-700 mb-1.5">
              APIキー
            </label>
            <input
              id="ai-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              キーはこのデバイスのローカルにのみ保存されます
            </p>
          </div>
          <Button size="sm" onClick={handleSave}>
            {saved ? '保存しました ✓' : '保存する'}
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-4">データ管理</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">JSONエクスポート</p>
              <p className="text-xs text-gray-400 mt-0.5">全データをJSONファイルでダウンロード</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="flex-shrink-0"
            >
              {exportDone ? 'ダウンロード完了' : 'エクスポート'}
            </Button>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-600">データを全削除</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  全ての目標・KR・アクションを削除します。この操作は取り消せません。
                </p>
              </div>
              {!deleteConfirm ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                  className="flex-shrink-0"
                >
                  全削除
                </Button>
              ) : (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <p className="text-xs text-red-600 font-medium text-right">本当に削除しますか？</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      削除する
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-3">アプリ情報</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>バージョン</span>
            <Badge>1.0.0</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>データ保存</span>
            <Badge variant="info">IndexedDB (ローカル)</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>フレームワーク</span>
            <Badge variant="info">React 19 + Vite</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
