import React from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const card = elements.getElement(CardElement);
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card,
            },
        });

        if (result.error) {
            console.error(result.error.message);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                console.log('Payment succeeded!');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit" disabled={!stripe}>
                Pay
            </button>
        </form>
    );
};

export default CheckoutForm;
