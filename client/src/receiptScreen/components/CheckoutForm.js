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

  // Store order_id in session storage as a backup
  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem("current_order_id", orderId);
    }
  }, [orderId]);

  // Create return URL with query parameters
  useEffect(() => {
    let url = "https://test-app-fawn-phi.vercel.app/complete";
    
    // Add query parameters if we have them
    const params = new URLSearchParams();
    
    if (baseAmount) params.append("base_amount", baseAmount);
    if (tipAmount) params.append("tip_amount", tipAmount);
    if (orderId) {
      console.log("Adding order_id to return URL:", orderId);
      params.append("order_id", orderId);
    }
    
    // Add payment_intent_client_secret placeholder
    params.append("payment_intent_client_secret", "{PAYMENT_INTENT_CLIENT_SECRET}");
    
    const finalUrl = `${url}?${params.toString()}`;
    console.log("Generated return URL:", finalUrl);
    setReturnUrl(finalUrl);
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
            order_id: orderId
          }
        }
      }
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
      <PaymentElement />
      {message && <div className="payment-message">{message}</div>}
      <button className="pay-button" disabled={isLoading || !stripe || !elements}>
        {isLoading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
};

export default CheckoutForm;