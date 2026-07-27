"use client";
import React, { useRef } from "react";
import { ScanBarcode, Camera, Loader2, Search } from "lucide-react";
import CameraScanner from "@/components/sell/CameraScanner"; 
import { Toaster } from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import useQuickSell from "@/hooks/useQuickSell";
import SellCart from "@/components/sell/SellCart";
import SellCustomerForm from "@/components/sell/SellCustomerForm";
import SellInvoiceModal from "@/components/sell/SellInvoiceModal";
import SellInvoicePrint from "@/components/sell/SellInvoicePrint";
import { formatExpiryDate } from "@/lib/formatDate";

const invoiceCalculations = (invoice) => {
  if (!invoice) return { totalTaxable: 0, totalDiscount: 0, totalCGST: 0, totalSGST: 0 };
  let totalTaxable = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  invoice.items.forEach((item) => {
    const qty = item.sellQuantity || item.quantity || 1;
    const mrp = item.sellMrp || item.mrp || 0;
    const discountPercent = item.discountPercent || 0;
    const gstPercent = item.gstPercent || 0;

    const originalTotal = mrp * qty;
    const discountedTotal = originalTotal * (1 - discountPercent / 100);
    const taxable = discountedTotal / (1 + gstPercent / 100);
    const tax = discountedTotal - taxable;

    totalTaxable += taxable;
    totalDiscount += originalTotal - discountedTotal;
    totalTax += tax;
  });

  return {
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalCGST: Number((totalTax / 2).toFixed(2)),
    totalSGST: Number((totalTax / 2).toFixed(2))
  };
};

export default function QuickSell() {
  const {
    barcode,
    setBarcode,
    manualSearch,
    setManualSearch,
    searchResults,
    setSearchResults,
    cart,
    setCart,
    loading,
    checkoutLoading,
    paymentMethod,
    setPaymentMethod,
    showCamera,
    setShowCamera,
    completedInvoice,
    setCompletedInvoice,
    shopInfo,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    waPhone,
    setWaPhone,
    searchQtys,
    setSearchQtys,
    sellUnits,
    setSellUnits,
    isPrescriptionRequired,
    setIsPrescriptionRequired,
    doctorName,
    setDoctorName,
    doctorRegNo,
    setDoctorRegNo,
    patientAge,
    setPatientAge,
    patientGender,
    setPatientGender,
    offlineQueue,
    dbCustomers,
    selectedDbCustomer,
    setSelectedDbCustomer,
    isNewCustomer,
    setIsNewCustomer,
    custSearch,
    setCustSearch,
    showSuggestions,
    setShowSuggestions,
    isOnline,
    inputRef,
    manualSyncOfflineQueue,
    processBarcode,
    handleManualSearch,
    addToCart,
    removeItem,
    totalCartAmount,
    triggerWhatsAppSend,
    getCustomerLockDetails,
    handleCheckout
  } = useQuickSell();

  const invoicePrintRef = useRef(null);
  
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: completedInvoice ? `Invoice_${completedInvoice.billNumber}` : 'Invoice',
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      {showCamera && (
        <CameraScanner 
          onScan={(decoded) => { setShowCamera(false); processBarcode(decoded); }} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 shrink-0 border border-blue-100 shadow-sm">
            <ScanBarcode className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">Fast Billing & Outward</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Scan barcode to deduct stock.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowCamera(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-lg w-full md:w-auto shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4 md:w-4 md:h-4 mr-2" /> Use Phone Camera
        </button>
      </div>

      {/* Network Status & Offline sync queue alert */}
      {(!isOnline || offlineQueue.length > 0) && (
        <div className={`border text-xs md:text-sm font-bold px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm transition-all ${!isOnline ? 'bg-amber-500/10 border-amber-500/30 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${!isOnline ? 'bg-amber-500 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
            <div>
              <span className="font-extrabold">{!isOnline ? '🔴 Device is Offline' : '⚡ Pending Offline Bills'}</span>
              <span className="opacity-80 text-xs ml-2">({offlineQueue.length} {offlineQueue.length === 1 ? 'bill' : 'bills'} in queue)</span>
            </div>
          </div>
          
          {offlineQueue.length > 0 && (
            <button
              onClick={manualSyncOfflineQueue}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all cursor-pointer hover:scale-105"
            >
              Sync Offline Bills Now
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Barcode & Manual Search Box */}
          <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-3 md:gap-4 flex-col md:flex-row">
            <form onSubmit={(e) => { e.preventDefault(); processBarcode(barcode); }} className="flex-1">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">Scan Barcode</label>
              <div className="relative">
                <input 
                  ref={inputRef} type="text" placeholder="Focus here to scan..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-semibold"
                  value={barcode} onChange={(e) => setBarcode(e.target.value)} 
                />
                <ScanBarcode className="absolute left-3 md:left-4 top-3 md:top-4.5 text-slate-400 w-5 h-5 md:w-6 md:h-6" />
                {loading && <Loader2 className="absolute right-3 md:right-4 top-3 md:top-4.5 text-blue-500 w-5 h-5 md:w-6 md:h-6 animate-spin" />}
              </div>
            </form>

            <form onSubmit={handleManualSearch} className="flex-1">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">Manual Search</label>
              <div className="flex">
                <input 
                  type="text" placeholder="Medicine name..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-l-xl md:rounded-l-2xl px-3 md:px-4 py-3 md:py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-semibold"
                  value={manualSearch} onChange={(e) => setManualSearch(e.target.value)} 
                />
                <button type="submit" className="bg-blue-600 text-white px-4 md:px-5 rounded-r-xl md:rounded-r-2xl hover:bg-blue-700 transition-colors cursor-pointer">
                  <Search className="w-4 h-4 md:w-5 md:h-5"/>
                </button>
              </div>
            </form>
          </div>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-blue-100 animate-in fade-in duration-200">
              <h3 className="text-xs md:text-sm font-bold mb-2 md:mb-3 text-slate-700">Search Results:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {searchResults.map(med => (
                  <div key={med._id} className="flex justify-between items-center bg-slate-50 p-2.5 md:p-3 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                    <div className="flex-1 pr-2 md:pr-3 min-w-0">
                      <p className="font-bold text-xs md:text-sm text-slate-800 truncate">{med.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[8px] md:text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shadow-sm">
                          {med.isLoose && med.tabletsPerStrip > 1 ? (
                            (sellUnits[med._id] || "strip") === "strip"
                              ? `Strips Stock: ${Math.floor(med.quantity / med.tabletsPerStrip)}`
                              : `Stock: ${med.quantity} tabs`
                          ) : (
                            `Stock: ${med.quantity} Pcs`
                          )}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shadow-sm">
                          {med.isLoose && med.tabletsPerStrip > 1 ? (
                            (sellUnits[med._id] || "strip") === "strip"
                              ? `₹${med.stripMrp || (med.mrp * med.tabletsPerStrip).toFixed(2)} / strip`
                              : `₹${med.mrp.toFixed(2)} / tab`
                          ) : (
                            `₹${med.mrp}`
                          )}
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded shadow-sm">Exp: {formatExpiryDate(med.expiryDate)}</span>
                        {med.rackNumber && <span className="text-[8px] md:text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded shadow-sm">Rack: {med.rackNumber}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2 sm:flex-nowrap">
                      {med.isLoose && med.tabletsPerStrip > 1 && (
                        <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-350 select-none">
                          <button
                            type="button"
                            onClick={() => {
                              setSellUnits({ ...sellUnits, [med._id]: "strip" });
                              setSearchQtys({ ...searchQtys, [med._id]: 1 });
                            }}
                            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                              (sellUnits[med._id] || "strip") === "strip"
                                ? "bg-blue-600 text-white shadow-sm font-black"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Strip
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSellUnits({ ...sellUnits, [med._id]: "tab" });
                              setSearchQtys({ ...searchQtys, [med._id]: 1 });
                            }}
                            className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                              (sellUnits[med._id] || "strip") === "tab"
                                ? "bg-blue-600 text-white shadow-sm font-black"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Loose
                          </button>
                        </div>
                      )}

                      {med.quantity > 0 && (
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const current = searchQtys[med._id] || 1;
                              if (current > 1) {
                                setSearchQtys({ ...searchQtys, [med._id]: current - 1 });
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded text-xs focus:outline-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={(sellUnits[med._id] || (med.isLoose ? "strip" : "tab")) === "strip" ? Math.floor(med.quantity / med.tabletsPerStrip) : med.quantity}
                            value={searchQtys[med._id] || 1}
                            onChange={(e) => {
                              const maxVal = (sellUnits[med._id] || (med.isLoose ? "strip" : "tab")) === "strip" ? Math.floor(med.quantity / med.tabletsPerStrip) : med.quantity;
                              const val = Math.max(1, Math.min(maxVal, parseInt(e.target.value) || 1));
                              setSearchQtys({ ...searchQtys, [med._id]: val });
                            }}
                            className="w-8 text-center font-bold text-slate-800 focus:outline-none text-[10px] bg-transparent border-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = searchQtys[med._id] || 1;
                              const maxVal = (sellUnits[med._id] || (med.isLoose ? "strip" : "tab")) === "strip" ? Math.floor(med.quantity / med.tabletsPerStrip) : med.quantity;
                              if (current < maxVal) {
                                setSearchQtys({ ...searchQtys, [med._id]: current + 1 });
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded text-xs focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {med.quantity <= 0 ? (
                        <button disabled className="bg-rose-100 text-rose-700 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold shrink-0 opacity-80 cursor-not-allowed border border-rose-200">
                          Sold Out
                        </button>
                      ) : (
                        <button onClick={() => addToCart(med, searchQtys[med._id] || 1)} className="bg-blue-600 text-white px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-700 transition-colors shrink-0 cursor-pointer">
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Component */}
          <SellCart 
            cart={cart} 
            setCart={setCart} 
            removeItem={removeItem} 
          />
        </div>

        {/* Customer & Checkout Form Component */}
        <SellCustomerForm
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          custSearch={custSearch}
          setCustSearch={setCustSearch}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          dbCustomers={dbCustomers}
          selectedDbCustomer={selectedDbCustomer}
          setSelectedDbCustomer={setSelectedDbCustomer}
          isNewCustomer={isNewCustomer}
          setIsNewCustomer={setIsNewCustomer}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          isPrescriptionRequired={isPrescriptionRequired}
          setIsPrescriptionRequired={setIsPrescriptionRequired}
          doctorName={doctorName}
          setDoctorName={setDoctorName}
          doctorRegNo={doctorRegNo}
          setDoctorRegNo={setDoctorRegNo}
          patientAge={patientAge}
          setPatientAge={setPatientAge}
          patientGender={patientGender}
          setPatientGender={setPatientGender}
          totalCartAmount={totalCartAmount}
          getCustomerLockDetails={getCustomerLockDetails}
          handleCheckout={handleCheckout}
          checkoutLoading={checkoutLoading}
          cart={cart}
        />
      </div>

      {/* Sticky Mobile Checkout Quick Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-[52px] left-0 right-0 bg-slate-900/95 backdrop-blur-xl text-white px-4 py-2.5 z-[70] border-t border-slate-700/60 shadow-[0_-6px_25px_rgba(0,0,0,0.3)] flex items-center justify-between animate-in slide-in-from-bottom duration-300">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cart Total ({cart.reduce((t, i) => t + i.sellQuantity, 0)} items)</span>
            <span className="text-lg font-black text-blue-400 flex items-center">
              ₹ {totalCartAmount}
            </span>
          </div>
          <button
            onClick={() => {
              const btn = document.getElementById("main-checkout-btn");
              if (btn) btn.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Checkout</span>
          </button>
        </div>
      )}

      {/* Receipt Modals & Prints */}
      <SellInvoiceModal
        completedInvoice={completedInvoice}
        setCompletedInvoice={setCompletedInvoice}
        shopInfo={shopInfo}
        waPhone={waPhone}
        setWaPhone={setWaPhone}
        triggerWhatsAppSend={triggerWhatsAppSend}
        handlePrintInvoice={handlePrintInvoice}
        invoiceCalculations={invoiceCalculations}
      />

      <SellInvoicePrint
        ref={invoicePrintRef}
        completedInvoice={completedInvoice}
        shopInfo={shopInfo}
        invoiceCalculations={invoiceCalculations}
      />
    </div>
  );
}