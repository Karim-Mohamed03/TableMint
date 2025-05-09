import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import TablePage from "./pages/TablePage";
import PaymentPage from "./receiptScreen/PaymentPage";
import CompletePage from "./receiptScreen/CompletePage";

const stripePromise = loadStripe("pk_live_51RMFN4ITADYq5tc3p121uRgW9h4o4fkuUUEeEzgHtUhTougOlZy0hv0PNcbZ0onbyaIkTWv3K60qrAHYjrt9t7pm00OaYNE9Ux");

function App() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/payments/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        items: [{ amount: 3500 }]
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.text().then(text => {
          // Safely handle empty responses
          if (!text) {
            throw new Error('Empty response received from server');
          }
          // Try to parse as JSON
          try {
            return JSON.parse(text);
          } catch (err) {
            console.error('Failed to parse response as JSON:', text);
            throw new Error('Invalid JSON response from server');
          }
        });
      })
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
  }, []);

  const appearance = {
    theme: "stripe",
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Order Management</h1>
      </header>
      <main>
        <Router>
          <Routes>
            {/* <Route path="/" element={<TablePage />} /> */}

            {/* Payment Route - Only render if clientSecret is available */}
            <Route 
              path="/" 
              element={
                clientSecret ? (
                  <Elements stripe={stripePromise} options={options}>
                    <PaymentPage />
                  </Elements>
                ) : (
                  <div>Loading Payment Page...</div>
                )
              } 
            />

            <Route path="/complete" element={<CompletePage />} />
          </Routes>
        </Router>
      </main>
      <footer>
        <p>© {new Date().getFullYear()} Test Restaurant App</p>
      </footer>
    </div>
  );
}

export default App;
