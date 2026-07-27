import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg"></div>
            </div>
            <div className="h-8 w-20 bg-slate-200 rounded-lg mt-2"></div>
            <div className="h-3 w-36 bg-slate-200 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Split Layout: Chart and Expiry Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Large Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-48 bg-slate-200 rounded-md"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
              <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
          <div className="h-64 bg-slate-50 rounded-2xl flex items-end justify-between p-4 pt-10">
            {[40, 60, 45, 80, 50, 75, 90, 65, 55, 70, 85, 95].map((h, idx) => (
              <div key={idx} className="w-full mx-1 bg-slate-200 rounded-t-md" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        {/* Right Side: List Area */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
            <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                </div>
                <div className="h-6 w-12 bg-rose-100/60 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
