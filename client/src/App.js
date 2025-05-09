// // import React from 'react';
// // import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// // import './App.css';
// // import TablePage from './pages/TablePage';
// // import { Elements } from "@stripe/react-stripe-js";
// // import PaymentPage from "./receiptScreen/PaymentPage";
// // import CompletePage from "./receiptScreen/CompletePage";
// // import { loadStripe } from "@stripe/stripe-js";

// // const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");

// // function App() {
// //   return (
// //     <div className="App">
// //       <header className="App-header">
// //         <h1>Restaurant Order Management</h1>
// //       </header>
// //       <main>
// //         {/* <TablePage />
// //         <PaymentPage />
// //         <Route path="/complete" element={<CompletePage />} /> */}
// //         <Router>
// //           <Routes>
// //             {/* Add TABLE PAGE HERE */}
// //             <Route path="/" element={<PaymentPage />} />
// //               <Route path="/complete" element={<CompletePage />} />
// //           </Routes>
// //         </Router>
// //       </main>
// //       <footer>
// //         <p>© {new Date().getFullYear()} Test Restaurant App</p>
// //       </footer>
// //     </div>
// //   );
// // }

// // export default App;

// // {/* <Elements options={{clientSecret, appearance, loader}} stripe={stripePromise}>
// //             <Routes>
// //               <Route path="/checkout" element={<CheckoutForm />} />
// //               <Route path="/complete" element={<CompletePage />} />
// //             </Routes>
// //           </Elements> */}


// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import "./App.css";
// import { Elements } from "@stripe/react-stripe-js";
// import { loadStripe } from "@stripe/stripe-js";
// import TablePage from "./pages/TablePage";
// import PaymentPage from "./receiptScreen/PaymentPage";
// import CompletePage from "./receiptScreen/CompletePage";
// import { useEffect, useState } from "react";


// const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");
// const [clientSecret, setClientSecret] = useState("");

// useEffect(() => {
//   fetch('http://localhost:8000/api/payments/create-payment-intent', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       items: [{ id: 'basic-plan' }],
//     }),
//   })
//     .then((res) => res.json())
//     // .then((data) => setClientSecret(data.clientSecret));
//     .then((data) => {
//       console.log("Client secret:", data);
//       if (data.clientSecret) {
//         console.log("Client secret:", data.clientSecret);
//         setClientSecret(data.clientSecret);
//       } else {
//         console.error("Error: No client secret returned");
//       }
//     })

// }, []);

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Restaurant Order Management</h1>
//       </header>
//       <main>
//         <Router>
//           <Routes>
//             {/* Assuming TablePage is the main page */}
//             <Route path="/" element={<TablePage />} />
            
//             <Route 
//               path="/payment" 
//               element={
//                 <Elements stripe={stripePromise}>
//                   <PaymentPage />
//                 </Elements>
//               } 
//             />

//             <Route path="/complete" element={<CompletePage />} />
//           </Routes>
//         </Router>
//       </main>
//       <footer>
//         <p>© {new Date().getFullYear()} Test Restaurant App</p>
//       </footer>
//     </div>
//   );
// }

// export default App;


import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import TablePage from "./pages/TablePage";
import PaymentPage from "./receiptScreen/PaymentPage";
import CompletePage from "./receiptScreen/CompletePage";

const stripePromise = loadStripe("pk_test_51MNLkFEACKuyUvsyQSMfwsU2oCp1tMz9B3EyvzrVqkrE3664tGDabLl94k7xxfrAMJiV8mnYw2Ri8WB2Y6UF0Mey00QS6yNYOj");

function App() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/payments/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify({
      //   items: [{ id: "basic-plan" }],
      // }),
      body: JSON.stringify({ amount: 3500 })
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
