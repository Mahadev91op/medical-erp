import React from "react";
import { ShoppingCart, ScanBarcode, Trash2 } from "lucide-react";
import { formatExpiryDate } from "@/lib/formatDate";
import toast from "react-hot-toast";

export default function SellCart({ cart, setCart, removeItem }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[250px] md:min-h-[300px]">
      <h2 className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 md:mb-4 flex items-center">
        <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Current Cart
      </h2>
      
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 md:h-48 text-slate-400">
          <ScanBarcode className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 opacity-20" />
          <p className="font-medium text-xs md:text-sm">Cart is empty. Scan a barcode.</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {cart.map((item) => {
            const discPercent = item.discountPercent || 0;
            const discountedPrice = (item.sellMrp || item.mrp || 0) * (1 - discPercent / 100);
            const itemTotal = discountedPrice * item.sellQuantity;
            const maxQty = item.sellUnit === "strip" ? Math.floor(item.quantity / (item.tabletsPerStrip || 1)) : item.quantity;
            
            return (
              <div key={`${item._id}_${item.sellUnit}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100 gap-3 sm:gap-0 animate-in fade-in duration-200">
                <div className="flex-1 pr-0 sm:pr-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm md:text-lg truncate">{item.name}</p>
                    {item.isLoose && item.tabletsPerStrip > 1 && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${
                        item.sellUnit === 'strip' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {item.sellUnit === 'strip' ? 'Strip (Patta)' : 'Loose / Tab'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 mb-1.5 md:mb-2">
                    <span className="text-[9px] md:text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Batch: {item.batch}</span>
                    <span className="text-[9px] md:text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Exp: {formatExpiryDate(item.expiryDate)}</span>
                    {item.rackNumber && <span className="text-[9px] md:text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Rack: {item.rackNumber}</span>}
                    {item.distributor && <span className="text-[9px] md:text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-w-[100px] md:max-w-[120px] truncate">Dist: {item.distributor}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {/* Unit price display */}
                    <div className="text-xs md:text-sm text-blue-600 font-extrabold flex items-center">
                      {discPercent > 0 ? (
                        <>
                          <span className="line-through text-slate-400 mr-1.5 font-semibold">₹{item.sellMrp || item.mrp || 0}</span>
                          <span>₹{discountedPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        `₹${item.sellMrp || item.mrp || 0}`
                      )} <span className="text-[9px] text-slate-400 font-bold ml-1">/ {item.sellUnit === 'strip' ? 'strip' : 'unit'}</span>
                    </div>

                    {/* GST Slab Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">GST:</span>
                      <select
                        value={item.gstPercent || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCart(cart.map(c => (c._id === item._id && c.sellUnit === item.sellUnit) ? { ...c, gstPercent: val } : c));
                        }}
                        className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer h-6"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                      </select>
                    </div>

                    {/* Discount Input */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Disc %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={item.discountPercent || ""}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                          setCart(cart.map(c => (c._id === item._id && c.sellUnit === item.sellUnit) ? { ...c, discountPercent: val } : c));
                        }}
                        className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded focus:outline-none w-10 text-center h-6"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 md:space-x-4 shrink-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-slate-100">
                  <div className="flex items-center space-x-1.5 bg-slate-50 sm:bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.sellQuantity > 1) {
                          setCart(cart.map(c => (c._id === item._id && c.sellUnit === item.sellUnit) ? { ...c, sellQuantity: c.sellQuantity - 1 } : c));
                        } else {
                          removeItem(item._id, item.sellUnit);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-colors text-sm focus:outline-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQty}
                      value={item.sellQuantity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1));
                        setCart(cart.map(c => (c._id === item._id && c.sellUnit === item.sellUnit) ? { ...c, sellQuantity: val } : c));
                      }}
                      className="w-10 text-center font-bold text-slate-800 focus:outline-none text-xs md:text-sm bg-transparent border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (item.sellQuantity < maxQty) {
                          setCart(cart.map(c => (c._id === item._id && c.sellUnit === item.sellUnit) ? { ...c, sellQuantity: c.sellQuantity + 1 } : c));
                        } else {
                          toast.error("Cannot add more! Insufficient stock.");
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-colors text-sm focus:outline-none"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-bold text-base md:text-lg text-slate-800 min-w-[50px] md:min-w-[60px] text-right">
                    ₹{itemTotal.toFixed(2)}
                  </div>
                  <button onClick={() => removeItem(item._id, item.sellUnit)} className="p-1.5 md:p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg md:rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
