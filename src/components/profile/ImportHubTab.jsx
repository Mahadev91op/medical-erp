"use client";
import { useState, useEffect } from "react";
import { 
  Database, RefreshCw, AlertCircle, CheckCircle, 
  HelpCircle, Settings, Play, ShieldAlert, Cpu, Layers, HardDrive, Info, Upload
} from "lucide-react";
import toast from "react-hot-toast";

// Reusable premium Drag & Drop file input sub-component
function FileDragDrop({ file, setFile, accept, label }) {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center relative min-h-[140px] ${
          dragActive 
            ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
            : file 
              ? "border-emerald-300 bg-emerald-50/20" 
              : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
        }`}
      >
        {file && file.name ? (
          <div className="flex flex-col items-center space-y-2 select-none">
            <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />
            <div className="max-w-[240px] truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(file.size / 1024).toFixed(2)} KB - Ready to sync</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 underline cursor-pointer"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 pointer-events-none select-none">
            <Upload className="w-7 h-7 text-slate-400" />
            <p className="text-xs font-bold text-slate-600">
              Drag & Drop file here or <span className="text-blue-600 underline pointer-events-auto cursor-pointer font-extrabold">Browse</span>
            </p>
            <p className="text-[9px] text-slate-400 font-bold">Supported extensions: {accept}</p>
          </div>
        )}
        <input 
          type="file" 
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        />
      </div>
    </div>
  );
}

export default function ImportHubTab() {
  const [activeSoftware, setActiveSoftware] = useState("tally"); // tally, vyapar, busy, mybillbook, marg
  const [conflictMode, setConflictMode] = useState("skip"); // skip, overwrite, wipe
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Terminal log console state
  const [logs, setLogs] = useState([]);
  const [syncResult, setSyncResult] = useState(null);

  // Tally Config
  const [tallyUrl, setTallyUrl] = useState("http://127.0.0.1:9000");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Vyapar Config
  const [localVyaparPaths, setLocalVyaparPaths] = useState([]);
  const [selectedVyaparPath, setSelectedVyaparPath] = useState("");
  const [uploadedVyaparFile, setUploadedVyaparFile] = useState(null);
  const [vyaparSource, setVyaparSource] = useState("local"); // local, upload
  const [loadingLocalPaths, setLoadingLocalPaths] = useState(false);

  // Busy Config
  const [busyAction, setBusyAction] = useState("text"); // sql, text
  const [busySqlConfig, setBusySqlConfig] = useState({
    server: "localhost",
    port: "1433",
    database: "BUSYDATA",
    user: "sa",
    password: ""
  });
  const [busyUploadedFile, setBusyUploadedFile] = useState(null);

  // myBillBook Config
  const [myBillBookImportType, setMyBillBookImportType] = useState("items"); // items, parties
  const [myBillBookUploadedFile, setMyBillBookUploadedFile] = useState(null);

  // MargERP Config
  const [margImportType, setMargImportType] = useState("items"); // items, parties
  const [margUploadedFile, setMargUploadedFile] = useState(null);

  // Append a message to the diagnostics console
  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, text: message, type }]);
  };

  const fetchLocalVyaparPaths = async () => {
    setLoadingLocalPaths(true);
    try {
      const res = await fetch("/api/sync/vyapar");
      const data = await res.json();
      if (data.success && data.localPaths && data.localPaths.length > 0) {
        setLocalVyaparPaths(data.localPaths);
        setSelectedVyaparPath(data.localPaths[0]);
        addLog(`Auto-detected ${data.localPaths.length} Vyapar database paths.`, "success");
      } else {
        addLog("No default local Vyapar database path found. You can upload the vyapar.db or .vyb file manually.", "info");
      }
    } catch (e) {
      addLog("Failed to auto-detect local Vyapar databases.", "error");
    }
    setLoadingLocalPaths(false);
  };

  // Fetch local Vyapar paths on load
  useEffect(() => {
    if (activeSoftware === "vyapar") {
      fetchLocalVyaparPaths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSoftware]);

  // Fetch Tally Companies List
  const fetchTallyCompanies = async () => {
    setLoadingCompanies(true);
    setCompanies([]);
    addLog(`Connecting to TallyPrime Server at ${tallyUrl}...`, "info");
    try {
      const res = await fetch("/api/sync/tally", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "companies", tallyUrl })
      });
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
        if (data.companies.length > 0) {
          setSelectedCompany(data.companies[0]);
          addLog(`Success! Found ${data.companies.length} active Tally Companies.`, "success");
          toast.success("Tally connected successfully!");
        } else {
          addLog("Connected to Tally but no active companies found. Please open a company in TallyPrime.", "warning");
        }
      } else {
        addLog(data.error || "Failed to fetch companies from Tally.", "error");
        toast.error("Tally connection failed!");
      }
    } catch (err) {
      addLog("Network connection refused. Ensure TallyPrime is running and ODBC/XML port is active.", "error");
      toast.error("Connection refused!");
    }
    setLoadingCompanies(false);
  };

  // Main Sync Execution
  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLogs([]);
    setSyncResult(null);
    
    addLog(`Starting sync pipeline for ${activeSoftware.toUpperCase()}...`, "info");
    if (dryRun) {
      addLog("RUNNING IN SIMULATION (DRY RUN) MODE. Database will not be modified.", "warning");
    }

    try {
      let response;
      
      // 1. TALLY SYNC
      if (activeSoftware === "tally") {
        if (!selectedCompany) {
          toast.error("Please connect and select a company first!");
          setLoading(false);
          return;
        }
        addLog(`Requesting Stock Items and Ledgers for company: "${selectedCompany}"`, "info");
        response = await fetch("/api/sync/tally", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            tallyUrl,
            companyName: selectedCompany,
            dryRun,
            conflictMode
          })
        });
      }
      
      // 2. VYAPAR SYNC
      else if (activeSoftware === "vyapar") {
        if (vyaparSource === "upload") {
          if (!uploadedVyaparFile) {
            toast.error("Please drop or select your Vyapar database file!");
            setLoading(false);
            return;
          }
          addLog(`Uploading and processing database file: "${uploadedVyaparFile.name}"...`, "info");
          const formData = new FormData();
          formData.append("file", uploadedVyaparFile);
          formData.append("conflictMode", conflictMode);
          formData.append("dryRun", String(dryRun));
          
          response = await fetch("/api/sync/vyapar", {
            method: "POST",
            body: formData
          });
        } else {
          if (!selectedVyaparPath) {
            toast.error("Please select a local database path!");
            setLoading(false);
            return;
          }
          addLog(`Extracting directly from local path: "${selectedVyaparPath}"...`, "info");
          response = await fetch("/api/sync/vyapar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dbPath: selectedVyaparPath,
              dryRun,
              conflictMode
            })
          });
        }
      }
      
      // 3. BUSY ACCOUNTING
      else if (activeSoftware === "busy") {
        if (busyAction === "sql") {
          addLog("Connecting to MS SQL Server instance...", "info");
          response = await fetch("/api/sync/busy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sql",
              sqlConfig: busySqlConfig,
              dryRun,
              conflictMode
            })
          });
        } else {
          if (!busyUploadedFile) {
            toast.error("Please upload the exported Busy JSON data file!");
            setLoading(false);
            return;
          }
          addLog("Reading Busy JSON file...", "info");
          const text = await busyUploadedFile.text();
          response = await fetch("/api/sync/busy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "text",
              textData: text,
              dryRun,
              conflictMode
            })
          });
        }
      }
      
      // 4. MYBILLBOOK
      else if (activeSoftware === "mybillbook") {
        if (!myBillBookUploadedFile) {
          toast.error("Please upload the exported myBillBook spreadsheet/JSON file!");
          setLoading(false);
          return;
        }
        addLog(`Uploading myBillBook export file: "${myBillBookUploadedFile.name}"...`, "info");
        const formData = new FormData();
        formData.append("file", myBillBookUploadedFile);
        formData.append("importType", myBillBookImportType);
        formData.append("conflictMode", conflictMode);
        formData.append("dryRun", String(dryRun));
        
        response = await fetch("/api/sync/mybillbook", {
          method: "POST",
          body: formData
        });
      }

      // 5. MARGERP SYNC
      else if (activeSoftware === "marg") {
        if (!margUploadedFile) {
          toast.error("Please upload the Marg DBF or exported file!");
          setLoading(false);
          return;
        }
        addLog(`Uploading MargERP file: "${margUploadedFile.name}"...`, "info");
        const formData = new FormData();
        formData.append("file", margUploadedFile);
        formData.append("importType", margImportType);
        formData.append("conflictMode", conflictMode);
        formData.append("dryRun", String(dryRun));
        
        response = await fetch("/api/sync/marg", {
          method: "POST",
          body: formData
        });
      }

      const data = await response.json();

      if (data.success) {
        if (data.dryRun) {
          addLog("Dry run complete! Checked items schema details.", "success");
          addLog(`Result would add/modify: ${data.counts.medicines} Medicines, ${data.counts.customers} Customers, ${data.counts.distributors} Distributors.`, "success");
          setSyncResult(data);
          toast.success("Simulation complete! Check logs.");
        } else {
          addLog("Database sync transaction committed successfully!", "success");
          addLog(`Created/Updated: ${data.counts.medicines} Medicines, ${data.counts.customers} Customers, ${data.counts.distributors} Distributors.`, "success");
          toast.success("Data imported successfully!");
        }
      } else {
        addLog(`Import failed: ${data.error}`, "error");
        if (data.details) addLog(`Details: ${data.details}`, "error");
        toast.error(data.error || "Sync failed.");
      }

    } catch (err) {
      console.error(err);
      addLog(`Unexpected network error: ${err.message}`, "error");
      toast.error("Network error.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Upper Selector Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-blue-500" />
          1. Choose Source Accounting Software
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { id: "tally", name: "TallyPrime", desc: "Local XML Sync" },
            { id: "vyapar", name: "Vyapar App", desc: "SQLite / Backup" },
            { id: "busy", name: "Busy Accounting", desc: "SQL Server / JSON" },
            { id: "mybillbook", name: "myBillBook", desc: "Excel / JSON" },
            { id: "marg", name: "MargERP", desc: "Direct DBF / Excel" }
          ].map(sw => (
            <button
              type="button"
              key={sw.id}
              onClick={() => {
                setActiveSoftware(sw.id);
                setLogs([]);
                setSyncResult(null);
              }}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                activeSoftware === sw.id 
                  ? "ring-2 ring-blue-500 bg-blue-600 text-white border-blue-600 scale-[1.02] shadow-md shadow-blue-100" 
                  : "border-slate-200 text-slate-700 bg-white hover:border-slate-300 hover:scale-[1.01]"
              }`}
            >
              <span className="font-extrabold text-xs md:text-sm leading-tight">{sw.name}</span>
              <span className={`text-[9px] md:text-[10px] font-bold mt-1 ${activeSoftware === sw.id ? "text-blue-100" : "text-slate-400"}`}>
                {sw.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Form & Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Config Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <form onSubmit={handleSyncSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  2. Configure Connection Details
                </h3>
              </div>

              {/* Tally Config */}
              {activeSoftware === "tally" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Tally Server Endpoint URL</label>
                      <input 
                        type="text" 
                        value={tallyUrl}
                        onChange={(e) => setTallyUrl(e.target.value)}
                        placeholder="e.g. http://127.0.0.1:9000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={fetchTallyCompanies}
                        disabled={loadingCompanies}
                        className="w-full bg-slate-800 text-white hover:bg-slate-900 px-4 py-3 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {loadingCompanies ? <RefreshCw className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCw className="w-4 h-4" />}
                        Connect Tally
                      </button>
                    </div>
                  </div>

                  {companies.length > 0 && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select Active Tally Company</label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                      >
                        {companies.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Vyapar Config */}
              {activeSoftware === "vyapar" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          id="vyapar-local" 
                          name="vyapar-src" 
                          checked={vyaparSource === "local"} 
                          onChange={() => { setVyaparSource("local"); setUploadedVyaparFile(null); }} 
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="vyapar-local" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider cursor-pointer">
                          Option A: Local Vyapar Database Sync
                        </label>
                      </div>

                      {vyaparSource === "local" && (
                        <div className="pl-6 space-y-2 animate-in fade-in duration-200">
                          {loadingLocalPaths ? (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning local paths...</div>
                          ) : localVyaparPaths.length > 0 ? (
                            <select
                              value={selectedVyaparPath}
                              onChange={(e) => setSelectedVyaparPath(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                            >
                              {localVyaparPaths.map((p, i) => (
                                  <option key={i} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              Vyapar database path automatically nahi mila. Option B se file manually upload kijiye.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          id="vyapar-upload" 
                          name="vyapar-src" 
                          checked={vyaparSource === "upload"} 
                          onChange={() => { setVyaparSource("upload"); }} 
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="vyapar-upload" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider cursor-pointer">
                          Option B: Upload vyaparApp SQLite Database File
                        </label>
                      </div>

                      {vyaparSource === "upload" && (
                        <div className="pl-6 animate-in fade-in duration-200">
                          <FileDragDrop 
                            file={uploadedVyaparFile} 
                            setFile={setUploadedVyaparFile} 
                            accept=".db, .sqlite, .vyb" 
                            label="Upload Vyapar Database File" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Busy Config */}
              {activeSoftware === "busy" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex gap-4 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setBusyAction("text")}
                      className={`pb-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${busyAction === "text" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                    >
                      Option A: JSON Export File
                    </button>
                    <button
                      type="button"
                      onClick={() => setBusyAction("sql")}
                      className={`pb-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${busyAction === "sql" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                    >
                      Option B: Connect MS SQL Server
                    </button>
                  </div>

                  {busyAction === "text" ? (
                    <div className="p-2 animate-in fade-in duration-200">
                      <FileDragDrop 
                        file={busyUploadedFile} 
                        setFile={setBusyUploadedFile} 
                        accept=".txt, .json" 
                        label="Upload Busy Masters File" 
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">SQL Server Host/IP</label>
                        <input 
                          type="text" 
                          value={busySqlConfig.server}
                          onChange={(e) => setBusySqlConfig({...busySqlConfig, server: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">SQL Port</label>
                        <input 
                          type="text" 
                          value={busySqlConfig.port}
                          onChange={(e) => setBusySqlConfig({...busySqlConfig, port: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Database Name</label>
                        <input 
                          type="text" 
                          value={busySqlConfig.database}
                          onChange={(e) => setBusySqlConfig({...busySqlConfig, database: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">SQL User ID (SA)</label>
                        <input 
                          type="text" 
                          value={busySqlConfig.user}
                          onChange={(e) => setBusySqlConfig({...busySqlConfig, user: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">SQL Password</label>
                        <input 
                          type="password" 
                          value={busySqlConfig.password}
                          onChange={(e) => setBusySqlConfig({...busySqlConfig, password: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* myBillBook Config */}
              {activeSoftware === "mybillbook" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Import Type</label>
                      <select
                        value={myBillBookImportType}
                        onChange={(e) => setMyBillBookImportType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="items">Medicine Inventory / Stock Items</option>
                        <option value="parties">Parties Ledger (Customers & Suppliers)</option>
                      </select>
                    </div>

                    <div>
                      <FileDragDrop 
                        file={myBillBookUploadedFile} 
                        setFile={setMyBillBookUploadedFile} 
                        accept=".xlsx, .xls, .csv, .json" 
                        label="Upload myBillBook spreadsheet/JSON" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MargERP Config */}
              {activeSoftware === "marg" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Marg Import Type</label>
                      <select
                        value={margImportType}
                        onChange={(e) => setMargImportType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="items">Marg Product Master / Stock (e.g. PRO.DBF)</option>
                        <option value="parties">Marg Account Ledgers (e.g. ACCOUNTS.DBF / ORDER.DBF)</option>
                      </select>
                    </div>

                    <div>
                      <FileDragDrop 
                        file={margUploadedFile} 
                        setFile={setMargUploadedFile} 
                        accept=".dbf, .xlsx, .xls, .csv, .json" 
                        label="Upload Marg File (.DBF / Excel / JSON)" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conflict Resolution & Simulation controls */}
              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Duplicate/Conflict Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "skip", label: "Skip Dupes", desc: "Ignore existings" },
                      { id: "overwrite", label: "Overwrite", desc: "Update details" },
                      { id: "wipe", label: "Wipe All", desc: "Delete current" }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setConflictMode(opt.id)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                          conflictMode === opt.id 
                            ? "bg-slate-800 text-white border-slate-800 font-bold scale-[1.01]" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-xs font-extrabold">{opt.label}</span>
                        <span className="text-[8px] font-bold opacity-60 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="dryrun-chk"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
                    />
                    <label htmlFor="dryrun-chk" className="text-xs font-extrabold text-slate-800 uppercase tracking-wider cursor-pointer flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      Simulation Mode (Dry Run)
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal pl-7">
                    Database me kuch bhi change nahi hoga. Sirf process check karke preview generate hoga. Recommended before actual sync!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-200" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-blue-200" />
                      {dryRun ? "Start Simulation" : "Sync Data Now"}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <HelpCircle className="w-36 h-36" />
            </div>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                Pura Details - Step-by-Step Guide
              </h3>
            </div>

            {/* Instruction Body by Software */}
            {activeSoftware === "tally" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">Tally Configuration Steps (English):</span>
                  <ol className="list-decimal pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>Open <strong>TallyPrime</strong> on this computer.</li>
                    <li>Go to <strong>F12: Configuration</strong> &gt; <strong>Advanced Configuration</strong>.</li>
                    <li>Under Connectivity, set <strong>TallyPrime acts as</strong> to <strong>&quot;Both&quot;</strong>.</li>
                    <li>Set <strong>Client/Server Port</strong> to <code>9000</code>.</li>
                    <li>Save settings and <strong>Restart TallyPrime</strong>.</li>
                    <li>Ensure your company is open in Tally, then click <strong>&quot;Connect Tally&quot;</strong> above.</li>
                  </ol>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Tally Settings Hindi Details (Hinglish):</span>
                  <ul className="list-disc pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>Apne computer me TallyPrime khol kar rakhein.</li>
                    <li>Keyboard par <strong>F12</strong> daba kar <strong>Advanced Configuration</strong> me jayein.</li>
                    <li>Connectivity settings me port <strong>9000</strong> set karein aur client/server mode &quot;Both&quot; karein.</li>
                    <li>Tally restart karein aur connect tab daba kar select kijiye.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSoftware === "vyapar" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">Vyapar Database Sync (English):</span>
                  <ol className="list-decimal pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>Vyapar App stores data in a local SQLite file in Windows.</li>
                    <li>If you choose <strong>Option A</strong>, the system will auto-scan your AppData folder for <code>vyapar.db</code>.</li>
                    <li>If you choose <strong>Option B</strong>, manually upload the SQLite file from <code>%localappdata%/vyaparApp/</code>.</li>
                  </ol>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Vyapar Sync Steps (Hinglish):</span>
                  <ul className="list-disc pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>Vyapar ka data direct sync karne ke liye Option A select karein.</li>
                    <li>Manually database upload karne ke liye <code>%localappdata%/vyaparApp</code> se <strong>vyapar.db</strong> drag-drop karein.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSoftware === "busy" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">Busy Import Guide (English):</span>
                  <ol className="list-decimal pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li><strong>Option A:</strong> In Busy, go to <strong>Administration &gt; Data Export/Import &gt; Export Masters</strong>. Save files in JSON/Text format, and upload.</li>
                    <li><strong>Option B:</strong> For Busy SQL Server setup, enter your database host details to pull data.</li>
                  </ol>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Busy Sync Steps (Hinglish):</span>
                  <ul className="list-disc pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li><strong>Option A:</strong> Busy me Administration panel se Masters data JSON/Text file export karke upload karein.</li>
                    <li><strong>Option B:</strong> Agar Busy SQL setup use kar rahe hain toh SQL login details daalein.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSoftware === "mybillbook" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">myBillBook Excel/JSON Sync (English):</span>
                  <ol className="list-decimal pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>Login to myBillBook web dashboard.</li>
                    <li>Go to Items or Parties, click the **Export** button.</li>
                    <li>Upload the sheet/JSON file here. The headers will auto-map.</li>
                  </ol>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">myBillBook Sync Steps (Hinglish):</span>
                  <ul className="list-disc pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>myBillBook portal se Items ya Parties ka data Excel/JSON download karein.</li>
                    <li>Downloaded file ko bina edit kiye yahan drag-drop karke direct sync kijiye.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSoftware === "marg" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">MargERP Direct DBF Sync (English):</span>
                  <ol className="list-decimal pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>MargERP stores database locally using FoxPro/dBase `.DBF` files.</li>
                    <li>For stock items, upload the **`PRO.DBF`** file located inside your Marg data folder (e.g. `C:\margerp\data\&lt;company_code&gt;\PRO.DBF`).</li>
                    <li>For parties and ledger balances, upload **`ORDER.DBF`** or **`ACCOUNTS.DBF`** file.</li>
                    <li>You can also upload exported Excel files from Marg reports.</li>
                  </ol>
                </div>
                <div className="border-t border-slate-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">MargERP Sync Steps (Hinglish):</span>
                  <ul className="list-disc pl-4 text-xs font-bold space-y-2 text-slate-300 leading-relaxed">
                    <li>MargERP apna local database dBase/FoxPro format `.DBF` files me save karta hai.</li>
                    <li>Dawa ki list and stock feed karne ke liye Marg software folder me data dir ke andar se **PRO.DBF** file ko seedhe upload karein.</li>
                    <li>Bahi khata ledgers and suppliers import karne ke liye **ORDER.DBF** ya **ACCOUNTS.DBF** file drag-drop karein.</li>
                    <li>Marg se export ki gayi direct Excel sheet bhi support ki jati hai.</li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="border-t border-slate-800 pt-4 bg-slate-950/40 rounded-2xl p-4 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-slate-400 leading-normal">
                <strong>Precautions:</strong> Import karne se pehle apni safety ke liye **Database Backup** zaroor save kar lein. Wiping conflict modes poore user database ko wipe karke naya import set karegi.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-blue-400" />
            Diagnostics Console & Import Summary
          </h3>
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase font-bold">Status Panel</span>
        </div>

        <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-300 h-44 overflow-y-auto space-y-1.5 border border-slate-800/80">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic text-[11px]">No logs generated. Choose a software and click Sync to start.</p>
          ) : (
            logs.map((log, index) => {
              let textClass = "text-slate-300";
              if (log.type === "success") textClass = "text-emerald-400 font-bold";
              if (log.type === "error") textClass = "text-rose-400 font-bold";
              if (log.type === "warning") textClass = "text-amber-400 font-bold";
              return (
                <div key={index} className="flex gap-2">
                  <span className="text-slate-600 font-semibold shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={textClass}>{log.text}</span>
                </div>
              );
            })
          )}
        </div>

        {syncResult && syncResult.dryRun && syncResult.preview && (
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 animate-in zoom-in-95 duration-200">
            <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Simulation Data Preview (First 5 Items found):
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left font-bold">
                    <th className="py-2 px-3">Item Name</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">MRP (Rs)</th>
                    <th className="py-2 px-3">Expiry Date</th>
                    <th className="py-2 px-3">Distributor</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.preview.medicines && syncResult.preview.medicines.length > 0 ? (
                    syncResult.preview.medicines.map((med, i) => (
                      <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-white">{med.name}</td>
                        <td className="py-2 px-3 font-mono">{med.batch}</td>
                        <td className="py-2 px-3 font-bold text-blue-400">{med.quantity}</td>
                        <td className="py-2 px-3 font-bold">{med.mrp}</td>
                        <td className="py-2 px-3">{new Date(med.expiryDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3 truncate max-w-[120px]">{med.distributor}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-slate-500">No stock medicines found in simulation payload.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
