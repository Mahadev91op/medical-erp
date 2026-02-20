import { AlertCircle, PackageCheck } from "lucide-react";

export default function ExpiryAlerts({ alerts = [] }) {
  // Din calculate karne ka function
  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const expDate = new Date(expiryDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-700 flex items-center">
          <span className="w-2 h-2 rounded-full bg-rose-400 mr-3 animate-pulse"></span>
          Expiring Next 90 Days
        </h2>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-10">
            <PackageCheck className="w-12 h-12 mb-3 text-emerald-400 opacity-50" />
            <p className="font-medium text-sm text-center">Sab badhiya hai!<br/>Koi dawa jaldi expire nahi ho rahi.</p>
          </div>
        ) : (
          alerts.map((med) => {
            const daysLeft = calculateDaysLeft(med.expiryDate);
            const isAlreadyExpired = daysLeft < 0;

            return (
              <div key={med._id} className={`flex justify-between items-center p-4 rounded-2xl border transition-colors group ${isAlreadyExpired ? 'bg-rose-100/80 border-rose-200' : 'bg-rose-50/40 border-rose-100/60 hover:bg-rose-50'}`}>
                <div>
                  <span className="font-bold text-slate-800 block group-hover:text-rose-600 transition-colors">{med.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">Batch: {med.batch} | Qty: {med.quantity}</span>
                </div>
                <div className="text-right">
                  <span className="text-rose-600 font-bold block text-sm">{new Date(med.expiryDate).toLocaleDateString('en-GB')}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg mt-1 inline-block uppercase tracking-wider ${isAlreadyExpired ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
                    {isAlreadyExpired ? 'Expired!' : `${daysLeft} Days left`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}