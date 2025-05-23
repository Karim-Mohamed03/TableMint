import os
import requests
from flask import Flask, request, redirect, url_for, jsonify

# Create a Flask app to handle the OAuth callback
app = Flask(__name__)

# Clover OAuth configuration
CLIENT_ID = os.environ.get('CLOVER_CLIENT_ID', '8QX49HEZQFH0A')  # Using the client_id from your error message
CLIENT_SECRET = os.environ.get('CLOVER_CLIENT_SECRET', '13fb904b-7f60-edd9-03d3-0afa475cfce0')
REDIRECT_URI = os.environ.get('CLOVER_REDIRECT_URI', 'http://localhost:5000/')
API_TOKEN_URL = os.environ.get('CLOVER_API_TOKEN_URL', 'https://sandbox.dev.clover.com/oauth/token')

@app.route('/')
def oauth_callback():
    """Handle the OAuth callback from Clover"""
    # Extract the authorization code from the request
    code = request.args.get('code')
    merchant_id = request.args.get('merchant_id')
    employee_id = request.args.get('employee_id')
    
    if not code:
        return jsonify({
            'success': False,
            'error': 'Authorization code missing from callback'
        }), 400
    

    
    # Exchange the code for an access token
    token_response = exchange_code_for_token(code)
    token_response['merchant_id'] = merchant_id
    
    # Return the token response
    return jsonify(token_response)

def exchange_code_for_token(code):
    """Exchange the authorization code for an access token"""
    try:
        # Prepare the request payload
        payload = {
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'code': code
        }
        
        # Make the token request
        response = requests.post(API_TOKEN_URL, data=payload)
        
        # Check if the request was successful
        if response.status_code == 200:
            token_data = response.json()
            # Save the token securely (e.g., in environment variables or a secure database)
            # For this example, we're just returning it
            return {
                'success': True,
                'access_token': token_data.get('access_token'),
                'merchant_id': token_data.get('merchant_id')
            }
        else:
            return {
                'success': False,
                'error': f"Failed to get access token: {response.text}"
            }
    except Exception as e:
        return {
            'success': False,
            'error': f"Exception during token exchange: {str(e)}"
        }

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True, port=8000)