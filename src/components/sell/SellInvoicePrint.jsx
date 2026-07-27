import React, { forwardRef } from "react";

const SellInvoicePrint = forwardRef(({ completedInvoice, shopInfo, invoiceCalculations }, ref) => {
  if (!completedInvoice) return null;

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
            <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
            {shopInfo?.address && <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>{shopInfo.address}</p>}
            {shopInfo?.phoneNumber && <p style={{ fontSize: '8px', margin: '1px 0 0 0' }}>Phone: {shopInfo.phoneNumber}</p>}
            <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>Date: {new Date(completedInvoice.date).toLocaleString('en-IN')}</p>
          </div>
          <div className="info">
            <p>Invoice No: #{completedInvoice.billNumber}</p>
            <p>Payment Mode: {completedInvoice.paymentMethod}</p>
            {completedInvoice.customerName && <p>Customer: {completedInvoice.customerName}</p>}
            {completedInvoice.customerPhone && <p>Phone: {completedInvoice.customerPhone}</p>}
            {completedInvoice.prescriptionDetail?.doctorName && (
              <div style={{ fontSize: '8px', border: '0.5px solid black', padding: '2px', marginTop: '4px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Rx details (Schedule H)</p>
                <p style={{ margin: 0 }}>Dr: {completedInvoice.prescriptionDetail.doctorName} {completedInvoice.prescriptionDetail.doctorRegNo ? `(Reg: ${completedInvoice.prescriptionDetail.doctorRegNo})` : ""}</p>
                <p style={{ margin: 0 }}>Patient: {completedInvoice.prescriptionDetail.patientAge ? `${completedInvoice.prescriptionDetail.patientAge}y/` : ""}{completedInvoice.prescriptionDetail.patientGender}</p>
              </div>
            )}
          </div>
          <div className="items-table">
            <div className="row head">
              <span>Item Name</span>
              <span>Qty x Price</span>
            </div>
            {completedInvoice.items.map((item, i) => {
              const discount = item.discountPercent || 0;
              const gst = item.gstPercent || 0;
              const itemMrp = item.sellMrp || item.mrp || 0;
              const itemUnitTotal = itemMrp * (1 - discount / 100);
              return (
                <div key={i} style={{ marginBottom: '4px' }}>
                  <div className="row" style={{ margin: 0 }}>
                    <span style={{ maxWidth: '32mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name.includes('(Strip)') || item.name.includes('(Tab)') || item.name.includes('(Str)')
                        ? item.name
                        : `${item.name} ${item.sellUnit === 'strip' ? '(Str)' : '(Tab)'}`}
                    </span>
                    <span>{item.sellQuantity} x ₹{itemMrp}</span>
                  </div>
                  {(discount > 0 || gst > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: 'gray', paddingLeft: '4px' }}>
                      <span>{discount > 0 ? `D:${discount}%` : ""} {gst > 0 ? `G:${gst}%` : ""}</span>
                      <span>Net: ₹{itemUnitTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {(() => {
            const cal = invoiceCalculations(completedInvoice);
            return (
              <div style={{ borderBottom: '1px dashed black', paddingBottom: '4px', marginBottom: '6px', fontSize: '9px' }}>
                {cal.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Discount Saved:</span>
                    <span>-₹{cal.totalDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxable Value:</span>
                  <span>₹{cal.totalTaxable}</span>
                </div>
                {cal.totalCGST > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST:</span>
                      <span>₹{cal.totalCGST}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST:</span>
                      <span>₹{cal.totalSGST}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          <div className="total-row">
            <span>Grand Total:</span>
            <span>₹{completedInvoice.totalAmount}</span>
          </div>
          <div className="footer">
            Thank you! Get well soon.<br/>
            *Medicines once sold cannot be returned.*<br/>
            <span style={{ fontSize: '5.5px', display: 'block', marginTop: '6px', lineHeight: '1.2', color: '#555', fontWeight: 'normal', textTransform: 'none' }}>
              This invoice is generated using MedERP. Tax slabs, dosage, and stock parameters are configured and verified by the licensed pharmacist. DevSamp Technologies holds no liability for tax rate errors or wrong drug dispensation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

SellInvoicePrint.displayName = "SellInvoicePrint";

export default SellInvoicePrint;
