from django.shortcuts import render


from rest_framework import generics
from rest_framework.response import Response
from .models import Table
from .serializers import TableSerializer

class TableListCreateView(generics.ListCreateAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    
class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer

class TableQRCodeView(generics.RetrieveAPIView):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    
    def retrieve(self, request, *args, **kwargs):
        # Get the table instance
        instance = self.get_object()
        # Return QR code data using serializer
        serializer = self.get_serializer(instance)
        return Response(serializer.data)