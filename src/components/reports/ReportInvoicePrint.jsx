import React, { forwardRef } from "react";

const ReportInvoicePrint = forwardRef(({ printingInvoice, shopInfo }, ref) => {
  if (!printingInvoice) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      <div ref={ref}>
        <style type="text/css" media="print">
          {`
            @page { 
              size: 58mm auto; 
              margin: 0mm !important; 
            }
            body { 
              margin: 0mm !important; 
              padding: 0mm !important; 
              font-family: monospace !important;
              background-color: white;
              color: black;
            }
            .thermal-invoice {
              width: 58mm !important; 
              box-sizing: border-box; 
              padding: 4mm 2mm; 
              font-size: 10px;
              line-height: 1.2;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed black;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .header h3 {
              margin: 0;
              font-size: 12px;
              text-transform: uppercase;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0 0 0;
              font-size: 8px;
            }
            .info {
              border-bottom: 1px dashed black;
              padding-bottom: 4px;
              margin-bottom: 6px;
              font-size: 9px;
            }
            .info p {
              margin: 1px 0;
            }
            .items-table {
              width: 100%;
              border-bottom: 1px dashed black;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            .items-table .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 9px;
            }
            .items-table .row.head {
              font-weight: bold;
              font-size: 8px;
              border-bottom: 0.5px solid black;
              padding-bottom: 2px;
              margin-bottom: 2px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 11px;
              margin-top: 4px;
            }
            .footer {
              text-align: center;
              font-size: 8px;
              margin-top: 15px;
              border-top: 0.5px solid black;
              padding-top: 4px;
            }
          `}
        </style>

        <div className="thermal-invoice">
          <div className="header">
            <h3>{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
            {shopInfo?.address && <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>{shopInfo.address}</p>}
            {shopInfo?.phoneNumber && <p style={{ fontSize: '8px', margin: '1px 0 0 0' }}>Phone: {shopInfo.phoneNumber}</p>}
            <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>Date: {new Date(printingInvoice.date).toLocaleString('en-IN')}</p>
          </div>
          <div className="info">
            <p>Invoice No: #{printingInvoice.billNumber}</p>
            <p>Payment Mode: {printingInvoice.paymentMethod}</p>
            {printingInvoice.customerPhone && <p>Cust Mobile: {printingInvoice.customerPhone}</p>}
            {printingInvoice.customerName && <p>Cust Name: {printingInvoice.customerName}</p>}
          </div>
          <div className="items-table">
            <div className="row head">
              <span>Item Name</span>
              <span>Qty x Price</span>
            </div>
            {printingInvoice.items.map((item, i) => (
              <div key={i} className="row">
                <span style={{ maxWidth: '32mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span>{(item.quantity || item.sellQuantity)} x ₹{item.mrp}</span>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>Grand Total:</span>
            <span>₹{printingInvoice.totalAmount}</span>
          </div>
          <div className="footer">
            Thank you! Get well soon.<br/>
            *Medicines once sold cannot be returned.*
          </div>
        </div>
      </div>
    </div>
  );
});

ReportInvoicePrint.displayName = "ReportInvoicePrint";

export default ReportInvoicePrint;
