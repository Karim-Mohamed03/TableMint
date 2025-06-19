import { useState, useEffect } from "react";
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";

const CheckoutForm = ({ baseAmount, tipAmount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState("");

  // Create return URL with query parameters
  useEffect(() => {
    let url = "http://localhost:3000/complete";
    
    // Add query parameters if we have them
    if (baseAmount || tipAmount || orderId) {
      url += "?";
      
      const params = [];
      if (baseAmount) params.push(`base_amount=${baseAmount}`);
      if (tipAmount) params.push(`tip_amount=${tipAmount}`);
      if (orderId) params.push(`order_id=${orderId}`);
      
      url += params.join("&");
    }
    
    setReturnUrl(url);
  }, [baseAmount, tipAmount, orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          // Store tip and base amounts in the metadata
          metadata: {
            base_amount: baseAmount || 0,
            tip_amount: tipAmount || 0
          }
        }
      },
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
    } else {
      setMessage(null);
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button 
        disabled={isLoading || !stripe || !elements} 
        className="pay-button"
        type="submit"
      >
        {isLoading ? "Processing..." : "Pay"}
      </button>
      {message && <div className="payment-message">{message}</div>}
    </form>
  );
};

export default CheckoutForm;