import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import {
  ArrowLeft, ShieldCheck, CreditCard, MapPin, ShoppingBag, Coffee
} from 'lucide-react';
import toast from 'react-hot-toast';

const CART_KEY = (token) => `qr_cart_${token}`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function MobileCheckoutPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState([]);
  const [table, setTable] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Get cart from state or localStorage
    if (location.state?.cart) {
      setCart(location.state.cart);
    } else {
      try {
        const saved = localStorage.getItem(CART_KEY(token));
        if (saved) setCart(JSON.parse(saved));
      } catch { /* empty */ }
    }
    if (location.state?.table) {
      setTable(location.state.table);
    } else {
      publicAPI.resolveTable(token).then((res) => {
        if (res.data.success) setTable(res.data.table);
      }).catch(() => {});
    }
    loadRazorpayScript();
  }, [token, location.state]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxTotal = cart.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.quantity;
    return sum + (lineSubtotal * (item.tax || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  const handlePayment = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const toastId = toast.loading('Creating your order...');

    try {
      // 1. Create order on backend (server validates prices)
      const orderRes = await publicAPI.createOrder(token, {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || null,
          notes: item.notes || '',
        })),
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Order creation failed');
      }

      const order = orderRes.data.order;

      // 2. Create Razorpay order
      toast.loading('Initializing payment...', { id: toastId });
      const rzpRes = await publicAPI.createRazorpayOrder({ orderId: order._id });
      if (!rzpRes.data.success) {
        throw new Error('Payment initialization failed');
      }

      const { amount, id: rzpOrderId, currency } = rzpRes.data.order;

      // 3. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SZYyLMrB7N4Q2r',
        amount,
        currency,
        name: 'Odoo POS Cafe',
        description: `Table ${table?.tableNumber} Order`,
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200',
        order_id: rzpOrderId,
        handler: async function (response) {
          toast.loading('Verifying payment...', { id: toastId });
          try {
            const verifyRes = await publicAPI.verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });

            if (verifyRes.data.success) {
              toast.success('Payment successful!', { id: toastId });
              // Clear cart
              localStorage.removeItem(CART_KEY(token));
              // Navigate to success
              navigate(`/order/${token}/success/${order._id}`, {
                state: { order: verifyRes.data.order, table },
                replace: true,
              });
            } else {
              toast.error('Payment verification failed', { id: toastId });
              setIsProcessing(false);
            }
          } catch (err) {
            console.error('Verify error:', err);
            toast.error('Verification error', { id: toastId });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `Table ${table?.tableNumber}`,
          email: '',
          contact: '',
        },
        theme: { color: '#EA580C' },
        modal: {
          ondismiss: function () {
            toast.dismiss(toastId);
            toast.error('Payment cancelled');
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment failed', { id: toastId });
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Checkout failed', { id: toastId });
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-body">
        <div className="text-center max-w-xs animate-fade-in">
          <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto mb-4" />
          <h2 className="text-lg font-display font-bold text-stone-900 mb-2">Cart is empty</h2>
          <p className="text-sm text-stone-400 mb-6">Add items from the menu first</p>
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="px-6 py-3 bg-cafe-600 text-white text-sm font-display font-semibold rounded-xl hover:bg-cafe-700 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-display font-bold text-stone-900">Checkout</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Table {table?.tableNumber} • {table?.floor?.name || 'Main Floor'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full">
        {/* Table Context */}
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm mb-4">
          <div className="w-10 h-10 rounded-xl bg-cafe-50 border border-cafe-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-cafe-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-800">Table {table?.tableNumber}</p>
            <p className="text-xs text-stone-400">{table?.floor?.name || 'Main Floor'}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b border-stone-50">
            <h3 className="text-sm font-display font-bold text-stone-800">Order Summary</h3>
            <p className="text-xs text-stone-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-stone-50">
            {cart.map((item, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-[11px] text-cafe-600 font-medium mt-0.5">{item.variantLabel}</p>
                  )}
                  {item.notes && (
                    <p className="text-[11px] text-stone-400 mt-0.5 truncate">Note: {item.notes}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-1">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-display font-bold text-stone-800 shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 mb-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Subtotal</span>
            <span className="font-semibold text-stone-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Tax</span>
            <span className="font-semibold text-stone-700">{formatCurrency(taxTotal)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-stone-100">
            <span className="text-base font-display font-bold text-stone-900">Total</span>
            <span className="text-xl font-display font-black text-stone-900">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mb-6">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Secure Payment</p>
            <p className="text-xs text-emerald-600 mt-0.5">256-bit SSL encrypted via Razorpay</p>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <div className="sticky bottom-0 p-4 sm:px-6 bg-cream-50 border-t border-stone-100">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-bold text-sm rounded-2xl shadow-btn hover:shadow-btn-hover hover:from-cafe-600 hover:to-cafe-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:shadow-btn active:scale-[0.98]"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay {formatCurrency(total)}
              </>
            )}
          </button>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-3">
            Powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
