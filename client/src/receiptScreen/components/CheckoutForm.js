import { useState } from "react";
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/complete",
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