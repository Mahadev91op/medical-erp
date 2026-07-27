import React from "react";

const ReportsSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-72 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Grid of Flash Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Date filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Chart and Details Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
          <div className="h-64 bg-slate-50 rounded-2xl flex items-end justify-between p-4">
            {[30, 50, 40, 70, 60, 80, 50, 90, 75, 85].map((h, idx) => (
              <div key={idx} className="w-full mx-1.5 bg-slate-200 rounded-t-md" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 rounded-md"></div>
                  <div className="h-2.5 w-16 bg-slate-200 rounded-md"></div>
                </div>
                <div className="h-5 w-10 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSkeleton;
