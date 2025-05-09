# ...existing code...

# Stripe Settings
STRIPE_SECRET_KEY = 'sk_test_51MNLkFEACKuyUvsyuJi4BZW7FuHrtKBFeJjrashJ88baTmaB2c0u1svIM7Av11La7TUTRMz74fxQ2eiGJn6kDELJ00YqDLNMO6'
STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key'  # Replace with your actual publishable key

# Make sure the following settings are defined properly
ROOT_URLCONF = 'Test-App.urls'  # This should match your project name, adjust if needed

# Ensure ALLOWED_HOSTS is configured correctly
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Add CORS settings if you're making cross-origin requests
CORS_ALLOW_ALL_ORIGINS = True  # For development only, restrict in production
CORS_ALLOW_CREDENTIALS = True
