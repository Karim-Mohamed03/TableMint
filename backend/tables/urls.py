from django.urls import path
from . import views

app_name = 'tables_api'

urlpatterns = [
    path('', views.TableListCreateView.as_view(), name='table-list'),
    path('<int:pk>/', views.TableDetailView.as_view(), name='table-detail'),
    path('<int:pk>/qrcode/', views.TableQRCodeView.as_view(), name='table-qrcode'),
]