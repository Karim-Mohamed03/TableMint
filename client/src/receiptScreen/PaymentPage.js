import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { 
  Elements, 
  PaymentElement, 
  PaymentRequestButtonElement, 
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import "./PaymentPage.css";

const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");

// ✅ CheckoutForm Component
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
        // return_url: `${window.location.origin}/complete`,
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
      <button disabled={isLoading || !stripe || !elements} className="pay-now-btn">
        {isLoading ? "Processing..." : "Pay Now"}
      </button>
      {message && <div className="payment-message">{message}</div>}
    </form>
  );
};

// // ✅ GooglePayButton Component
const GooglePayButton = ({ amount }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: "Total",
        amount: amount * 100,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on("paymentmethod", async (event) => {
      try {
        const response = await fetch("/api/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethodId: event.paymentMethod.id }),
        });

        const { clientSecret } = await response.json();

        const { error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: event.paymentMethod.id,
        });

        if (error) {
          event.complete("fail");
        } else {
          event.complete("success");
        }
      } catch (err) {
        console.error("Payment failed:", err);
        event.complete("fail");
      }
    });
  }, [stripe, amount]);

  return paymentRequest ? (
    <PaymentRequestButtonElement options={{ paymentRequest }} />
  ) : (
    <div>Google Pay not available</div>
  );
};

// ✅ PaymentPage Component
export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [tip, setTip] = useState(5);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const baseAmount = 3500; // in cents (e.g., $35.00)

  const totalAmount = baseAmount + tip * 100; // Convert tip to cents

  useEffect(() => {
    fetch("http://localhost:8000/api/payments/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [{ amount: totalAmount }] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("No client secret returned");
        }
      })
      .catch((err) => {
        console.error("Error fetching client secret:", err);
      });
  }, [totalAmount]);

  const handleTipChange = (tipAmount) => {
    setTip(tipAmount);
  };

  const togglePaymentForm = () => {
    setShowStripeForm(!showStripeForm);
  };

  const options = { clientSecret };

  return (
    <div className="payment-container">
      <h1>Table 15 - Payment</h1>

      <div className="bill-summary">
        <h3>Bill Summary</h3>
        <div>Base Amount: $35.00</div>
        <div>Tip: ${tip.toFixed(2)}</div>
        <div>Total: ${(totalAmount / 100).toFixed(2)}</div>
      </div>

      <div className="tip-selection">
        <h4>Select a Tip</h4>
        {[5, 10, 15].map((amount) => (
          <button 
            key={amount} 
            className={`tip-btn ${tip === amount ? "active" : ""}`} 
            onClick={() => handleTipChange(amount)}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div className="payment-toggle">
        <button onClick={togglePaymentForm} className="toggle-btn">
          {showStripeForm ? "Use Quick Pay" : "Use Stripe Checkout"}
        </button>
      </div>

      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          {showStripeForm ? (
            <CheckoutForm />
          ) : (
            <div className="quick-pay">
              <GooglePayButton amount={totalAmount / 100} />
            </div>
          )}
        </Elements>
      ) : (
        <div>Loading payment form...</div>
      )}
    </div>
  );
}
