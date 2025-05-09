from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Add admin path if needed
    # path('admin/', admin.site.urls),
    
    # Include the payments app URLs
    path('', include('backend.payments.urls')),
]
