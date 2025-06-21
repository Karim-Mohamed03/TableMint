import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { loadStripe } from "@stripe/stripe-js";
import PaymentPage from "./receiptScreen/PaymentPagee";
import CompletePage from "./receiptScreen/CompletePage";
import MenuCategories from "./orderingSequence/menuCategories";
import SmartMenu from "./orderingSequence/smartMenu";
import CartPage from "./pages/CartPage";
import SharedCartPage from "./pages/SharedCartPage";
import SplitPaymentPage from "./pages/SplitPaymentPage";
import TablePage from "./pages/TablePage";
import CheckoutPage from "./pages/CheckoutPage";
import { CartProvider } from "./contexts/CartContext";
import axios from "axios";

const stripePromise = loadStripe("pk_test_51RaEPK4cqToPgSHS8ngSIwFZBod0famsu6BB0erJlCgBFVcYlO2pq2YFxFX2Ux0qp5IENkciYVzsGk7KxjaWb9xN00KTY0Xift", {
  stripeAccount: 'acct_1Rab3QQBvc6fFqZ8'  // Connected account ID
});

function App() {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(3500); // Default amount in cents
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  // New state for restaurant branding
  
  const [restaurantBranding, setRestaurantBranding] = useState({
    id: null,
    name: "Restaurant",
    logo_url: "https://tablemint.onrender.com/static/assets/logo.jpg",
    background_image_url: "https://tablemint.onrender.com/static/assets/background.jpg",
    primary_color: "#0071e3",
    secondary_color: "#f5f5f7",
    show_logo_on_receipt: true,
    show_background_image: true,
  });
  const [isBrandingLoaded, setIsBrandingLoaded] = useState(false);

  // Create a callback for updating the payment amount from child components
  const updatePaymentAmount = useCallback((amount) => {
    setPaymentAmount(amount);
  }, []);

  // Create payment intent function - will be called only when needed
  const createPaymentIntent = useCallback((amount) => {
    console.log('createPaymentIntent called in App.js with amount:', amount);
    setIsCreatingPaymentIntent(true);
    
    return fetch("https://tablemint.onrender.com/api/payments/create-payment-intent", {
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
          console.log("Payment intent created with client secret:", data.clientSecret);
          setIsCreatingPaymentIntent(false);
          return data.clientSecret;
        } else {
          console.error("No client secret returned");
          setError("Failed to fetch payment intent");
          setIsCreatingPaymentIntent(false);
          throw new Error("No client secret returned");
        }
      })
      .catch((err) => {
        console.error("Error fetching client secret:", err);
        setError("An error occurred. Please try again.");
        setIsCreatingPaymentIntent(false);
        throw err;
      });
  }, []);

  // Fetch restaurant branding when the app loads - using hardcoded order ID for now
  useEffect(() => {
    console.log('App component mounted, createPaymentIntent is:', typeof createPaymentIntent);
    const fetchRestaurantBranding = async () => {
      try {
        // For testing purposes, we're using the order ID to fetch restaurant branding
        // In a real app, you'd use the restaurant ID directly if available
        const testOrderId = "NoLCNb59WpHHUGuinqUQFU7rqg4F";
        
        console.log("Fetching restaurant branding for order:", testOrderId);
        const response = await axios.get(`https://tablemint.onrender.com/api/restaurants/order/${testOrderId}/branding/`);
        
        console.log("Restaurant branding API response:", response.data);
        
        if (response.data.success) {
          const branding = response.data.restaurant;
          console.log("Setting restaurant branding:", branding);
          
          // Keep our hardcoded URLs if the API doesn't return valid ones
          if (!branding.logo_url) {
            branding.logo_url = "https://tablemint.onrender.com/static/assets/logo.jpg";
          } else if (!branding.logo_url.startsWith('http')) {
            branding.logo_url = `https://tablemint.onrender.com${branding.logo_url.startsWith('/') ? '' : '/'}${branding.logo_url}`;
          }
          
          if (!branding.background_image_url) {
            branding.background_image_url = "https://tablemint.onrender.com/static/assets/background.jpg";
          } else if (!branding.background_image_url.startsWith('http')) {
            branding.background_image_url = `https://tablemint.onrender.com${branding.background_image_url.startsWith('/') ? '' : '/'}${branding.background_image_url}`;
          }
          
          console.log("Logo URL:", branding.logo_url);
          console.log("Background image URL:", branding.background_image_url);
          setRestaurantBranding(branding);
        } else {
          console.error("Failed to fetch restaurant branding:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching restaurant branding:", error);
        // Ensure isBrandingLoaded is true even if there's an error
      } finally {
        setIsBrandingLoaded(true);
      }
    };

    fetchRestaurantBranding();
  }, []);

  return (
    <CartProvider>
      <div className="App">
        <Router>
          <main>
            <Routes>
              <Route 
                path="/" 
                element={
                  <PaymentPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              {/* QR Code Table Route */}
              <Route 
                path="/table/:token" 
                element={<TablePage />} 
              />
              <Route 
                path="/QROrderPay" 
                element={
                  <MenuCategories 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              <Route 
                path="/menu" 
                element={
                  <MenuCategories 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              <Route 
                path="/smartMenu" 
                element={<SmartMenu />} 
              />
              <Route 
                path="/cart" 
                element={
                  <CartPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              <Route 
                path="/shared-cart" 
                element={
                  <SharedCartPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              {/* New secure token-based routes */}
              <Route 
                path="/shared-cart/:shareToken" 
                element={
                  <SharedCartPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              <Route 
                path="/complete" 
                element={
                  <CompletePage 
                    restaurantBranding={restaurantBranding}
                  />
                } 
              />
              <Route 
                path="/split-payment/:shareToken" 
                element={
                  <SplitPaymentPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              {/* Legacy route for backward compatibility */}
              <Route 
                path="/split-payment/:paymentId" 
                element={
                  <SplitPaymentPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    updatePaymentAmount={updatePaymentAmount}
                    createPaymentIntent={createPaymentIntent}
                    isCreatingPaymentIntent={isCreatingPaymentIntent}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <CheckoutPage 
                    stripePromise={stripePromise} 
                    clientSecret={clientSecret}
                    restaurantBranding={restaurantBranding}
                    isBrandingLoaded={isBrandingLoaded}
                  />
                } 
              />
            </Routes>
          </main>
          {/* <footer>
            <p>© {new Date().getFullYear()} TableMint</p>
          </footer> */}
        </Router>
      </div>
    </CartProvider>
  );
}

export default App;