import React from "react";
import { CheckCircle, X, Loader2 } from "lucide-react";

export default function SellCustomerForm({
  paymentMethod,
  setPaymentMethod,
  custSearch,
  setCustSearch,
  showSuggestions,
  setShowSuggestions,
  dbCustomers,
  selectedDbCustomer,
  setSelectedDbCustomer,
  isNewCustomer,
  setIsNewCustomer,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
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
  totalCartAmount,
  getCustomerLockDetails,
  handleCheckout,
  checkoutLoading,
  cart
}) {
  return (
    <div className="bg-slate-800 p-5 md:p-8 rounded-[24px] md:rounded-3xl shadow-lg flex flex-col justify-between text-white lg:h-fit lg:sticky lg:top-24 gap-6">
      <div>
        <h2 className="text-base md:text-lg font-bold text-blue-400 mb-4 md:mb-6 flex items-center border-b border-slate-700 pb-3 md:pb-4">
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" /> Summary
        </h2>
        
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <span className="text-slate-400 font-medium text-xs md:text-base">Total Items</span>
          <span className="text-lg md:text-xl font-bold">{cart.reduce((total, item) => total + item.sellQuantity, 0)}</span>
        </div>

        <div className="flex justify-between items-center mb-5 md:mb-6 pt-3 md:pt-4 border-t border-slate-700">
          <span className="text-slate-300 font-bold text-sm md:text-base">Total Amount</span>
          <span className="text-2xl md:text-3xl font-bold text-blue-400 flex items-center">
            ₹ {totalCartAmount}
          </span>
        </div>

        <div className="mb-4">
          <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Payment Method</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-slate-700 border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs md:text-base font-bold"
          >
            <option value="Cash">💵 Cash</option>
            <option value="UPI">📱 UPI / PhonePe</option>
            <option value="Card">💳 Card</option>
            <option value="Udhaar">📒 Credit (Credit Book)</option>
          </select>
        </div>

        {paymentMethod === "Udhaar" ? (
          <div 
            className="mb-4 space-y-4 p-4 bg-slate-750/30 rounded-2xl border border-slate-700/50 transition-all relative text-left"
            onMouseLeave={() => setShowSuggestions(false)}
          >
            <div>
              <label className="text-[10px] md:text-xs text-slate-355 uppercase tracking-wider font-bold mb-1.5 block">Search & Select Customer *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type Name or Mobile No..."
                  value={custSearch}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setShowSuggestions(true);
                    if (!e.target.value) {
                      setSelectedDbCustomer(null);
                      setCustomerName("");
                      setCustomerPhone("");
                      setIsNewCustomer(false);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold placeholder-slate-500"
                />
                {custSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustSearch("");
                      setSelectedDbCustomer(null);
                      setCustomerName("");
                      setCustomerPhone("");
                      setIsNewCustomer(false);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions list */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-700 text-left">
                  {dbCustomers
                    .filter(c => 
                      c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                      c.phone.includes(custSearch)
                    )
                    .slice(0, 8)
                    .map(c => {
                      const lockDetails = getCustomerLockDetails(c);
                      return (
                        <div
                          key={c._id}
                          onClick={() => {
                            setSelectedDbCustomer(c);
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setCustSearch(`${c.name} (${c.phone})`);
                            setIsNewCustomer(false);
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-slate-750 cursor-pointer text-xs flex justify-between items-center transition-colors text-slate-200"
                        >
                          <div>
                            <p className="font-bold text-white flex items-center gap-1">
                              <span>👤 {c.name}</span>
                              {lockDetails.isLocked && <span className="text-[10px] text-rose-400 shrink-0 animate-pulse" title="Credit Locked">🔒</span>}
                              <span className="text-amber-400 font-normal text-[10px] ml-1">{"★".repeat(Math.floor(lockDetails.stars))}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mobile: {c.phone}</p>
                          </div>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-extrabold shrink-0">
                            Dues: ₹{c.balance.toLocaleString("en-IN")}
                          </span>
                        </div>
                      );
                    })}
                  
                  {custSearch.trim().length > 0 && (
                    <div
                      onClick={() => {
                        setIsNewCustomer(true);
                        setSelectedDbCustomer(null);
                        const isNum = /^\d+$/.test(custSearch.trim());
                        if (isNum) {
                          setCustomerPhone(custSearch.trim());
                          setCustomerName("");
                        } else {
                          setCustomerName(custSearch.trim());
                          setCustomerPhone("");
                        }
                        setShowSuggestions(false);
                      }}
                      className="p-3 hover:bg-slate-750 cursor-pointer text-xs text-blue-400 font-bold flex items-center gap-1.5 transition-colors border-t border-slate-700"
                    >
                      <span>➕ Create New Profile for &quot;{custSearch}&quot;</span>
                    </div>
                  )}

                  {dbCustomers.filter(c => 
                    c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                    c.phone.includes(custSearch)
                  ).length === 0 && !custSearch.trim() && (
                    <div className="p-3 text-slate-500 text-xs text-center">Type name/number to search...</div>
                  )}
                </div>
              )}
            </div>

            {/* Show details of selected customer */}
            {selectedDbCustomer && (
              <div className="bg-slate-800/80 p-3.5 rounded-xl space-y-2.5 border border-slate-700 text-xs text-slate-200 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-black">
                  <span>Ledger Status</span>
                  <span className={selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) ? "text-rose-400 font-black" : "text-emerald-400 font-black"}>
                    {selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) ? "⚠️ Limit Exceeded" : "🟢 Under Limit"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Outstanding:</span>
                  <span className="font-extrabold text-white">₹{selectedDbCustomer.balance.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Configured Limit:</span>
                  <span className="font-semibold text-slate-350">₹{(selectedDbCustomer.creditLimit || 10000).toLocaleString("en-IN")}</span>
                </div>
                
                {/* Utilization Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) 
                          ? 'bg-rose-500' 
                          : (selectedDbCustomer.balance / (selectedDbCustomer.creditLimit || 10000)) > 0.8 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(100, (selectedDbCustomer.balance / (selectedDbCustomer.creditLimit || 10000)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Warning if total will exceed limit */}
                {selectedDbCustomer.balance + totalCartAmount > (selectedDbCustomer.creditLimit || 10000) && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-350 p-2.5 rounded-lg font-bold text-[10px] mt-1.5 animate-pulse">
                    ⚠️ Limit Warning: Total outstanding dues will reach ₹{selectedDbCustomer.balance + totalCartAmount}, exceeding the limit of ₹{selectedDbCustomer.creditLimit || 10000}!
                  </div>
                )}

                {/* Dynamic Lock details and Trust Stars */}
                {(() => {
                  const lockDetails = getCustomerLockDetails(selectedDbCustomer);
                  const fullStars = Math.floor(lockDetails.stars);
                  const hasHalf = lockDetails.stars % 1 !== 0;
                  const emptyStars = 5 - Math.ceil(lockDetails.stars);
                  return (
                    <div className="space-y-2 border-t border-slate-700/50 pt-2.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span>Customer Rating:</span>
                        <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                          {"★".repeat(fullStars)}
                          {hasHalf ? "½" : ""}
                          {"☆".repeat(emptyStars)}
                          <span className="text-slate-400 text-[10px] ml-1 font-semibold">({lockDetails.stars}/5)</span>
                        </span>
                      </div>
                      {selectedDbCustomer.promiseDate && (
                        <div className="flex justify-between items-center">
                          <span>Repayment Promise Date:</span>
                          <span className={`font-bold ${new Date(selectedDbCustomer.promiseDate) < new Date() ? 'text-rose-400 font-black animate-pulse' : 'text-slate-300'}`}>
                            {new Date(selectedDbCustomer.promiseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {new Date(selectedDbCustomer.promiseDate) < new Date() && " (Overdue)"}
                          </span>
                        </div>
                      )}
                      {lockDetails.isLocked && (
                        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-350 p-2.5 rounded-lg font-extrabold text-[10px] mt-2 flex items-start gap-1.5">
                          <span className="animate-bounce mt-0.5">🔒</span>
                          <div>
                            <p className="uppercase text-rose-400 font-black">Credit Checkout Locked</p>
                            <p className="font-semibold text-slate-300 mt-0.5">{lockDetails.reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* If creating new customer */}
            {isNewCustomer && (
              <div className="space-y-3 pt-2.5 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border-none text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Customer Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-800 border-none text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Name</label>
              <input
                type="text"
                placeholder="Optional Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold bg-slate-700"
              />
            </div>

            <div className="mb-4">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Phone (WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold bg-slate-700"
              />
            </div>
          </>
        )}

        {/* Prescription Drug Section */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input 
              type="checkbox"
              checked={isPrescriptionRequired}
              onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
              className="rounded bg-slate-750 border-none text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-300 select-none">Schedule H / Rx Details</span>
          </label>

          {isPrescriptionRequired && (
            <div className="space-y-2 bg-slate-700/50 p-3 rounded-xl border border-slate-750 animate-in fade-in duration-200">
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Doctor Name</label>
                <input
                  type="text"
                  placeholder="Dr. John Doe"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Doctor Reg No.</label>
                <input
                  type="text"
                  placeholder="Reg No"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Patient Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-slate-700 border-none text-white rounded-lg px-2 py-1.5 text-xs outline-none cursor-pointer font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        id="main-checkout-btn"
        onClick={handleCheckout} 
        disabled={cart.length === 0 || checkoutLoading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm md:text-lg px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-extrabold"
      >
        {checkoutLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Complete Sale"}
      </button>
    </div>
  );
}
