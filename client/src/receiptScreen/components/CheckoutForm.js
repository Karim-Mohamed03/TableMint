// import { useState, useEffect } from "react";
// import { 
//   PaymentElement, 
//   useStripe, 
//   useElements 
// } from "@stripe/react-stripe-js";

// const CheckoutForm = ({ baseAmount, tipAmount, orderId }) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [message, setMessage] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [returnUrl, setReturnUrl] = useState("");

//   // Store order_id in session storage as a backup
//   useEffect(() => {
//     if (orderId) {
//       sessionStorage.setItem("current_order_id", orderId);
//     }
//   }, [orderId]);

//   // Create return URL with query parameters
//   useEffect(() => {
//     let url = "http://localhost:3000/complete";
    
//     // Add query parameters if we have them
//     const params = new URLSearchParams();
    
//     if (baseAmount) params.append("base_amount", baseAmount);
//     if (tipAmount) params.append("tip_amount", tipAmount);
//     if (orderId) {
//       console.log("Adding order_id to return URL:", orderId);
//       params.append("order_id", orderId);
//     }
    
//     // Add payment_intent_client_secret placeholder
//     params.append("payment_intent_client_secret", "{PAYMENT_INTENT_CLIENT_SECRET}");
    
//     const finalUrl = `${url}?${params.toString()}`;
//     console.log("Generated return URL:", finalUrl);
//     setReturnUrl(finalUrl);
//   }, [baseAmount, tipAmount, orderId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     setIsLoading(true);

//     // Log the values being sent
//     console.log("Submitting payment with values:", {
//       baseAmount,
//       tipAmount,
//       orderId,
//       returnUrl
//     });

//     const { error } = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         return_url: returnUrl,
//         payment_method_data: {
//           metadata: {
//             base_amount: baseAmount || 0,
//             tip_amount: tipAmount || 0,
//             order_id: orderId
//           }
//         }
//       }
//     });

//     if (error) {
//       console.error("Payment error:", error);
//       setMessage(error.message || "An unexpected error occurred.");
//     } else {
//       setMessage(null);
//     }

//     setIsLoading(false);
//   };

//   return (
//     <form id="payment-form" onSubmit={handleSubmit}>
//       <PaymentElement />
//       {message && <div className="payment-message">{message}</div>}
//       <button className="pay-button" disabled={isLoading || !stripe || !elements}>
//         {isLoading ? "Processing..." : "Pay now"}
//       </button>
//     </form>
//   );
// };

// export default CheckoutForm;

import { useState, useEffect } from "react";
import {
  PaymentElement,
  ExpressCheckoutElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const CheckoutForm = ({ baseAmount, tipAmount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState("");

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canUsePaymentRequest, setCanUsePaymentRequest] = useState(false);

  // Store order ID in session
  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem("current_order_id", orderId);
    }
  }, [orderId]);

  // Generate return URL
  useEffect(() => {
    let url = "http://localhost:3000/complete";
    const params = new URLSearchParams();

    if (baseAmount) params.append("base_amount", baseAmount);
    if (tipAmount) params.append("tip_amount", tipAmount);
    if (orderId) params.append("order_id", orderId);

    params.append("payment_intent_client_secret", "{PAYMENT_INTENT_CLIENT_SECRET}");
    setReturnUrl(`${url}?${params.toString()}`);
  }, [baseAmount, tipAmount, orderId]);

  // Initialize Payment Request for Apple Pay
  useEffect(() => {
    if (!stripe) return;

    const amountCents = (parseFloat(baseAmount || 0) + parseFloat(tipAmount || 0)) * 100;

    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: "Total",
        amount: Math.round(amountCents),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setCanUsePaymentRequest(true);
        setPaymentRequest(pr);
      }
    });
  }, [stripe, baseAmount, tipAmount]);

  // Submit with PaymentElement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          metadata: {
            base_amount: baseAmount || 0,
            tip_amount: tipAmount || 0,
            order_id: orderId,
          },
        },
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
      {canUsePaymentRequest && paymentRequest && (
        <div style={{ marginBottom: "20px" }}>
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: "default", // Can use "default" to support other wallets too
                  theme: "dark",
                  height: "44px",
                },
              },
            }}
          />
        </div>
      )}

      <PaymentElement />
      {message && <div className="payment-message">{message}</div>}
      <button
        className="pay-button"
        disabled={isLoading || !stripe || !elements}
        style={{ marginTop: "20px" }}
      >
        {isLoading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
};

export default CheckoutForm;
