import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { loadStripe } from "@stripe/stripe-js";
import PaymentPage from "./receiptScreen/PaymentPagee";
import CompletePage from "./receiptScreen/CompletePage";

const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");

function App() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(3500); // Default amount in cents

  // Create a callback for updating the payment amount from child components
  const updatePaymentAmount = useCallback((amount) => {
    setPaymentAmount(amount);
  }, []);

  // Create or update payment intent when payment amount changes
  useEffect(() => {
    createPaymentIntent(paymentAmount);
  }, [paymentAmount]);

  const createPaymentIntent = (amount) => {
    fetch("http://localhost:8000/api/payments/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [{ amount: amount }] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("No client secret returned");
          setError("Failed to fetch payment intent");
        }
      })
      .catch((err) => {
        console.error("Error fetching client secret:", err);
        setError("An error occurred. Please try again.");
      });
  };

  const appearance = {
    theme: "stripe",
  };

  return (
    <div className="App">
      <main>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                clientSecret ? (
                  <PaymentPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                  />
                ) : (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading Payment Page...</p>
                    {error && <p className="error-message">{error}</p>}
                  </div>
                )
              } 
            />
            <Route path="/complete" element={<CompletePage />} />
          </Routes>
        </Router>
      </main>
      <footer>
        <p>© {new Date().getFullYear()} TableMint</p>
      </footer>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }
        
        .loading-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top: 3px solid #0071e3;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .error-message {
          color: #ff3b30;
          text-align: center;
          margin-top: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
