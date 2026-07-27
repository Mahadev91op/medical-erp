import React from "react";
import { X, Search, Printer, Package, Receipt } from "lucide-react";

export default function ReportTabs({
  isOpen,
  onClose,
  activeReportTab,
  setActiveReportTab,
  data,
  localSearchQuery,
  setLocalSearchQuery,
  modalSearchQuery,
  dateFilter,
  setDateFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  customDays,
  setCustomDays,
  itemsPage,
  setItemsPage,
  billsPage,
  setBillsPage,
  ITEMS_PER_PAGE,
  setPrintingInvoice,
  handleReportsWhatsAppSend,
  getSelectedDateLabel
}) {
  if (!isOpen) return null;

  const renderPagination = (currentPage, totalItems, onPageChange) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-100 mt-4 bg-white px-4 py-3 sm:px-6 rounded-xl font-sans">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">
              Showing <span className="font-bold text-slate-700">{Math.min(totalItems, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
              <span className="font-bold text-slate-700">{Math.min(totalItems, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
              <span className="font-bold text-slate-700">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                First
              </button>
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Last
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-indigo-500" />
            Sales Report ({getSelectedDateLabel()})
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 px-4 md:px-6 bg-slate-50/50">
          <button
            onClick={() => { setActiveReportTab("items"); setLocalSearchQuery(""); }}
            className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${activeReportTab === "items" ? "border-blue-500 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Sold Medicines
          </button>
          <button
            onClick={() => { setActiveReportTab("bills"); setLocalSearchQuery(""); }}
            className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${activeReportTab === "bills" ? "border-blue-500 text-blue-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            Receipt Invoices
          </button>
        </div>

        {/* Search Input Bar & Date Filter */}
        <div className="p-4 md:p-6 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeReportTab === "items" 
                  ? "Search by medicine name or receipt number..." 
                  : "Search by invoice, medicine, customer name or phone..."
              }
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-10 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
            />
            {localSearchQuery && (
              <button 
                onClick={() => setLocalSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Date Range:</span>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-3 py-2 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer h-10 md:h-12"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="15days">Last 15 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="60days">Last 60 Days</option>
              <option value="90days">Last 90 Days (3 Months)</option>
              <option value="customDays">Custom Days Count</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === "customDays" && (
              <input 
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 10))}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 text-xs font-bold w-20 text-center h-10 md:h-12"
              />
            )}

            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-xl h-10 md:h-12">
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-bold focus:outline-none"
                />
                <span className="text-slate-400 font-bold text-xs">to</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-bold focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
          {activeReportTab === "items" ? (
            (() => {
              const filteredTransactions = (data.todayOverview?.transactions || []).filter((tx) => {
                const query = modalSearchQuery.trim().toLowerCase();
                if (!query) return true;
                return (
                  tx.name?.toLowerCase().includes(query) ||
                  tx.billNumber?.toLowerCase().includes(query)
                );
              });

              if (filteredTransactions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-sm md:text-base font-medium">
                      {modalSearchQuery ? "No medicines matching your search query. 🔍" : "No sales recorded for this range. 😴"}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                          <th className="p-3 md:p-4 font-bold">#</th>
                          <th className="p-3 md:p-4 font-bold">Receipt</th>
                          <th className="p-3 md:p-4 font-bold">Medicine</th>
                          <th className="p-3 md:p-4 font-bold text-center">Qty</th>
                          <th className="p-3 md:p-4 font-bold text-center">MRP</th>
                          <th className="p-3 md:p-4 font-bold text-center">Pay Mode</th>
                          <th className="p-3 md:p-4 font-bold text-right">Total Price</th>
                          <th className="p-3 md:p-4 font-bold text-right">Date & Time</th>
                          <th className="p-3 md:p-4 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                        {filteredTransactions.slice((itemsPage - 1) * ITEMS_PER_PAGE, itemsPage * ITEMS_PER_PAGE).map((tx, index) => {
                          const txDate = new Date(tx.date);
                          const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                          const dateStr = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                          
                          const parentSale = (data.todayOverview?.sales || []).find(s => s._id === tx.saleId);
                          const billNo = tx.billNumber || "N/A";

                          return (
                            <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                              <td className="p-3 md:p-4 text-slate-400">{(itemsPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                              <td className="p-3 md:p-4 font-medium text-slate-500">#{billNo}</td>
                              <td className="p-3 md:p-4">
                                <p className="font-bold text-slate-800">{tx.name}</p>
                              </td>
                              <td className="p-3 md:p-4 text-center">
                                <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                  {tx.quantity} pcs
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-center font-medium text-slate-600">₹{tx.mrp}</td>
                              <td className="p-3 md:p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : tx.paymentMethod === 'Card' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {tx.paymentMethod}
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-right font-extrabold text-slate-700">₹{tx.total.toLocaleString('en-IN')}</td>
                              <td className="p-3 md:p-4 text-right whitespace-nowrap">
                                <span className="font-bold text-slate-700 block">{dateStr}</span>
                                <span className="text-[11px] text-slate-400 font-semibold">{timeStr}</span>
                              </td>
                              <td className="p-3 md:p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (parentSale) {
                                        setPrintingInvoice({
                                          billNumber: billNo,
                                          date: parentSale.date || parentSale.createdAt,
                                          items: parentSale.items,
                                          totalAmount: parentSale.totalAmount,
                                          paymentMethod: parentSale.paymentMethod || "Cash",
                                          customerName: parentSale.customerName || "",
                                          customerPhone: parentSale.customerPhone || ""
                                        });
                                      } else {
                                        setPrintingInvoice({
                                          billNumber: billNo,
                                          date: tx.date,
                                          items: [{ name: tx.name, quantity: tx.quantity, mrp: tx.mrp, total: tx.total }],
                                          totalAmount: tx.total,
                                          paymentMethod: tx.paymentMethod || "Cash",
                                          customerName: "",
                                          customerPhone: ""
                                        });
                                      }
                                    }}
                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="Print / Reprint Thermal Invoice"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      if (parentSale) {
                                        handleReportsWhatsAppSend({
                                          billNumber: billNo,
                                          date: parentSale.date || parentSale.createdAt,
                                          items: parentSale.items,
                                          totalAmount: parentSale.totalAmount,
                                          paymentMethod: parentSale.paymentMethod || "Cash",
                                          customerPhone: parentSale.customerPhone || "",
                                          customerName: parentSale.customerName || ""
                                        });
                                      } else {
                                        handleReportsWhatsAppSend({
                                          billNumber: billNo,
                                          date: tx.date,
                                          items: [{ name: tx.name, quantity: tx.quantity, mrp: tx.mrp, total: tx.total }],
                                          totalAmount: tx.total,
                                          paymentMethod: tx.paymentMethod || "Cash",
                                          customerPhone: "",
                                          customerName: ""
                                        });
                                      }
                                    }}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="Share Invoice on WhatsApp"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.45 5.411 1.451 5.928 0 10.755-4.827 10.758-10.758.002-2.874-1.116-5.576-3.149-7.61S14.887 2.19 12.012 2.19c-5.93 0-10.757 4.827-10.76 10.759-.001 2.02.527 3.997 1.528 5.724L1.87 21.8l3.32-.872zM17.487 14.39c-.3-.15-1.78-.878-2.079-.988-.3-.109-.519-.163-.739.163-.22.327-.852.988-1.045 1.21-.193.22-.386.248-.686.098-.3-.15-1.265-.466-2.41-1.488-.89-.794-1.49-1.776-1.665-2.076-.175-.3-.019-.462.13-.611.135-.133.3-.35.45-.525.15-.175.2-.299.3-.499.1-.2.05-.374-.025-.524-.075-.15-.739-1.78-1.012-2.438-.266-.643-.538-.553-.739-.563-.19-.01-.409-.01-.629-.01s-.578.083-.88.408c-.301.327-1.15 1.12-1.15 2.729s1.17 3.16 1.33 3.38c.163.22 2.3 3.51 5.57 4.92.778.336 1.385.537 1.857.687.782.248 1.49.213 2.05.13.628-.094 1.78-.729 2.03-1.43c.25-.701.25-1.3.175-1.43-.075-.13-.275-.205-.575-.355z"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(itemsPage, filteredTransactions.length, setItemsPage)}
                </>
              );
            })()
          ) : (
            (() => {
              const filteredSales = (data.todayOverview?.sales || []).filter((sale) => {
                const query = modalSearchQuery.trim().toLowerCase();
                if (!query) return true;
                const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "";
                const customerName = (sale.customerName || "").toLowerCase();
                const customerPhone = (sale.customerPhone || "").toLowerCase();
                const paymentMethod = (sale.paymentMethod || "").toLowerCase();
                const matchesItems = (sale.items || []).some(item => item.name?.toLowerCase().includes(query));
                return (
                  billNo.includes(query) ||
                  customerName.includes(query) ||
                  customerPhone.includes(query) ||
                  paymentMethod.includes(query) ||
                  matchesItems
                );
              });

              if (filteredSales.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-sm md:text-base font-medium">
                      {modalSearchQuery ? "No invoices matching your search query. 🔍" : "No invoices generated in this range. 😴"}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                          <th className="p-3 md:p-4 font-bold">#</th>
                          <th className="p-3 md:p-4 font-bold">Invoice Receipt</th>
                          <th className="p-3 md:p-4 font-bold">Customer Info</th>
                          <th className="p-3 md:p-4 font-bold">Medicines (Items)</th>
                          <th className="p-3 md:p-4 font-bold text-center">Payment Mode</th>
                          <th className="p-3 md:p-4 font-bold text-right">Grand Total</th>
                          <th className="p-3 md:p-4 font-bold text-right">Date & Time</th>
                          <th className="p-3 md:p-4 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                        {filteredSales.slice((billsPage - 1) * ITEMS_PER_PAGE, billsPage * ITEMS_PER_PAGE).map((sale, index) => {
                          const txDate = new Date(sale.date || sale.createdAt);
                          const timeStr = txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                          const dateStr = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                          const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "N/A";
                          return (
                            <tr key={sale._id || index} className="hover:bg-slate-50/20 transition-colors">
                              <td className="p-3 md:p-4 text-slate-400">{(billsPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                              <td className="p-3 md:p-4 font-extrabold text-slate-800">#{billNo}</td>
                              <td className="p-3 md:p-4">
                                {sale.customerName || sale.customerPhone ? (
                                  <div>
                                    <p className="font-bold text-slate-800 leading-tight">{sale.customerName || "Customer"}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sale.customerPhone || "N/A"}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Walk-in Customer</span>
                                )}
                              </td>
                              <td className="p-3 md:p-4 max-w-[220px]" title={sale.items.map(item => `${item.name} (${item.quantity})`).join(", ")}>
                                <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                                  {sale.items.map((item, idx) => (
                                    <span key={idx} className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                                      {item.name} <span className="text-blue-600 font-bold">x{item.quantity}</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 md:p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sale.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : sale.paymentMethod === 'Card' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {sale.paymentMethod || "Cash"}
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-right font-extrabold text-slate-800 text-sm md:text-base">
                                ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 md:p-4 text-right whitespace-nowrap">
                                <span className="font-bold text-slate-700 block">{dateStr}</span>
                                <span className="text-[11px] text-slate-400 font-semibold">{timeStr}</span>
                              </td>
                              <td className="p-3 md:p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setPrintingInvoice({
                                        billNumber: billNo,
                                        date: sale.date || sale.createdAt,
                                        items: sale.items,
                                        totalAmount: sale.totalAmount,
                                        paymentMethod: sale.paymentMethod || "Cash",
                                        customerName: sale.customerName || "",
                                        customerPhone: sale.customerPhone || ""
                                      });
                                    }}
                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="Print / Reprint Thermal Invoice"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      handleReportsWhatsAppSend({
                                        billNumber: billNo,
                                        date: sale.date || sale.createdAt,
                                        items: sale.items,
                                        totalAmount: sale.totalAmount,
                                        paymentMethod: sale.paymentMethod || "Cash",
                                        customerPhone: sale.customerPhone || "",
                                        customerName: sale.customerName || ""
                                      });
                                    }}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="Share Invoice on WhatsApp"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.419 1.452 5.539 0 10.048-4.509 10.051-10.05.002-2.685-1.033-5.207-2.909-7.086C17.332 1.59 14.815.556 12.013.556c-5.545 0-10.055 4.51-10.059 10.051-.001 1.922.502 3.8 1.455 5.409L2.39 20.37l4.257-1.116-.001-.001zm11.367-7.611c-.302-.15-1.785-.882-2.057-.982-.272-.099-.47-.15-.668.15-.198.298-.767.982-.94 1.181-.173.199-.347.224-.649.075-.3-.15-1.268-.467-2.417-1.493-.893-.797-1.496-1.782-1.671-2.08-.174-.3-.018-.463.132-.612.135-.133.302-.35.452-.525.15-.175.2-.299.3-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.785-.73 2.033-1.433.248-.703.248-1.306.173-1.432-.074-.128-.272-.203-.574-.353z"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(billsPage, filteredSales.length, setBillsPage)}
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
