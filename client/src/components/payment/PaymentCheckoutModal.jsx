import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Utility to load Razorpay script
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

export default function PaymentCheckoutModal({ isOpen, onClose, orderTotal, orderPayload, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    const toastId = toast.loading('Initializing secure checkout...');

    try {
      // 1. Create Local Order
      const localOrderRes = await ordersAPI.create(orderPayload);
      if (!localOrderRes.data.success) {
        throw new Error('Order creation failed');
      }
      const localOrder = localOrderRes.data.order;

      // 2. Request Razorpay Order from Backend
      const rzpOrderRes = await api.post(`/payments/razorpay/create-order`, {
        amount: orderTotal,
        receipt: localOrder._id,
      });

      if (!rzpOrderRes.data.success) throw new Error('Razorpay initialization failed');

      const { amount, id: order_id, currency } = rzpOrderRes.data.order;

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SZYyLMrB7N4Q2r',
        amount: amount,
        currency: currency,
        name: 'Odoo POS Cafe',
        description: 'Dine-In Order Payment',
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200',
        order_id: order_id,
        handler: async function (response) {
          toast.loading('Verifying secure payment...', { id: toastId });
          
          try {
            // 4. Verify Payment Signature Backend
            const verifyRes = await api.post(`/payments/razorpay/verify`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: orderTotal,
              orderId: localOrder._id
            });

            if (verifyRes.data.success) {
              toast.success('Order Placed Successfully!', { id: toastId });
              onSuccess(); // Clear cart in Menu page
              navigate(`/customer/order-progress/${localOrder._id}`, { state: { order: localOrder } });
            } else {
              toast.error('Payment Verification Failed.', { id: toastId });
              setIsProcessing(false);
            }
          } catch (err) {
            console.error('Verify err:', err);
            toast.error('Verification error occurred.', { id: toastId });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@odooposcafe.com',
          contact: '9999999999',
        },
        theme: {
          color: '#EA580C',
        },
        modal: {
          ondismiss: function () {
            toast.dismiss(toastId);
            setIsProcessing(false);
            toast.error('Payment cancelled by user.');
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      
      rzpInstance.on('payment.failed', function (response){
         toast.error(response.error.description, { id: toastId });
         setIsProcessing(false);
      });

      rzpInstance.open();

    } catch (err) {
      console.error(err);
      toast.error('Payment checkout failed.', { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-body">
      <div 
        className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm overflow-hidden animate-slide-up relative"
      >
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-full transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-6 text-center border-b border-stone-100">
          <div className="w-16 h-16 bg-cream-50 text-cafe-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-cafe-100 shadow-sm">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-display font-black text-stone-900 tracking-tight leading-none mb-2">Complete Order</h3>
          <p className="text-sm font-semibold text-stone-400">Total Payable Amount</p>
          <div className="mt-3 text-4xl font-display font-black text-stone-900 tracking-tight">
            ₹{orderTotal}
          </div>
        </div>

        <div className="p-6 bg-stone-50/50">
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-stone-800">Secure Checkout</p>
                <p className="text-[11px] font-medium text-stone-400 mt-0.5">256-bit SSL encrypted payment</p>
              </div>
            </li>
          </ul>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-4 px-6 bg-stone-900 text-white font-display font-bold rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:bg-black transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            {isProcessing ? (
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 <span>Processing...</span>
               </div>
            ) : (
              <>
                 Pay with Razorpay
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </>
            )}
           
          </button>
          
          <div className="text-center mt-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
