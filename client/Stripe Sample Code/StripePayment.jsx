import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Load your Stripe publishable key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const StripePayment = () => {
    const [clientSecret, setClientSecret] = useState('');

    // Fetch the client secret from the backend
    React.useEffect(() => {
        fetch('/api/payments/create-payment-intent/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 3800 }), // Example amount in cents
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret));
    }, []);

    const appearance = { theme: 'stripe' };
    const options = { clientSecret, appearance };

    return clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    ) : (
        <div>Loading...</div>
    );
};

export default StripePayment;
