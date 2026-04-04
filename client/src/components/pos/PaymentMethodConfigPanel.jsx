import { useState, useEffect } from 'react';
import { Banknote, CreditCard, QrCode, Info, Loader2, Lock } from 'lucide-react';

export default function PaymentMethodConfigPanel({ config, onUpdate, isManager }) {
  const [cash, setCash] = useState(config.paymentMethods?.cash ?? true);
  const [digital, setDigital] = useState(config.paymentMethods?.digital ?? false);
  const [qrPayment, setQrPayment] = useState(config.paymentMethods?.qrPayment ?? false);
  const [upiId, setUpiId] = useState(config.upiId || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync when selected config changes
  useEffect(() => {
    setCash(config.paymentMethods?.cash ?? true);
    setDigital(config.paymentMethods?.digital ?? false);
    setQrPayment(config.paymentMethods?.qrPayment ?? false);
    setUpiId(config.upiId || '');
    setDirty(false);
  }, [config._id, config.paymentMethods, config.upiId]);

  const handleToggle = (setter, field) => (val) => {
    setter(val);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ cash, digital, qrPayment, upiId: upiId.trim() });
    setSaving(false);
    setDirty(false);
  };

  const PaymentToggle = ({ icon: Icon, label, description, enabled, onToggle, color }) => (
    <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
      enabled ? `border-${color}-300 bg-${color}-50/50` : 'border-stone-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${
            enabled ? `bg-${color}-100` : 'bg-stone-100'
          }`}>
            <Icon className={`w-4 h-4 transition-colors duration-300 ${
              enabled ? `text-${color}-600` : 'text-stone-400'
            }`} />
          </div>
          <span className="text-sm font-display font-semibold text-stone-800">{label}</span>
        </div>
        {isManager ? (
          <button
            onClick={() => onToggle(!enabled)}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 ${
              enabled ? 'bg-cafe-500' : 'bg-stone-300'
            }`}
            style={{ height: '22px' }}
          >
            <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
              enabled ? 'translate-x-4.5' : 'translate-x-0'
            }`} style={{ width: '18px', height: '18px', transform: enabled ? 'translateX(18px)' : 'translateX(0)' }} />
          </button>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
          }`}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        )}
      </div>
      {enabled && (
        <p className="text-[11px] text-stone-400 ml-10 animate-slide-down leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card animate-fade-in-up sticky top-20">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-bold text-stone-800">Payment Methods</h3>
            <p className="text-xs text-stone-400 mt-0.5">Configure for "{config.name}"</p>
          </div>
          {!isManager && (
            <div className="flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-lg">
              <Lock className="w-3 h-3 text-stone-400" />
              <span className="text-[10px] text-stone-400 font-medium">View only</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="p-5 space-y-3">
        <PaymentToggle
          icon={Banknote}
          label="Cash"
          description="Available on the payment screen during checkout."
          enabled={cash}
          onToggle={handleToggle(setCash, 'cash')}
          color="emerald"
        />
        <PaymentToggle
          icon={CreditCard}
          label="Digital (Bank / Card)"
          description="Accept card and bank-style digital transactions."
          enabled={digital}
          onToggle={handleToggle(setDigital, 'digital')}
          color="blue"
        />
        <PaymentToggle
          icon={QrCode}
          label="QR Payment (UPI)"
          description="Generate QR codes for UPI-based checkout."
          enabled={qrPayment}
          onToggle={handleToggle(setQrPayment, 'qrPayment')}
          color="violet"
        />

        {/* UPI ID Field */}
        {qrPayment && (
          <div className="pl-4 border-l-2 border-violet-200 animate-slide-down">
            <label className="auth-label">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setDirty(true); }}
              placeholder="yourname@upi"
              disabled={!isManager}
              className="auth-input text-xs"
            />
            <div className="flex items-start gap-1.5 mt-2">
              <Info className="w-3 h-3 text-stone-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-400 leading-relaxed">
                This UPI ID will be used to generate the QR payment experience on the checkout page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      {isManager && dirty && (
        <div className="p-5 pt-0 animate-slide-down">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover transition-all duration-300 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
