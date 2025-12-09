import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Popover, OverlayTrigger } from 'react-bootstrap';

import 'bootstrap-icons/font/bootstrap-icons.css';

import companyLogo from './pages/hrpolicypicture.jpg';

const SalarySlip = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [salaryOverviewData, setSalaryOverviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [salaryComponents, setSalaryComponents] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [selectedSlipForModal, setSelectedSlipForModal] = useState(null);


  const months = [
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, componentsRes] = await Promise.all([
          axios.get("http://localhost:1000/employees"),
          axios.get("http://localhost:1000/api/components")
        ]);
        setEmployees(employeesRes.data);
        const componentsData = Array.isArray(componentsRes.data) ? componentsRes.data :
                            (Array.isArray(componentsRes.data.components) ? componentsRes.data.components : []);
        setSalaryComponents(componentsData);
      } catch (err) {
        setError("Failed to fetch initial data. Please ensure the backend server is running.");
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAllSalarySlips = async () => {
      if (employees.length === 0) {
        setSalaryOverviewData([]);
        return;
      }

      setLoading(true);
      setError(null);

      const fetchedSlips = await Promise.all(
        employees.map(async (employee) => {
          try {
            const response = await axios.get(`http://localhost:1000/generate-salary-slip`, {
              params: {
                employeeId: employee._id,
                month: selectedMonth,
                year: selectedYear,
              },
            });
            return {
                ...response.data,
                employeeName: employee.name,
                employeeID: employee._id,
                baseSalary: response.data.baseSalary || employee.salary,
            };
          } catch (err) {
            console.error(`Creating fallback for ${employee.name}:`, err);
            const monthIndex = parseInt(selectedMonth, 10) - 1;
            const totalDaysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
            return {
              employeeName: employee.name,
              employeeID: employee._id,
              status: "not_generated",
              totalWorkingDays: totalDaysInMonth,
              paidLeaves: 0,
              unpaidLeaves: 0,
              baseSalary: employee.salary,
              grossSalary: 0,
              deductionAmount: 0,
              netSalary: 0,
              earnings: [],
              deductions: [],
            };
          }
        })
      );

      setSalaryOverviewData(fetchedSlips);
      setLoading(false);
    };

    fetchAllSalarySlips();
  }, [selectedMonth, selectedYear, employees]);

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

    const getProratedCalculations = (slip) => {

    const totalWorkingDays = slip.totalWorkingDays || 30;
    const paidLeaves = slip.paidLeaves || 0;
    const unpaidLeaves = slip.unpaidLeaves || 0;
    const actualPresentDays = totalWorkingDays > 0 ? totalWorkingDays - paidLeaves - unpaidLeaves : 0;
    const baseSalary = slip.baseSalary || 0;

    const baseSalaryDailyRate = (totalWorkingDays > 0) ? (baseSalary / totalWorkingDays) : 0;
    const unpaidLeaveDeduction = unpaidLeaves > 0 ? (baseSalaryDailyRate * unpaidLeaves) : 0;


    let finalGrossSalary = 0;
    let finalTotalDeductions = 0;
    let finalNetSalary = 0;
    let proratedEarnings = [];
    let proratedDeductions = [];

    if (slip.status === 'success') {
      // --- Logic for GENERATED salaries ---
      const payableDays = totalWorkingDays - unpaidLeaves;

      proratedEarnings = (slip.earnings || []).map(e => {
          const component = salaryComponents.find(c => c.name === e.name);
          const originalAmount = Number(e.amount) || 0;
          if (component && component.calculateDays && totalWorkingDays > 0) {
              const dailyRate = originalAmount / totalWorkingDays;
              const proratedAmount = dailyRate * payableDays;
              return { ...e, amount: proratedAmount, calculation: `(${originalAmount.toFixed(2)} / ${totalWorkingDays}) × ${payableDays} = ${proratedAmount.toFixed(2)}`};
          }
          return { ...e, amount: originalAmount, calculation: 'Full amount (not prorated)' };
      });
      finalGrossSalary = proratedEarnings.reduce((sum, item) => sum + item.amount, 0);

      proratedDeductions = (slip.deductions || []).map(d => {
          const component = salaryComponents.find(c => c.name === d.name);
          const originalAmount = Math.abs(Number(d.amount) || 0);
          if (component && component.calculateDays && totalWorkingDays > 0) {
              const dailyRate = originalAmount / totalWorkingDays;
              const proratedAmount = dailyRate * payableDays;
              return { ...d, amount: proratedAmount, calculation: `(${originalAmount.toFixed(2)} / ${totalWorkingDays}) × ${payableDays} = ${proratedAmount.toFixed(2)}`};
          }
          return { ...d, amount: originalAmount, calculation: 'Full amount (not prorated)' };
      });

      const componentDeductions = proratedDeductions.reduce((sum, item) => sum + item.amount, 0);
      finalTotalDeductions = componentDeductions + unpaidLeaveDeduction;
      finalNetSalary = finalGrossSalary - finalTotalDeductions;

    } else {
      // --- Logic for NON-GENERATED salaries (This is the key fix) ---
      finalGrossSalary = baseSalary; // For display, Gross is the same as Base
      finalTotalDeductions = unpaidLeaveDeduction; // Only deduction is from unpaid leave
      finalNetSalary = baseSalary - unpaidLeaveDeduction; // Net is Base minus leave deduction
    }

    return {
        actualPresentDays,
        proratedEarnings,
        finalGrossSalary,
        proratedDeductions,
        leaveDeduction: unpaidLeaveDeduction,
        finalTotalDeductions,
        finalNetSalary
    };
  };

  const renderEarningsPopover = (slip) => {
    const { proratedEarnings, finalGrossSalary } = getProratedCalculations(slip);
    return (
      <Popover id={`popover-earnings-${slip.employeeID}`}>
        <Popover.Header as="h3">Earnings Breakdown</Popover.Header>
        <Popover.Body>
          {proratedEarnings.length > 0 ? (
            <ul className="list-unstyled mb-0">
              {proratedEarnings.map((e, i) => ( <li key={i} className="d-flex justify-content-between"><span>{e.name}</span><strong>{formatCurrency(e.amount)}</strong></li> ))}
              <hr className="my-2"/>
              <li className="d-flex justify-content-between"><span><strong>Total Gross</strong></span><strong>{formatCurrency(finalGrossSalary)}</strong></li>
            </ul>
          ) : "No earnings data."}
        </Popover.Body>
      </Popover>
    );
  };

  const renderDeductionsPopover = (slip) => {
    const { proratedDeductions, leaveDeduction, finalTotalDeductions } = getProratedCalculations(slip);
    return (
      <Popover id={`popover-deductions-${slip.employeeID}`}>
        <Popover.Header as="h3">Deductions Breakdown</Popover.Header>
        <Popover.Body>
          {(proratedDeductions.length > 0 || leaveDeduction > 0) ? (
            <ul className="list-unstyled mb-0">
              {proratedDeductions.map((d, i) => ( <li key={i} className="d-flex justify-content-between"><span>{d.name}</span><strong>{formatCurrency(d.amount)}</strong></li> ))}
              {leaveDeduction > 0 && ( <li className="d-flex justify-content-between"><span>Unpaid Leave</span><strong>{formatCurrency(leaveDeduction)}</strong></li> )}
               <hr className="my-2"/>
              <li className="d-flex justify-content-between"><span><strong>Total Deductions</strong></span><strong>{formatCurrency(finalTotalDeductions)}</strong></li>
            </ul>
          ) : "No deductions."}
        </Popover.Body>
      </Popover>
    );
  };

  const maskAccount = (acct) => {
    if (!acct) return "XXXX-XXXX";
    const s = String(acct);
    if (s.length <= 4) return s;
    const last4 = s.slice(-4);
    return "XXXX XXXX " + last4;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area');
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-area');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`salary_slips_${selectedMonth}_${selectedYear}.pdf`);
  };

  const generateSlipHtml = (employeeData) => {
    const companyName = "HR Policy Management (P) Limited";
    const companyAddress = " Bhubaneswar, Odisha - 751010";
    const companyGST = "GSTIN: 22AAAAA0000A1Z5";
    const companyPhone = "1800-XXX-XXXX";
    const companyEmail = "payroll@mindtrack.in";
    const bankName = employeeData.bankName || employeeData.bank?.name || "State Bank Of India";
    const accountNo = employeeData.bankAccount || employeeData.bank?.account || employeeData.accountNumber || "";
    const ifsc = employeeData.ifsc || employeeData.bank?.ifsc || "XXXX0000000";
    const { actualPresentDays, proratedEarnings, finalGrossSalary, proratedDeductions, leaveDeduction, finalTotalDeductions, finalNetSalary } = getProratedCalculations(employeeData);
    const logoHtml = `<img src="${companyLogo}" style="width:72px;height:72px;border-radius:6px;object-fit:contain; border:1px solid #eee;" alt="logo" />`;
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#222; width:800px; padding:24px; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:12px;">${logoHtml}<div><div style="font-size:18px; font-weight:700; color:#1b5e20;">${companyName}</div><div style="font-size:12px; color:#555;">${companyAddress}</div><div style="font-size:12px; color:#555;">${companyPhone} • ${companyEmail}</div></div></div>
          <div style="text-align:right;"><div style="font-size:14px; font-weight:700; color:#0d47a1;">Salary Slip</div><div style="font-size:12px; color:#333;">${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}</div><div style="font-size:12px; color:#666; margin-top:8px;">Payslip ID: ${employeeData.payslipId || ('PS' + (Math.floor(Math.random()*900000)+100000))}</div></div>
        </div>
        <div style="display:flex; gap:16px; margin-bottom:16px;">
          <div style="flex:1; border:1px solid #e0e0e0; padding:12px; border-radius:6px; background:#fbfbfb;"><div style="font-size:13px; color:#666; margin-bottom:6px;">Employee</div><div style="font-weight:700; font-size:15px;">${employeeData.employeeName || 'N/A'}</div><div style="font-size:13px; color:#444;">ID: ${employeeData.employeeID || 'N/A'}</div><div style="font-size:13px; color:#444;">Designation: Full Stack Developer</div><div style="font-size:13px; color:#444;">Dept: Web Development</div></div>
          <div style="flex:1; border:1px solid #e0e0e0; padding:12px; border-radius:6px; background:#fbfbfb;"><div style="font-size:13px; color:#666; margin-bottom:6px;">Bank Details</div><div style="font-weight:700; font-size:15px;">${bankName}</div><div style="font-size:13px; color:#444;">A/c: ${maskAccount(accountNo)}</div><div style="font-size:13px; color:#444;">IFSC: ${ifsc}</div><div style="font-size:13px; color:#444;">Payment Mode: ${employeeData.paymentMode || 'NEFT/Bank Transfer'}</div></div>
          <div style="width:220px; border:1px solid #e0e0e0; padding:12px; border-radius:6px; background:#fff;"><div style="font-size:13px; color:#666; margin-bottom:6px;">Salary Summary</div><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><div style="color:#555;">Gross Earnings</div><div style="font-weight:700;">${formatCurrency(finalGrossSalary)}</div></div><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><div style="color:#d32f2f;">Total Deductions</div><div style="font-weight:700; color:#d32f2f;">- ${formatCurrency(finalTotalDeductions)}</div></div><div style="border-top:1px dashed #ddd; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between;"><div style="font-weight:800; color:#0b6623;">Net Pay</div><div style="font-weight:800; color:#0b6623;">${formatCurrency(finalNetSalary)}</div></div></div>
        </div>
        <div style="margin-bottom:20px;"><div style="font-size:13px; font-weight:700; margin-bottom:8px; color:#1565c0;">Work Days Calculation</div><table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#e3f2fd;">Total Working Days</th><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#e3f2fd;">Present Days</th><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#e3f2fd;">Paid Leaves</th><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#e3f2fd;">Unpaid Leaves</th></tr></thead><tbody><tr><td style="padding:8px; border:1px solid #eee;">${employeeData.totalWorkingDays || 0}</td><td style="padding:8px; border:1px solid #eee;">${actualPresentDays}</td><td style="padding:8px; border:1px solid #eee;">${employeeData.paidLeaves || 0}</td><td style="padding:8px; border:1px solid #eee;">${employeeData.unpaidLeaves || 0}</td></tr></tbody></table></div>
        <div style="margin-bottom:20px;"><div style="font-size:13px; font-weight:700; margin-bottom:8px; color:#2e7d32;">Earnings Calculation Details</div><table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#f1f8f3;">Component</th><th style="text-align:right; padding:8px; border:1px solid #e8e8e8; background:#f1f8f3;">Amount</th></tr></thead><tbody>${proratedEarnings.length ? proratedEarnings.map(e => `<tr><td style="padding:8px; border:1px solid #eee;">${e.name}</td><td style="padding:8px; border:1px solid #eee; text-align:right;">${formatCurrency(e.amount)}</td></tr>`).join('') : `<tr><td colspan="2" style="padding:12px; border:1px solid #eee; text-align:center;">No earnings listed</td></tr>`}</tbody><tfoot><tr style="background:#f1f8f3;"><td style="padding:8px; border:1px solid #e8e8e8; font-weight:700;">Gross Earnings</td><td style="padding:8px; border:1px solid #e8e8e8; text-align:right; font-weight:700;">${formatCurrency(finalGrossSalary)}</td></tr></tfoot></table></div>
        <div style="margin-bottom:20px;"><div style="font-size:13px; font-weight:700; margin-bottom:8px; color:#c62828;">Deductions Calculation Details</div><table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left; padding:8px; border:1px solid #e8e8e8; background:#fff5f5;">Component</th><th style="text-align:right; padding:8px; border:1px solid #e8e8e8; background:#fff5f5;">Amount</th></tr></thead><tbody>${proratedDeductions.length ? proratedDeductions.map(d => `<tr><td style="padding:8px; border:1px solid #eee;">${d.name}</td><td style="padding:8px; border:1px solid #eee; text-align:right;">${formatCurrency(d.amount)}</td></tr>`).join('') : ''}${ employeeData.unpaidLeaves > 0 ? `<tr><td style="padding:8px; border:1px solid #eee;">Unpaid Leave Deduction (${employeeData.unpaidLeaves} days)</td><td style="padding:8px; border:1px solid #eee; text-align:right;">${formatCurrency(leaveDeduction)}</td></tr>` : '' }${(proratedDeductions.length === 0 && employeeData.unpaidLeaves === 0) ? `<tr><td colspan="2" style="padding:12px; border:1px solid #eee; text-align:center;">No deductions listed</td></tr>` : ''}</tbody><tfoot><tr style="background:#fff5f5;"><td style="padding:8px; border:1px solid #e8e8e8; font-weight:700;">Total Deductions</td><td style="padding:8px; border:1px solid #e8e8e8; text-align:right; font-weight:700;">${formatCurrency(finalTotalDeductions)}</td></tr></tfoot></table></div>
        <div style="margin-top:2px; border-top:2px solid #e9e9e9; padding-top:12px;"><div style="display:flex; justify-content:space-between; align-items:center;"><div style="font-size:12px; color:#666;">Net Payable Amount in words:</div><div style="font-weight:700; font-size:16px; color:#0b6623;">${(finalNetSalary).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div></div></div>
        <div style="display:flex; justify-content:space-between; margin-top:28px;"><div style="text-align:left;"><div style="height:70px; border-bottom:1px solid #999; width:260px;"></div><div style="font-size:13px; color:#444; margin-top:6px;">Employee Signature</div></div><div style="text-align:right;"><div style="height:70px; border-bottom:1px solid #999; width:260px;"></div><div style="font-size:13px; color:#444; margin-top:6px;">Authorised Signatory</div></div></div>
        <div style="text-align:center; margin-top:14px; font-size:11px; color:#777;"><div>This is a computer generated payslip and does not require a physical signature.</div><div style="margin-top:4px;">${companyGST}</div></div>
      </div>
    `;
  };

  const handleDownloadIndividualPDF = async (employeeData) => {
    const html = generateSlipHtml(employeeData);
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '800px'; tempDiv.style.position = 'absolute'; tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    const elementToCapture = tempDiv.children[0];
    if (!elementToCapture) { setError("Failed to create slip content for PDF."); document.body.removeChild(tempDiv); return; }
    try {
      const canvas = await new Promise((resolve, reject) => {
        const img = elementToCapture.querySelector('img');
        const generateCanvas = async () => { try { const c = await html2canvas(elementToCapture, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }); resolve(c); } catch (e) { reject(e); } };
        if (!img || img.complete) { generateCanvas(); }
        else { img.onload = generateCanvas; img.onerror = (err) => reject(new Error("Image failed to load.", { cause: err })); }
      });
      const imgData = canvas.toDataURL('image/png'); const pdf = new jsPDF('p', 'mm', 'a4'); const imgProps = pdf.getImageProperties(imgData); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      if (pdfHeight <= pdf.internal.pageSize.getHeight()) { pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight); }
      else { let hLeft = pdfHeight, pos = 0; const pageH = pdf.internal.pageSize.getHeight(); pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pageH); hLeft -= pageH; while (hLeft > 0) { pos -= pageH; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, pos, pdfWidth, pdfHeight); hLeft -= pageH; } }
      const fileNameSafe = (employeeData.employeeName || 'employee').replace(/\s+/g, '_');
      pdf.save(`${fileNameSafe}_SalarySlip_${months.find(m => m.value === selectedMonth)?.label}_${selectedYear}.pdf`);
    } catch (err) { setError("Failed to generate PDF."); console.error("PDF Generation Error:", err); } finally { document.body.removeChild(tempDiv); }
  };

  const handleViewSlip = (slipData) => { setModalContent(generateSlipHtml(slipData)); setSelectedSlipForModal(slipData); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setModalContent(''); setSelectedSlipForModal(null); };

  const handleSubmitToDatabase = async () => {
    if (salaryOverviewData.length === 0) { setError("No salary data to submit."); return; }
    setSubmitting(true); setSubmitSuccess(null); setError(null);
    try {
      const slipsToSave = salaryOverviewData.map(slip => {
        const { finalGrossSalary, finalTotalDeductions, finalNetSalary } = getProratedCalculations(slip);
        return {
          employeeID: slip.employeeID, employeeName: slip.employeeName,
          month: months.find(m => m.value === selectedMonth)?.label, year: selectedYear,
          totalWorkingDays: slip.totalWorkingDays || 0, paidLeaves: slip.paidLeaves || 0, unpaidLeaves: slip.unpaidLeaves || 0,
          baseSalary: slip.baseSalary || 0,
          grossSalary: slip.status === "success" ? finalGrossSalary : 0,
          deductionAmount: slip.status === "success" ? finalTotalDeductions : 0,
          netSalary: slip.status === "success" ? finalNetSalary : 0,
          status: slip.status, earnings: slip.earnings, deductions: slip.deductions,
        };
      });
      const response = await axios.post("http://localhost:1000/save-salary-slips", { month: months.find(m => m.value === selectedMonth)?.label, year: selectedYear, slips: slipsToSave, });
      if (response.data.success) { setSubmitSuccess(`Salary slips for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear} saved successfully!`); }
      else { setError(response.data.message || "Failed to save salary slips."); }
    } catch (err) { setError(err.response?.data?.message || "Failed to connect to server."); } finally { setSubmitting(false); }
  };

  return (
    <div className="container py-5">
      <style>{`.modal-backdrop.show{opacity:.5}.clickable-amount{cursor:pointer;text-decoration:underline;text-decoration-style:dotted;color:#0d6efd}`}</style>
      <div className="row justify-content-center">
        <div className="col-lg-12">
          <div className="text-center mb-4"><h1 className="display-6 fw-bold text-primary"><i className="bi bi-wallet-fill me-2"></i>Employee Salary Overview</h1></div>
          <div className="card shadow-lg mb-4">
            <div className="card-header bg-primary text-white"><div className="d-flex justify-content-between align-items-center"><h5 className="mb-0"><i className="bi bi-calendar-check me-2"></i>Select Month & Year</h5><div className="no-print d-flex align-items-center gap-2"><button onClick={handlePrint} className="btn btn-light btn-sm me-2"><i className="bi bi-printer-fill"></i> Print</button><button onClick={handleDownloadPDF} className="btn btn-light btn-sm"><i className="bi bi-file-earmark-pdf-fill"></i> PDF</button></div></div></div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label fw-semibold">Month</label><select className="form-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{months.map((m) => ( <option key={m.value} value={m.value}>{m.label}</option> ))}</select></div>
                <div className="col-md-6"><label className="form-label fw-semibold">Year</label><select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{years.map((year) => ( <option key={year} value={year}>{year}</option> ))}</select></div>
              </div>
            </div>
          </div>
          {error && <div className="alert alert-danger alert-dismissible fade show"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}<button type="button" className="btn-close" onClick={() => setError(null)}></button></div>}
          {submitSuccess && <div className="alert alert-success alert-dismissible fade show"><i className="bi bi-check-circle-fill me-2"></i>{submitSuccess}<button type="button" className="btn-close" onClick={() => setSubmitSuccess(null)}></button></div>}
          <div id="printable-area" className="card shadow-lg mt-4">
            <div className="card-header bg-success text-white"><div className="d-flex justify-content-between align-items-center"><h5 className="mb-0"><i className="bi bi-table me-2"></i>Salary Details for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</h5><button onClick={handleSubmitToDatabase} className="btn btn-light no-print" disabled={submitting || salaryOverviewData.length === 0}>{submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-save-fill me-2"></i>Submit Report</>}</button></div></div>
            <div className="card-body p-0">
              {loading ? ( <div className="d-flex justify-content-center p-5"><div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div></div> ) : salaryOverviewData.length === 0 && !error ? ( <div className="alert alert-info m-3 text-center">No salary records found for the selected period.</div> ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-striped table-bordered align-middle mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th scope="col">Employee Name</th>
                        <th scope="col" className="text-center">Total Days</th>
                        <th scope="col" className="text-center">Present Days</th>
                        <th scope="col" className="text-center">Paid Leaves</th>
                        <th scope="col" className="text-center">Unpaid Leaves</th>
                        <th scope="col" className="text-end">Base Salary</th>
                        <th scope="col" className="text-end">Gross Salary</th>
                        <th scope="col" className="text-end">Deduction</th>
                        <th scope="col" className="text-end">Net Payable</th>
                        <th scope="col" className="text-center no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryOverviewData.map((slip) => {
                        const { actualPresentDays, finalGrossSalary, finalTotalDeductions, finalNetSalary } = getProratedCalculations(slip);
                        const isSuccess = slip.status === 'success';
                        return (
                          <tr key={slip.employeeID}>
                            <td>{slip.employeeName}</td>
                            <td className="text-center">{slip.totalWorkingDays || 0}</td>
                            <td className="text-center">{actualPresentDays}</td>
                            <td className="text-center">{slip.paidLeaves || 0}</td>
                            <td className="text-center">{slip.unpaidLeaves || 0}</td>
                            <td className="text-end">{formatCurrency(slip.baseSalary)}</td>
                            <td className="text-end">{isSuccess ? (<OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={renderEarningsPopover(slip)}><span className="clickable-amount">{formatCurrency(finalGrossSalary)}</span></OverlayTrigger>) : (formatCurrency(finalGrossSalary))}</td>
                            <td className="text-end">{isSuccess ? (<OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={renderDeductionsPopover(slip)}><span className="clickable-amount text-danger">{formatCurrency(finalTotalDeductions)}</span></OverlayTrigger>) : (<span className="text-danger">{formatCurrency(finalTotalDeductions)}</span>)}</td>
                            <td className="text-end fw-bold text-success">{formatCurrency(finalNetSalary)}</td>
                            <td className="text-center no-print">
                              <button onClick={() => handleViewSlip(slip)} className="btn btn-sm btn-outline-secondary me-2" disabled={!isSuccess} title="View Salary Slip"><i className="bi bi-eye-fill"></i></button>
                              <button onClick={() => handleDownloadIndividualPDF(slip)} className="btn btn-sm btn-outline-primary" disabled={!isSuccess} title="Download Salary Slip"><i className="bi bi-download"></i></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer bg-light text-muted text-center no-print"><small>&copy; {new Date().getFullYear()} Employee Management System</small></div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header"><h5 className="modal-title">Salary Slip Preview: {selectedSlipForModal?.employeeName}</h5><button type="button" className="btn-close" onClick={handleCloseModal}></button></div>
                <div className="modal-body" style={{ background: '#f8f9fa' }}><div className="d-flex justify-content-center"><div id="slip-for-pdf-view" dangerouslySetInnerHTML={{ __html: modalContent }} /></div></div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button><button type="button" className="btn btn-primary" onClick={() => handleDownloadIndividualPDF(selectedSlipForModal)}><i className="bi bi-file-earmark-pdf-fill me-2"></i>Download PDF</button></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default SalarySlip;