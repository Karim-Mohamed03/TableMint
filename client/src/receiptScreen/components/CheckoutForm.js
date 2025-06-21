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
    let url = "https://test-app-fawn-phi.vercel.app/complete";
    
    // Add query parameters if we have them
    if (baseAmount || tipAmount || orderId) {
      url += "?";
      
      const params = [];
      if (baseAmount) params.push(`base_amount=${encodeURIComponent(baseAmount)}`);
      if (tipAmount) params.push(`tip_amount=${encodeURIComponent(tipAmount)}`);
      if (orderId) {
        console.log("Adding order_id to return URL:", orderId);
        params.push(`order_id=${encodeURIComponent(orderId)}`);
      }
      
      url += params.join("&");
    }
    
    console.log("Generated return URL:", url);
    setReturnUrl(url);
  }, [baseAmount, tipAmount, orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    // Log the values being sent
    console.log("Submitting payment with values:", {
      baseAmount,
      tipAmount,
      orderId,
      returnUrl
    });

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          metadata: {
            base_amount: baseAmount || 0,
            tip_amount: tipAmount || 0,
            order_id: orderId // Add order_id to metadata as well
          }
        }
      },
    });

    if (error) {
      console.error("Payment error:", error);
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