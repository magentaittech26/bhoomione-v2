import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, CheckCircle, Clock, AlertTriangle, CreditCard, Send, Download, 
  Search, Plus, Filter, TrendingUp, DollarSign, History, User, RefreshCw,
  Percent, ArrowLeftRight, Activity, Calendar, AlertCircle, Printer, HelpCircle
} from "lucide-react";
import api from "../../lib/api.ts";

interface InvoiceConsoleProps {
  tenants: any[];
  onShowToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function InvoiceConsole({ tenants, onShowToast }: InvoiceConsoleProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tenantFilter, setTenantFilter] = useState("ALL");
  
  // Modal controls
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [compileModalOpen, setCompileModalOpen] = useState(false);
  const [ledgerTenantId, setLedgerTenantId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "UPI",
    reference_id: "",
    remarks: ""
  });

  const [creditForm, setCreditForm] = useState({
    type: "CREDIT_NOTE", // CREDIT_NOTE or REFUND
    amount: "",
    reason: ""
  });

  const [compileForm, setCompileForm] = useState({
    tenant_id: "",
    invoice_number: "",
    billing_period: `${new Date().toLocaleString("default", { month: "short" })} ${new Date().getFullYear()}`,
    subscription_plan_code: "PROFESSIONAL",
    base_amount: "9900",
    state_code: "KA" // Default Karnataka for CGST/SGST splitting
  });

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Sync invoice details when main list updates if modal is open
  useEffect(() => {
    if (selectedInvoice) {
      const updated = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updated && updated.outstanding_balance !== selectedInvoice.outstanding_balance) {
        // Re-fetch details to sync payment list and audit history
        fetchInvoiceDetails(selectedInvoice.id);
      }
    }
  }, [invoices]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.fetchInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error(err);
      onShowToast("Failed to connect to the database to fetch invoices.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (id: string) => {
    try {
      const data = await api.fetchInvoiceDetails(id);
      setSelectedInvoice(data);
    } catch (err: any) {
      console.error(err);
      onShowToast("Failed to fetch detailed records for this invoice.", "error");
    }
  };

  // Record Payment Submit
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      onShowToast("Please enter a valid payment amount.", "warning");
      return;
    }

    if (amt > parseFloat(selectedInvoice.outstanding_balance)) {
      onShowToast(`Payment cannot exceed the outstanding balance of ₹${parseFloat(selectedInvoice.outstanding_balance).toLocaleString('en-IN')}`, "warning");
      return;
    }

    try {
      const res = await api.recordInvoicePayment(selectedInvoice.id, paymentForm);
      if (res.success) {
        onShowToast(res.message, "success");
        setPaymentModalOpen(false);
        // Clear form
        setPaymentForm({
          amount: "",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: "UPI",
          reference_id: "",
          remarks: ""
        });
        // Refresh detail modal content and list
        await fetchInvoiceDetails(selectedInvoice.id);
        await loadInvoices();
        if (ledgerTenantId) {
          loadLedger(ledgerTenantId);
        }
      } else {
        onShowToast(res.message || "Failed to record payment.", "error");
      }
    } catch (err: any) {
      console.error(err);
      onShowToast("Error persisting transaction to PostgreSQL database.", "error");
    }
  };

  // Issue Credit Note or Refund Submit
  const handleIssueCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(creditForm.amount);
    if (isNaN(amt) || amt <= 0) {
      onShowToast("Please enter a valid adjustment amount.", "warning");
      return;
    }

    if (creditForm.type === "CREDIT_NOTE" && amt > parseFloat(selectedInvoice.outstanding_balance)) {
      onShowToast(`Credit Note amount cannot exceed the outstanding balance of ₹${parseFloat(selectedInvoice.outstanding_balance).toLocaleString('en-IN')}`, "warning");
      return;
    }

    try {
      const res = await api.issueInvoiceCreditNote(selectedInvoice.id, creditForm);
      if (res.success) {
        onShowToast(res.message, "success");
        setCreditModalOpen(false);
        setCreditForm({
          type: "CREDIT_NOTE",
          amount: "",
          reason: ""
        });
        await fetchInvoiceDetails(selectedInvoice.id);
        await loadInvoices();
        if (ledgerTenantId) {
          loadLedger(ledgerTenantId);
        }
      } else {
        onShowToast(res.message || "Failed to issue adjustment.", "error");
      }
    } catch (err: any) {
      console.error(err);
      onShowToast("Error recording credit adjustment to database.", "error");
    }
  };

  // Dispatch Email Integration
  const handleSendEmail = async (id: string, code: string) => {
    try {
      onShowToast(`Triggering SMTP relay server for Invoice #${code}...`, "info");
      const res = await api.sendInvoiceEmail(id);
      if (res.success) {
        onShowToast(`Invoice #${code} emailed successfully to tenant billing contacts.`, "success");
        if (selectedInvoice && selectedInvoice.id === id) {
          await fetchInvoiceDetails(id);
        }
      } else {
        onShowToast(res.message || "Failed to dispatch email template.", "error");
      }
    } catch (err: any) {
      console.error(err);
      onShowToast("Failed to execute SMTP send request.", "error");
    }
  };

  // Helper to generate next unique invoice code
  const generateNextInvoiceCode = (existingInvoices: any[]): string => {
    const year = new Date().getFullYear();
    const prefix = `BO-INV-${year}-`;
    
    let maxNum = 0;
    const regex = new RegExp(`^BO-INV-${year}-(\\d+)$`);
    
    existingInvoices.forEach(inv => {
      const num = inv.invoice_number;
      if (num) {
        const match = regex.exec(num);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) {
            maxNum = val;
          }
        }
      }
    });
    
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}${padded}`;
  };

  // Helper to suggest next code when duplicate is entered
  const getSuggestedNextCode = (inputCode: string, existingInvoices: any[]): string => {
    const match = inputCode.match(/^(.*?)(\d+)$/);
    if (match) {
      const base = match[1];
      let maxNum = parseInt(match[2], 10);
      
      existingInvoices.forEach(inv => {
        if (inv.invoice_number && inv.invoice_number.startsWith(base)) {
          const numPart = inv.invoice_number.slice(base.length);
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > maxNum) {
            maxNum = parsed;
          }
        }
      });
      return `${base}${String(maxNum + 1).padStart(match[2].length, '0')}`;
    }
    return generateNextInvoiceCode(existingInvoices);
  };

  // Compile Dynamic Invoice
  const handleCompileInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compileForm.tenant_id) {
      onShowToast("Please select a target Tenant Workspace.", "warning");
      return;
    }
    const invNum = compileForm.invoice_number.trim();
    if (!invNum) {
      onShowToast("Please enter a unique Invoice Code.", "warning");
      return;
    }

    // Check for duplicate invoice code
    const isDuplicate = invoices.some(inv => inv.invoice_number.toLowerCase() === invNum.toLowerCase());
    if (isDuplicate) {
      const suggestion = getSuggestedNextCode(invNum, invoices);
      onShowToast(`Invoice code already exists. Suggested next code: ${suggestion}`, "warning");
      return;
    }

    try {
      const base = parseFloat(compileForm.base_amount) || 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      // GST Tax Calculation splits based on State code
      if (compileForm.state_code === "KA") {
        cgst = base * 0.09;
        sgst = base * 0.09;
      } else {
        igst = base * 0.18;
      }

      const selectedPlan = compileForm.subscription_plan_code;
      const selectedPlanName = `${selectedPlan.charAt(0) + selectedPlan.slice(1).toLowerCase()} Enterprise Suite`;

      const payload = {
        tenant_id: compileForm.tenant_id,
        invoice_number: compileForm.invoice_number,
        billing_period: compileForm.billing_period,
        subscription_plan_code: selectedPlan,
        subscription_plan_name: selectedPlanName,
        base_amount: base,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst
      };

      const invoice = await api.createInvoice(payload);
      if (invoice && invoice.id) {
        onShowToast(`Invoice ${invoice.invoice_number} successfully compiled and persisted.`, "success");
        setCompileModalOpen(false);
        // Clear form
        setCompileForm({
          tenant_id: "",
          invoice_number: "",
          billing_period: `${new Date().toLocaleString("default", { month: "short" })} ${new Date().getFullYear()}`,
          subscription_plan_code: "PROFESSIONAL",
          base_amount: "9900",
          state_code: "KA"
        });
        await loadInvoices();
      } else {
        onShowToast("Failed to compile subscription invoice.", "error");
      }
    } catch (err: any) {
      console.error(err);
      onShowToast("Validation Error: Check if Invoice Number already exists.", "error");
    }
  };

  // Load Tenant ledger
  const loadLedger = async (tenantId: string) => {
    if (!tenantId || tenantId === "ALL") {
      setLedgerData(null);
      return;
    }
    setLedgerLoading(true);
    try {
      const data = await api.fetchTenantLedger(tenantId);
      setLedgerData(data);
    } catch (err: any) {
      console.error(err);
      onShowToast("Failed to fetch general financial ledger logs for this workspace.", "error");
    } finally {
      setLedgerLoading(false);
    }
  };

  // Generate beautiful printable GST PDF dynamically
  const triggerPdfPrint = (invoice: any) => {
    if (!invoice) return;

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const baseAmount = parseFloat(invoice.base_amount);
    const cgst = parseFloat(invoice.cgst_amount);
    const sgst = parseFloat(invoice.sgst_amount);
    const igst = parseFloat(invoice.igst_amount);
    const taxTotal = parseFloat(invoice.total_tax_amount);
    const grandTotal = parseFloat(invoice.total_invoice_amount);
    const balance = parseFloat(invoice.outstanding_balance);

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; font-size: 13px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
            .logo { font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
            .meta-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .meta-col { width: 45%; }
            .meta-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
            .meta-val { font-size: 14px; font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 11px; padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; }
            .text-right { text-align: right; }
            .totals-container { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-box { width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .grand-total { font-size: 16px; font-weight: 800; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 12px; }
            .status-banner { background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 6px; font-weight: 700; text-align: center; margin-bottom: 30px; }
            .status-banner.unpaid { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
            .status-banner.overdue { background-color: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">BhoomiOne V3</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Unified SaaS Property & Tenant Platform</div>
            </div>
            <div style="text-align: right;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a;">TAX INVOICE</h1>
              <div style="font-family: monospace; font-weight: bold; margin-top: 5px;">#${invoice.invoice_number}</div>
            </div>
          </div>

          <div class="status-banner ${balance <= 0 ? 'paid' : invoice.status === 'OVERDUE' ? 'overdue' : 'unpaid'}">
            PAYMENT STATUS: ${invoice.status} ${balance > 0 ? `(Outstanding: ₹${balance.toLocaleString('en-IN')})` : ''}
          </div>

          <div class="meta-section">
            <div class="meta-col">
              <div class="meta-title">BILLED TO:</div>
              <div class="meta-val">${invoice.tenant_name || 'Bhoomi Workspace Partner'}</div>
              <div style="color: #64748b; margin-top: 4px;">Tenant Code: ${invoice.tenant_code || 'N/A'}</div>
            </div>
            <div class="meta-col" style="text-align: right;">
              <div class="meta-title">INVOICE METRIC:</div>
              <div style="font-weight: 600;">Billing Cycle: ${invoice.billing_period}</div>
              <div style="color: #64748b; margin-top: 4px;">Issued At: ${new Date(invoice.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service Plan & Description</th>
                <th class="text-right">Rate</th>
                <th class="text-right">GST Rate</th>
                <th class="text-right">Net Base (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${invoice.subscription_plan_name} Subscription Charge</strong>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Active cloud container provisioning, mapping GIS services & storage modules.</div>
                </td>
                <td class="text-right">₹${baseAmount.toLocaleString('en-IN')}</td>
                <td class="text-right">18.00%</td>
                <td class="text-right">₹${baseAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-container">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal (Net):</span>
                <span>₹${baseAmount.toLocaleString('en-IN')}</span>
              </div>
              ${cgst > 0 ? `
              <div class="total-row">
                <span>Central GST (CGST - 9%):</span>
                <span>₹${cgst.toLocaleString('en-IN')}</span>
              </div>
              <div class="total-row">
                <span>State GST (SGST - 9%):</span>
                <span>₹${sgst.toLocaleString('en-IN')}</span>
              </div>
              ` : `
              <div class="total-row">
                <span>Integrated GST (IGST - 18%):</span>
                <span>₹${igst.toLocaleString('en-IN')}</span>
              </div>
              `}
              <div class="total-row">
                <span>Total Tax Collected:</span>
                <span>₹${taxTotal.toLocaleString('en-IN')}</span>
              </div>
              <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹${grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div class="total-row" style="font-weight: bold; padding-top: 10px;">
                <span>Total Paid to Date:</span>
                <span>₹${(grandTotal - balance).toLocaleString('en-IN')}</span>
              </div>
              <div class="total-row" style="color: ${balance > 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">
                <span>Remaining Balance Due:</span>
                <span>₹${balance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated GST-compliant invoice. No physical signature is required.</p>
            <p>&copy; 2026 BhoomiOne Technologies Ltd. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger printing once loaded
    printFrame.onload = () => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      // Remove frame after dispatching print
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 3000);
    };

    onShowToast("Print preview triggered successfully.", "success");
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.tenant_name && inv.tenant_name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.subscription_plan_name && inv.subscription_plan_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    const matchesTenant = tenantFilter === "ALL" || inv.tenant_id === tenantFilter;

    return matchesSearch && matchesStatus && matchesTenant;
  });

  // Gross Analytics
  const grossInvoiced = invoices.reduce((acc, curr) => acc + parseFloat(curr.total_invoice_amount), 0);
  const outstandingBal = invoices.reduce((acc, curr) => acc + parseFloat(curr.outstanding_balance), 0);
  const totalCollected = grossInvoiced - outstandingBal;
  const collectionRate = grossInvoiced > 0 ? (totalCollected / grossInvoiced) * 100 : 100;

  return (
    <div className="font-sans space-y-6" id="ar-ledger-console-container">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="ar-metrics-dashboard">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs" id="metric-gross-invoiced">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Billed MRR</span>
            <h4 className="text-xl font-black text-slate-900 mt-1">₹{grossInvoiced.toLocaleString('en-IN')}</h4>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs" id="metric-total-collected">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Collected</span>
            <h4 className="text-xl font-black text-emerald-700 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h4>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-2xs" id="metric-outstanding-balance">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">A/R Outstanding</span>
            <h4 className="text-xl font-black text-rose-700 mt-1">₹{outstandingBal.toLocaleString('en-IN')}</h4>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-center shadow-2xs" id="metric-collection-progress">
          <div className="flex justify-between items-center w-full mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Collection Progress</span>
            <span className="text-xs font-bold text-slate-700">{collectionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs / Selector Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="ar-main-controller-card">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Corporate Accounts Receivable Ledger</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">SaaS Billing Desk, trial migrations, real-time GST collection and audit trail verification.</p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn-compile-invoice-open"
              onClick={() => {
                const nextCode = generateNextInvoiceCode(invoices);
                setCompileForm(prev => ({
                  ...prev,
                  invoice_number: nextCode
                }));
                setCompileModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Compile SaaS Invoice
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100" id="ar-filter-toolbar">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-ar-search"
              type="text"
              placeholder="Search invoice number, plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="UNPAID">UNPAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="VOID">VOID</option>
            </select>
          </div>

          <div>
            <select
              id="select-filter-tenant"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Tenant Clusters</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="select-ledger-tenant"
              value={ledgerTenantId}
              onChange={(e) => {
                setLedgerTenantId(e.target.value);
                loadLedger(e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-indigo-50/60 border border-indigo-100 text-indigo-900 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- View Workspace Ledger --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.company_name} (Ledger)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Tenant Ledger Presentation */}
        {ledgerTenantId && ledgerData && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-5 space-y-4"
            id="workspace-ledger-presentation"
          >
            <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
              <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                Financial Statement: {tenants.find(t => t.id === ledgerTenantId)?.company_name}
              </h4>
              <button 
                id="btn-close-ledger"
                onClick={() => { setLedgerTenantId(""); setLedgerData(null); }} 
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
              >
                Clear Statement View
              </button>
            </div>

            {ledgerLoading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Ledger Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-indigo-50">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Total Invoiced</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">₹{ledgerData.summary.totalInvoiced.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-50">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Total Settled</span>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">₹{ledgerData.summary.totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-50">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Credits Issued</span>
                    <p className="text-sm font-black text-indigo-700 mt-0.5">₹{ledgerData.summary.totalCredited.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-50">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Outstanding Statement</span>
                    <p className={`text-sm font-black mt-0.5 ${ledgerData.summary.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      ₹{ledgerData.summary.outstandingBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Ledger Chronicle */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 font-extrabold uppercase">
                      <tr>
                        <th className="p-3">Reference Date</th>
                        <th className="p-3">Doc / Reference Code</th>
                        <th className="p-3">Transaction Description</th>
                        <th className="p-3 text-right">Debit (₹)</th>
                        <th className="p-3 text-right">Credit (₹)</th>
                        <th className="p-3 text-center">Reference status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {ledgerData.invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{inv.invoice_number}</td>
                          <td className="p-3">Invoice compiled - {inv.subscription_plan_name}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">₹{parseFloat(inv.total_invoice_amount).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-mono text-slate-400">—</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block text-[9px] px-1.5 py-0.5 font-extrabold rounded-full ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>{inv.status}</span>
                          </td>
                        </tr>
                      ))}
                      {ledgerData.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{p.reference_id || `PAY-${p.id.slice(0,6)}`}</td>
                          <td className="p-3 text-emerald-800 font-semibold">Payment cleared via {p.payment_method} ({p.invoice_number})</td>
                          <td className="p-3 text-right font-mono text-slate-400">—</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center"><span className="text-[9px] font-black text-emerald-700">POSTED</span></td>
                        </tr>
                      ))}
                      {ledgerData.credits.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{new Date(c.issued_at).toLocaleDateString()}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{c.type === 'CREDIT_NOTE' ? 'CR-NOTE' : 'REFUND'}</td>
                          <td className="p-3 text-indigo-800 font-semibold">{c.type} adjustment: {c.reason} ({c.invoice_number})</td>
                          <td className="p-3 text-right font-mono text-slate-400">—</td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-700">₹{parseFloat(c.amount).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center"><span className="text-[9px] font-black text-indigo-700">POSTED</span></td>
                        </tr>
                      ))}
                      {ledgerData.invoices.length === 0 && ledgerData.payments.length === 0 && ledgerData.credits.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">No active general financial ledger rows for this workspace cluster.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Invoices List Grid */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs shadow-3xs" id="invoice-records-table-container">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Invoice Code</th>
                <th className="p-3.5">Tenant Company</th>
                <th className="p-3.5 text-center">Billing Cycle</th>
                <th className="p-3.5 text-right">Invoiced (₹)</th>
                <th className="p-3.5 text-right">Outstanding (₹)</th>
                <th className="p-3.5 text-center">State GST Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      Querying PostgreSQL database clusters...
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-600">{row.invoice_number}</td>
                  <td className="p-3.5 font-extrabold text-slate-800">
                    {row.tenant_name}
                    <div className="text-[9px] font-medium text-slate-400 font-mono mt-0.5">{row.tenant_code}</div>
                  </td>
                  <td className="p-3.5 text-center text-slate-500 font-semibold">{row.billing_period}</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">₹{parseFloat(row.total_invoice_amount).toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                    ₹{parseFloat(row.outstanding_balance).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`inline-block font-black text-[9px] px-2.5 py-0.5 rounded-full ${
                      row.status === "PAID" ? "bg-emerald-50 text-emerald-800" :
                      row.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-800" :
                      row.status === "OVERDUE" ? "bg-rose-50 text-rose-800" :
                      "bg-slate-50 text-slate-800"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button
                        id={`btn-view-${row.id}`}
                        onClick={async () => {
                          setSelectedInvoice(row);
                          setDetailModalOpen(true);
                          await fetchInvoiceDetails(row.id);
                        }}
                        className="p-1 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-all"
                        title="View Ledger Statement & History"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-send-email-${row.id}`}
                        onClick={() => handleSendEmail(row.id, row.invoice_number)}
                        className="p-1 text-slate-600 hover:text-emerald-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-all"
                        title="Dispatch SMTP Relay Mail"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-print-${row.id}`}
                        onClick={() => triggerPdfPrint(row)}
                        className="p-1 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-all"
                        title="Print GST Compliant Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-semibold">
                    No matching SaaS invoice files found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Compile SaaS Invoice */}
      <AnimatePresence>
        {compileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="compile-invoice-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl font-sans text-xs space-y-4"
              id="compile-invoice-modal-content"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase">Compile SaaS Invoice</h4>
                  <p className="text-[10px] text-slate-500">Calculate GST tax brackets & generate outstanding balances.</p>
                </div>
                <button 
                  id="btn-close-compile-modal"
                  onClick={() => setCompileModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompileInvoice} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Target Tenant Workspace</label>
                  <select
                    id="input-compile-tenant"
                    value={compileForm.tenant_id}
                    onChange={(e) => setCompileForm({ ...compileForm, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Select Workspace --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Invoice Code</label>
                    <input
                      id="input-compile-code"
                      type="text"
                      placeholder="BO-INV-2026-XYZ"
                      value={compileForm.invoice_number}
                      onChange={(e) => setCompileForm({ ...compileForm, invoice_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Billing Cycle</label>
                    <input
                      id="input-compile-period"
                      type="text"
                      placeholder="e.g. Jul 2026"
                      value={compileForm.billing_period}
                      onChange={(e) => setCompileForm({ ...compileForm, billing_period: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Pricing Package</label>
                    <select
                      id="select-compile-plan"
                      value={compileForm.subscription_plan_code}
                      onChange={(e) => {
                        const plan = e.target.value;
                        const amt = plan === "ENTERPRISE" ? "99000" : plan === "PROFESSIONAL" ? "9900" : plan === "GROWTH" ? "2490" : "990";
                        setCompileForm({ ...compileForm, subscription_plan_code: plan, base_amount: amt });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="STARTER">Starter Plan (₹990)</option>
                      <option value="GROWTH">Growth Plan (₹2,490)</option>
                      <option value="PROFESSIONAL">Professional Plan (₹9,900)</option>
                      <option value="ENTERPRISE">Enterprise Suite (₹99,000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Billing Jurisdiction</label>
                    <select
                      id="select-compile-jurisdiction"
                      value={compileForm.state_code}
                      onChange={(e) => setCompileForm({ ...compileForm, state_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="KA">Karnataka (CGST + SGST)</option>
                      <option value="MH">Maharashtra (IGST)</option>
                      <option value="DL">Delhi (IGST)</option>
                      <option value="HR">Haryana (IGST)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Base Rate (₹)</label>
                  <input
                    id="input-compile-base"
                    type="number"
                    value={compileForm.base_amount}
                    onChange={(e) => setCompileForm({ ...compileForm, base_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-extrabold text-indigo-700"
                    required
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-[11px] font-medium text-slate-500">
                  <div className="flex justify-between">
                    <span>Calculated Tax (18%):</span>
                    <span className="font-mono text-slate-800">₹{(parseFloat(compileForm.base_amount) * 0.18 || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1 text-xs">
                    <span>Total Grand Balance:</span>
                    <span className="font-mono text-indigo-700">₹{(parseFloat(compileForm.base_amount) * 1.18 || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="btn-cancel-compile"
                    type="button"
                    onClick={() => setCompileModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-compile"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold"
                  >
                    Compile & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: View Invoice Details, Audit timeline, & AR Management */}
      <AnimatePresence>
        {detailModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="invoice-details-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-3xl shadow-2xl font-sans text-xs flex flex-col max-h-[90vh]"
              id="invoice-details-modal-content"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-extrabold">Invoice Profile</span>
                    <span className="font-mono font-black text-indigo-700">{selectedInvoice.invoice_number}</span>
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${
                      selectedInvoice.status === "PAID" ? "bg-emerald-50 text-emerald-800" :
                      selectedInvoice.status === "PARTIALLY_PAID" ? "bg-amber-50 text-amber-800" :
                      "bg-rose-50 text-rose-800"
                    }`}>{selectedInvoice.status}</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-1">{selectedInvoice.tenant_name}</h4>
                </div>
                <button 
                  id="btn-close-details-modal"
                  onClick={() => { setSelectedInvoice(null); setDetailModalOpen(false); }} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable body content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 space-y-0" id="invoice-details-scrollable-body">
                {/* Left Side: Detail Breakdown & Audit Timeline */}
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3" id="invoice-bill-breakdown">
                    <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Detailed Statement breakdown
                    </h5>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Billing period:</span>
                        <span className="text-slate-800 font-extrabold">{selectedInvoice.billing_period}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Subscription Plan:</span>
                        <span className="text-slate-800 font-extrabold">{selectedInvoice.subscription_plan_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Base Net Rate:</span>
                        <span className="text-slate-800 font-mono font-bold">₹{parseFloat(selectedInvoice.base_amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">CGST (9.00%):</span>
                        <span className="text-slate-800 font-mono">₹{parseFloat(selectedInvoice.cgst_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">SGST (9.00%):</span>
                        <span className="text-slate-800 font-mono">₹{parseFloat(selectedInvoice.sgst_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">IGST (18.00%):</span>
                        <span className="text-slate-800 font-mono">₹{parseFloat(selectedInvoice.igst_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold text-slate-900">
                        <span>Grand Total (Net):</span>
                        <span className="font-mono text-indigo-700">₹{parseFloat(selectedInvoice.total_invoice_amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-rose-600">
                        <span>Outstanding Statement:</span>
                        <span className="font-mono text-rose-700">₹{parseFloat(selectedInvoice.outstanding_balance).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit timeline */}
                  <div className="space-y-2" id="invoice-audit-timeline-section">
                    <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      Invoice lifecycle & Audit history
                    </h5>
                    <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-3 font-sans">
                      {selectedInvoice.audits && selectedInvoice.audits.map((a: any) => (
                        <div key={a.id} className="relative">
                          <span className="absolute -left-[21px] top-1 bg-white border-2 border-slate-300 w-2.5 h-2.5 rounded-full" />
                          <div className="text-[10px] font-bold text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
                          <div className="font-extrabold text-slate-700 uppercase text-[9px] mt-0.5">{a.action}</div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{a.details}</p>
                          <div className="text-[9px] text-slate-400 font-semibold mt-0.5 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" />
                            {a.performed_by}
                          </div>
                        </div>
                      ))}
                      {(!selectedInvoice.audits || selectedInvoice.audits.length === 0) && (
                        <div className="text-slate-400">No active timeline audits recorded.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Ledger Actions & History */}
                <div className="space-y-4">
                  {/* Ledger Actions panel */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3" id="invoice-quick-ledger-actions">
                    <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">
                      Platform Billing Actions
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="btn-modal-record-payment"
                        onClick={() => setPaymentModalOpen(true)}
                        disabled={parseFloat(selectedInvoice.outstanding_balance) <= 0}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-extrabold text-center transition-all flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Payment
                      </button>

                      <button
                        id="btn-modal-send-resend"
                        onClick={() => handleSendEmail(selectedInvoice.id, selectedInvoice.invoice_number)}
                        className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold text-center transition-all flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Resend Invoice
                      </button>

                      <button
                        id="btn-modal-credit-note"
                        onClick={() => setCreditModalOpen(true)}
                        disabled={parseFloat(selectedInvoice.outstanding_balance) <= 0}
                        className="py-2 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-extrabold text-center transition-all flex items-center justify-center gap-1"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Credit Note
                      </button>

                      <button
                        id="btn-modal-print-pdf"
                        onClick={() => triggerPdfPrint(selectedInvoice)}
                        className="py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Payment history */}
                  <div className="space-y-2" id="invoice-payments-history-section">
                    <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-emerald-600" />
                      Recorded Payments list
                    </h5>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-slate-600">
                        <thead className="bg-slate-50 text-[9px] text-slate-500 font-extrabold uppercase">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Method</th>
                            <th className="p-2 text-right">Amount (₹)</th>
                            <th className="p-2">Reference ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.payments && selectedInvoice.payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="p-2 text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                              <td className="p-2 font-bold">{p.payment_method}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                              <td className="p-2 font-mono text-slate-400">{p.reference_id || 'N/A'}</td>
                            </tr>
                          ))}
                          {(!selectedInvoice.payments || selectedInvoice.payments.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400">No payment logs saved for this invoice statement.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Credit Adjustments list */}
                  <div className="space-y-2" id="invoice-adjustments-history-section">
                    <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-indigo-600" />
                      Credit & Refund Adjustments
                    </h5>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-slate-600">
                        <thead className="bg-slate-50 text-[9px] text-slate-500 font-extrabold uppercase">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Type</th>
                            <th className="p-2 text-right">Amount (₹)</th>
                            <th className="p-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.credits && selectedInvoice.credits.map((c: any) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="p-2 text-slate-500">{new Date(c.issued_at).toLocaleDateString()}</td>
                              <td className="p-2 font-bold text-indigo-700">{c.type}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">₹{parseFloat(c.amount).toLocaleString('en-IN')}</td>
                              <td className="p-2 text-slate-500">{c.reason}</td>
                            </tr>
                          ))}
                          {(!selectedInvoice.credits || selectedInvoice.credits.length === 0) && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400">No adjustments issued.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
                <button
                  id="btn-close-modal-footer"
                  onClick={() => { setSelectedInvoice(null); setDetailModalOpen(false); }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Close Profile View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL 1: Record payment Form */}
      <AnimatePresence>
        {paymentModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[60] p-4" id="record-payment-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-2xl font-sans text-xs space-y-4"
              id="record-payment-modal-content"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h5 className="font-black text-slate-900 uppercase">Record Invoice Payment</h5>
                <button 
                  id="btn-close-payment-submodal"
                  onClick={() => setPaymentModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg font-semibold">
                Outstanding Statement Due: ₹{parseFloat(selectedInvoice.outstanding_balance).toLocaleString('en-IN')}
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Payment Date</label>
                  <input
                    id="input-payment-date"
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Amount to Record (₹)</label>
                  <input
                    id="input-payment-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Payment Method</label>
                  <select
                    id="select-payment-method"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none"
                  >
                    <option value="UPI">UPI (GooglePay/PhonePe)</option>
                    <option value="BANK_TRANSFER">Direct IMPS/RTGS Bank Transfer</option>
                    <option value="CARD">Credit / Debit Card Gateway</option>
                    <option value="CASH">Physical Cash Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Reference / Transaction ID</label>
                  <input
                    id="input-payment-reference"
                    type="text"
                    placeholder="e.g. TXN-192837"
                    value={paymentForm.reference_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Remarks / Comments</label>
                  <textarea
                    id="input-payment-remarks"
                    placeholder="e.g. Cleared via online bank transfer"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-16 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="btn-cancel-payment"
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-payment"
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL 2: Credit Note / Refund Form */}
      <AnimatePresence>
        {creditModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[60] p-4" id="credit-note-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-2xl font-sans text-xs space-y-4"
              id="credit-note-modal-content"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h5 className="font-black text-slate-900 uppercase">Issue Ledger Adjustment</h5>
                <button 
                  id="btn-close-credit-submodal"
                  onClick={() => setCreditModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-indigo-50 text-indigo-900 rounded-lg font-semibold">
                Statement Outstanding Balance: ₹{parseFloat(selectedInvoice.outstanding_balance).toLocaleString('en-IN')}
              </div>

              <form onSubmit={handleIssueCredit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Adjustment Type</label>
                  <select
                    id="select-credit-type"
                    value={creditForm.type}
                    onChange={(e) => setCreditForm({ ...creditForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none"
                  >
                    <option value="CREDIT_NOTE">Credit Note (Deducts outstanding balance)</option>
                    <option value="REFUND">Refund Log (Logs capital returned to tenant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Adjustment Amount (₹)</label>
                  <input
                    id="input-credit-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-indigo-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1">Justification Reason</label>
                  <textarea
                    id="input-credit-reason"
                    placeholder="Provide compliance or operational justification remarks..."
                    value={creditForm.reason}
                    onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg h-20 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="btn-cancel-credit"
                    type="button"
                    onClick={() => setCreditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-credit"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold"
                  >
                    Post Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
