import { useState, useEffect } from "react";
// import { X } from "lucide-react";
import "./PaymentPage.css"; // Importing CSS styles
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement, useStripe } from "@stripe/react-stripe-js";

// Replace with your Stripe publishable key
const stripePromise = loadStripe("pk_live_51MNLkFEACKuyUvsyNSqbD6GO0IPagT0p7kHfVa6wwrTMqoitlxqsUVy3quACHWRXKzoacFJx2zEQ6rEwB8zZHi7p00yDKjWX4X");
//hello
// Google Pay Button component
const GooglePayButton = () => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "US", // Using US as it's widely supported
      currency: "egp", // Keep your currency as EGP
      total: {
        label: "Table 15 Payment",
        amount: 3500, // Amount in smallest currency unit (e.g., cents)
      },
      requestPayerName: true,
      requestPayerEmail: true,
      googlePay: true,
    });

    

    // Check if Google Pay is available
    pr.canMakePayment().then(result => {
      console.log('canMakePayment result:', result);
      if (result && result.googlePay) {
        setPaymentRequest(pr);
      }
    });

    // Handle payment method
    pr.on("paymentmethod", async (event) => {
      // Send to your backend
      try {
        const response = await fetch("/api/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: event.paymentMethod.id,
            amount: 3500, // Same as above
          }),
        });

        const { clientSecret } = await response.json();

        // Confirm the payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          console.error("Payment failed:", error);
          event.complete("fail");
        } else if (paymentIntent.status === "requires_action") {
          // Handle 3D Secure authentication if needed
          stripe.confirmCardPayment(clientSecret).then(function(result) {
            if (result.error) {
              // Show error message
              event.complete("fail");
            } else {
              // Payment successful
              event.complete("success");
              // Handle post-payment success (redirect, show confirmation, etc.)
            }
          });
        } else {
          // Payment successful
          event.complete("success");
          // Handle post-payment success (redirect, show confirmation, etc.)
        }
      } catch (err) {
        console.error("Error processing payment:", err);
        event.complete("fail");
      }
    });
  }, [stripe]);

  if (paymentRequest) {
    return (
      <PaymentRequestButtonElement
        options={{ paymentRequest }}
        className="google-pay-button"
      />
    );
  }

  // Show a message if Google Pay is not available
  return <div className="google-pay-unavailable">Google Pay not available</div>;
};

export default function PaymentPage() {
  const [tip, setTip] = useState(5);
  const [totalAmount, setTotalAmount] = useState(35.00);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const basePrice = 30.00;
  
  const handleTipSelection = (tipAmount) => {
    setTip(tipAmount);
    setTotalAmount(basePrice + tipAmount);
  };

  // Format card number with spaces after every 4 digits
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue);
    }
  };

  // Format expiry date with automatic slash after MM
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Add slash after month input
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    // Limit to 5 characters (MM/YY)
    if (value.length <= 5) {
      setExpiry(value);
    }
  };

  // Format CVV to only allow 3 or 4 digits
  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    
    // Limit to 4 characters (some cards have 4-digit CVV)
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  // Card logos as SVG components
  const cardLogos = {
    visa: (
      <svg className="card-type-icon" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M293.2 348.73L318.7 149.8H368.3L342.8 348.73H293.2Z" fill="#00579F"/>
        <path d="M539.1 155.3C528.3 151.14 510.7 146.6 489.3 146.6C430.8 146.6 389.1 177.6 388.9 222.55C388.7 255.3 419.2 273.1 442.7 283.5C466.8 294.09 475.1 300.79 475 310.64C474.9 325.94 456.2 332.8 438.7 332.8C414.3 332.8 401.2 328.8 380.7 319.94L372.2 315.9L363 361.04C375.9 366.94 400.6 372.04 426.2 372.3C488.4 372.3 529.5 341.7 529.9 294.2C530.1 269.2 514.9 249.9 478.1 234.04C455.6 224.04 441.9 217.5 442 207.04C442 197.5 453.1 187.34 477 187.34C497.2 187.14 511.7 192.44 522.9 198.04L529 201.44L538.2 157.94L539.1 155.3Z" fill="#00579F"/>
        <path d="M616.3 149.8H577.9C564.2 149.8 554.3 153.64 548.5 169.14L460.2 348.7H522.4C522.4 348.7 532.9 320.6 535.1 314.6C541.9 314.6 594.6 314.7 603.3 314.7C605 322.2 610.7 348.7 610.7 348.7H666L616.3 149.8ZM553.4 276.7C559.2 261.94 581.2 205.9 581.2 205.9C580.9 206.5 586.7 190.9 590 180.7L594.5 205.1C594.5 205.1 608.3 264.1 611.1 276.7H553.4Z" fill="#00579F"/>
        <path d="M232.9 149.8L174.6 286.64L167.6 254.74C155.3 221.14 124.3 185.04 90 167.04L143.8 348.54H206.5L300.7 149.8H232.9Z" fill="#00579F"/>
        <path d="M142.8 149.8H45.8L45 153.64C111.3 171.14 153.3 209.54 167.6 254.7L143.8 167.14C139.8 151.84 130.1 150.14 117.8 149.8H142.8Z" fill="#FAA61A"/>
      </svg>
    ),
    mastercard: (
      <svg className="card-type-icon" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M490 250C490 353.45 406.15 437.5 303 437.5C199.85 437.5 116 353.45 116 250C116 146.55 199.85 62.5 303 62.5C406.15 62.5 490 146.55 490 250Z" fill="#D9222A"/>
        <path d="M664 250C664 353.45 580.15 437.5 477 437.5C373.85 437.5 290 353.45 290 250C290 146.55 373.85 62.5 477 62.5C580.15 62.5 664 146.55 664 250Z" fill="#EE9F2D"/>
        <path d="M477 62.5C547.65 62.5 610.7 100.1 647.55 157.5C610.7 214.9 547.65 252.5 477 252.5C406.35 252.5 343.3 214.9 306.45 157.5C343.3 100.1 406.35 62.5 477 62.5Z" fill="#D9222A"/>
        <path d="M303 437.5C232.35 437.5 169.3 399.9 132.45 342.5C169.3 285.1 232.35 247.5 303 247.5C373.65 247.5 436.7 285.1 473.55 342.5C436.7 399.9 373.65 437.5 303 437.5Z" fill="#EE9F2D"/>
      </svg>
    ),
    amex: (
      <svg className="card-type-icon" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M651.48 171.5H559.17L518.32 244.09L478.56 171.5H347.22V308.02L281.33 171.5H205.24L115 341.22H177.98L194.08 308.41H272.87L288.97 341.22H376.11V196.47L428.82 341.22H478.37L530.49 195.88V341.22H590.23V281.71H662.65C714.38 281.71 746.26 258.62 751.73 218.66C756.62 181.49 731.94 171.5 651.48 171.5Z" fill="#006FCF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M193.29 281.12L233.64 192.67L274.58 281.12H193.29Z" fill="#006FCF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M650.9 251.02H590.24V202.99H649.12C675.68 202.99 688.14 209.25 688.14 226.31C688.14 242.79 674.29 251.02 650.9 251.02Z" fill="#006FCF"/>
      </svg>
    ),
    discover: (
      <svg className="card-type-icon" viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M54 297.5V201H726V297.5C726 336.5 695 362 656 362H124C85 362 54 336.5 54 297.5Z" fill="#F48120"/>
        <path d="M726 201V297.5C726 336.5 695 362 656 362H429C429 362 500 320 540 201H726Z" fill="#000000" fillOpacity="0.14"/>
        <path d="M429 263.64C415.68 277.19 397.86 285.68 378.08 285.68C341.26 285.68 311.92 256.32 311.92 219.48C311.92 182.64 341.26 153.27 378.08 153.27C397.86 153.27 415.68 161.77 429 175.33V263.64Z" fill="white"/>
      </svg>
    )
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="payment-container">
        {/* Header with table number and close button */}
        <div className="header">
          <h1 className="table-title">Table 15</h1>
          {/* <button className="close-button">
            <X size={20} />
          </button> */}
        </div>
        
        {/* Bill Details */}
        <table className="bill-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Item</th>
              <th style={{ width: '25%', textAlign: 'center' }}>QTY</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{textAlign: 'left'}}>Cheese Burger</td>
              <td style={{ textAlign: 'center' }}>1</td>
              <td style={{ textAlign: 'right' }}>30.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td style={{textAlign: 'left'}}>Your Bill</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>EGP 30.00</td>
            </tr>
          </tfoot>
        </table>
        
        {/* Split Bill Button */}
        <button className="split-bill-btn">
          Lets Split The Bill!
        </button>
        
        {/* Tip Section */}
        <div className="tips-section">
          <p>Add Tips</p>
          <div className="tips-buttons">
            <button 
              className={`tip-btn ${tip === 5 ? 'active' : ''}`}
              onClick={() => handleTipSelection(5)}
            >
              5
            </button>
            <button 
              className={`tip-btn ${tip === 10 ? 'active' : ''}`}
              onClick={() => handleTipSelection(10)}
            >
              10
            </button>
            <button 
              className={`tip-btn ${tip === 15 ? 'active' : ''}`}
              onClick={() => handleTipSelection(15)}
            >
              15
            </button>
            <button className="tip-btn">
              {/* Custom tip button */}
            </button>
          </div>
          
          {/* Total amount */}
          <p className="total-amount">You are paying: EGP {totalAmount.toFixed(2)}</p>
        </div>
        
        {/* Payment Methods */}
        <div className="payment-methods">
          {/* Google Pay Button */}
          <div className="google-pay-wrapper">
            <GooglePayButton />
          </div>
          
          {/* Apple Pay Button */}
          <button className="apple-pay-btn">
            Apple Pay
          </button>
        </div>
        
        {/* Card Input Section */}
        <div className="card-section">
          <div className="card-input-group">
            <div style={{ flex: '2', textAlign: 'left' }}>
              <label className="card-input-label">Card Number</label>
              <input 
                type="text" 
                className="card-input" 
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
              />
            </div>
            
            <div style={{ flex: '1', textAlign: 'left' }}>
              <label className="card-input-label">CVV</label>
              <input 
                type="text" 
                className="card-input" 
                placeholder="XXX"
                value={cvv}
                onChange={handleCvvChange}
                maxLength={4}
              />
            </div>
          </div>

          <div style={{ flex: '1' , textAlign: 'left', marginTop: '30px' }}>
              {/* <label className="card-input-label">MM/YY</label> */}
              <input 
                type="text" 
                className="card-input" 
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                maxLength={5}
              />
          </div>
          
          {/* Card Type Logos */}
          <div className="card-types">
            {cardLogos.visa}
            {cardLogos.mastercard}
            {cardLogos.amex}
            {cardLogos.discover}
          </div>
        </div>
        
        {/* Pay Now Button */}
        <button className="pay-now-btn">
          Pay Now
        </button>
      </div>
    </Elements>
  );
}