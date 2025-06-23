from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas
from io import BytesIO
import os
from datetime import datetime

def format_currency(amount):
    """Format amount in cents to currency string."""
    if amount is None:
        return '£0.00'
    return f"£{amount / 100:.2f}"

def generate_pdf_receipt(payment_data, order_items=None):
    """Generate a PDF receipt with payment and order details."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='RestaurantName',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    ))
    styles.add(ParagraphStyle(
        name='ReceiptHeading',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=20
    ))
    styles.add(ParagraphStyle(
        name='ReceiptInfo',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12
    ))

    # Add restaurant name
    elements.append(Paragraph("Marwan's Philly Cheesesteak", styles['RestaurantName']))
    elements.append(Paragraph("Payment Receipt", styles['ReceiptHeading']))

    # Add receipt details
    receipt_info = [
        f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"Payment ID: {payment_data.get('payment_id', 'N/A')}",
        f"Order ID: {payment_data.get('order_id', 'N/A')}",
        f"Status: {payment_data.get('status', 'Completed').title()}"
    ]

    for info in receipt_info:
        elements.append(Paragraph(info, styles['ReceiptInfo']))
    
    elements.append(Spacer(1, 20))

    # Add order items if available
    if order_items:
        # Create the items table
        table_data = [['Item', 'Quantity', 'Unit Price', 'Total']]
        for item in order_items:
            # Get the price from base_price_money or total_money
            unit_price = (
                item.get('base_price_money', {}).get('amount') or 
                item.get('total_money', {}).get('amount', 0)
            )
            if isinstance(unit_price, str):
                unit_price = float(unit_price)
            
            quantity = int(item.get('quantity', 1))
            total = unit_price * quantity
            
            table_data.append([
                item.get('name', 'Unknown Item'),
                str(quantity),
                format_currency(unit_price),
                format_currency(total)
            ])

        # Create and style the table
        items_table = Table(table_data, colWidths=[220, 70, 100, 100])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),  # Left align item names
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),  # Right align numbers
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10)
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))

    # Add payment summary with right-aligned amounts
    payment_summary = [
        ['Base Amount:', format_currency(payment_data.get('base_amount'))],
        ['Tip Amount:', format_currency(payment_data.get('tip_amount'))],
        ['Total Amount:', format_currency(payment_data.get('total_amount'))]
    ]
    
    # Create table with more space for right-aligned amounts
    summary_table = Table(payment_summary, colWidths=[300, 150])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),  # Left align labels
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),  # Right align amounts
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold the total row
        ('FONTSIZE', (0, -1), (-1, -1), 12),  # Slightly larger total
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
        ('RIGHTPADDING', (1, 0), (1, -1), 20),  # More padding for amounts
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
    ]))
    elements.append(summary_table)

    # Add footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Thank you for your business!", styles['ReceiptInfo']))
    elements.append(Paragraph("This is an automatically generated receipt.", styles['ReceiptInfo']))

    # Build the PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer
    pdf = buffer.getvalue()
    buffer.close()
    
    return pdf 