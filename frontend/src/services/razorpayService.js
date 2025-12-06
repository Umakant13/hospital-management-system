import api from './api';
import { RAZORPAY_KEY_ID } from '@/utils/constants';

export const razorpayService = {
  /**
   * Load Razorpay script
   */
  loadScript: () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Create Razorpay order
   */
  createOrder: async (amount, billId, patientName) => {
    try {
      const payload = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        bill_id: billId,
      };
      console.log('Creating Razorpay order with payload:', payload);
      
      const response = await api.post('/billing/razorpay/create-order', payload);
      console.log('Order created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
      console.error('Full error object:', error);
      throw error;
    }
  },

  /**
   * Verify payment
   */
  verifyPayment: async (paymentData) => {
    try {
      console.log('Verifying payment with data:', paymentData);
      // ✅ FIXED: Added /api/v1 prefix to match backend endpoint
      const response = await api.post('/billing/razorpay/verify-payment', paymentData);
      console.log('Payment verified successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Open Razorpay checkout
   */
  openCheckout: async ({ order, amount, billId, patientName, patientEmail, patientPhone, onSuccess, onFailure }) => {
    const res = await razorpayService.loadScript();

    if (!res) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Hospital Management System',
      description: `Payment for Bill ${billId}`,
      order_id: order.razorpay_order_id,
      handler: async function (response) {
        try {
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bill_id: billId,
            amount: amount, // Already in rupees
          };

          console.log('Verifying payment after Razorpay success...');
          console.log('Verification data:', verifyData);
          const result = await razorpayService.verifyPayment(verifyData);
          
          console.log('✅ Payment verified successfully on backend');
          if (onSuccess) {
            onSuccess(result);
          }
        } catch (error) {
          console.error('❌ Payment verification error:', error);
          console.error('Error details:', error.response?.data);
          if (onFailure) {
            onFailure(error);
          }
        }
      },
      prefill: {
        name: patientName || '',
        email: patientEmail || '',
        contact: patientPhone || '',
      },
      theme: {
        color: '#667eea',
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal dismissed by user');
          if (onFailure) {
            onFailure(new Error('Payment cancelled by user'));
          }
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  },
};