import React, { forwardRef } from "react";

export const ExpiryPDFPrint = forwardRef(({ data, expiryMonths, reportsPdfConfig, formatExpiryDate }, ref) => {
  if (!data) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      <div ref={ref} className="p-8 bg-white text-black font-sans w-[210mm]">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              color: #000 !important;
              background: #fff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .print-table th {
              border-bottom: 2px solid #000;
              padding: 10px 8px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              text-align: left;
            }
            .print-table td {
              border-bottom: 1px solid #ddd;
              padding: 10px 8px;
              font-size: 11px;
              color: #000;
            }
            .print-header {
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .print-title {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin: 0;
            }
            .print-subtitle {
              font-size: 11px;
              color: #555;
              margin-top: 4px;
              font-weight: 500;
            }
            .print-meta {
              font-size: 10px;
              color: #333;
              text-align: right;
              font-weight: 500;
              line-height: 1.4;
            }
            .print-summary-box {
              background-color: #f8fafc;
              border: 1px solid #000;
              padding: 12px;
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              font-size: 11px;
              font-weight: bold;
            }
          `}
        </style>
        
        {/* Header */}
        <div className="print-header">
          <div>
            <h1 className="print-title">Medicines Expiry Report</h1>
            <p className="print-subtitle">Smart Inventory & Loss Prevention insights</p>
          </div>
          <div className="print-meta">
            <p>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Filter: Expiring in {expiryMonths} Month{expiryMonths > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Quick Summary Banner */}
        <div className="print-summary-box">
          <span>TOTAL EXPIRING PRODUCTS: {data.expiringSoon?.length || 0}</span>
          <span>STATUS: URGENT / ATTENTION REQUIRED</span>
        </div>

        {/* Data Table */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>#</th>
              <th style={{ width: '40%' }}>Medicine Name</th>
              {reportsPdfConfig.showBatch && <th style={{ width: '15%' }}>Batch No.</th>}
              {reportsPdfConfig.showBillNo && <th style={{ width: '15%' }}>Bill Number</th>}
              {reportsPdfConfig.showQty && <th style={{ width: '12%', textAlign: 'center' }}>Stock Qty</th>}
              {reportsPdfConfig.showExpiryDate && <th style={{ width: '12%', textAlign: 'right' }}>Expiry Date</th>}
            </tr>
          </thead>
          <tbody>
            {data.expiringSoon?.map((med, idx) => (
              <tr key={med._id}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{med.name}</div>
                  {reportsPdfConfig.showDistributor && (
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Dist: {med.distributor || 'N/A'}</div>
                  )}
                </td>
                {reportsPdfConfig.showBatch && <td>{med.batch || 'N/A'}</td>}
                {reportsPdfConfig.showBillNo && <td>{med.billNumber || 'N/A'}</td>}
                {reportsPdfConfig.showQty && <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{med.quantity}</td>}
                {reportsPdfConfig.showExpiryDate && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatExpiryDate(med.expiryDate)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ExpiryPDFPrint.displayName = "ExpiryPDFPrint";

export const LowStockPDFPrint = forwardRef(({ data, lowStockThreshold, reportsPdfConfig }, ref) => {
  if (!data) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      <div ref={ref} className="p-8 bg-white text-black font-sans w-[210mm]">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              color: #000 !important;
              background: #fff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .print-table th {
              border-bottom: 2px solid #000;
              padding: 10px 8px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              text-align: left;
            }
            .print-table td {
              border-bottom: 1px solid #ddd;
              padding: 10px 8px;
              font-size: 11px;
              color: #000;
            }
            .print-header {
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .print-title {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin: 0;
            }
            .print-subtitle {
              font-size: 11px;
              color: #555;
              margin-top: 4px;
              font-weight: 500;
            }
            .print-meta {
              font-size: 10px;
              color: #333;
              text-align: right;
              font-weight: 500;
              line-height: 1.4;
            }
            .print-summary-box {
              background-color: #f8fafc;
              border: 1px solid #000;
              padding: 12px;
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              font-size: 11px;
              font-weight: bold;
            }
          `}
        </style>
        
        {/* Header */}
        <div className="print-header">
          <div>
            <h1 className="print-title">Medicines Low Stock Report</h1>
            <p className="print-subtitle">Smart Inventory replenishment insights</p>
          </div>
          <div className="print-meta">
            <p>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Filter: Stock Level below {lowStockThreshold} Units</p>
          </div>
        </div>

        {/* Quick Summary Banner */}
        <div className="print-summary-box">
          <span>TOTAL LOW STOCK PRODUCTS: {data.lowStock?.length || 0}</span>
          <span>STATUS: REORDER RECOMMENDED</span>
        </div>

        {/* Data Table */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>#</th>
              <th style={{ width: '40%' }}>Medicine Name</th>
              {reportsPdfConfig.showBatch && <th style={{ width: '15%' }}>Batch No.</th>}
              {reportsPdfConfig.showBillNo && <th style={{ width: '15%' }}>Bill Number</th>}
              {reportsPdfConfig.showQty && <th style={{ width: '15%', textAlign: 'right' }}>Available Qty</th>}
            </tr>
          </thead>
          <tbody>
            {data.lowStock?.map((med, idx) => (
              <tr key={med._id}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{med.name}</div>
                  {reportsPdfConfig.showDistributor && (
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Dist: {med.distributor || 'N/A'}</div>
                  )}
                </td>
                {reportsPdfConfig.showBatch && <td>{med.batch || 'N/A'}</td>}
                {reportsPdfConfig.showBillNo && <td>{med.billNumber || 'N/A'}</td>}
                {reportsPdfConfig.showQty && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{med.quantity}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

LowStockPDFPrint.displayName = "LowStockPDFPrint";
