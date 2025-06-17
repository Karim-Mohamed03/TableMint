"""
URL configuration for qlub_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from tables.views import table_qr_redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/tables/', include('tables.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/pos/', include('pos.urls')),
    path('api/webhooks/', include('webhooks.urls')),
    # Include restaurant URLs
    path('', include('restaurants.urls')),
    
    # QR Code redirect route - this handles the QR code scans
    path('table/<str:token>/', table_qr_redirect, name='table-qr-redirect'),
    
    # Direct URL path to serve assets directly
    path('static/assets/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, 'assets'),
    }),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Additional static files pattern for assets folder
    urlpatterns += [
        path('assets/<path:path>', serve, {
            'document_root': os.path.join(settings.BASE_DIR, 'assets'),
        }),
    ]
