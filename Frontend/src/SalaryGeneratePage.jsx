import React, { useState, useEffect } from "react";
import axios from "axios";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const fetchSalaryComponents = async () => {
  try {
    const { data } = await axios.get("http://localhost:1000/api/components");
    return Array.isArray(data) ? data : (Array.isArray(data.components) ? data.components : []);
  } catch (error) {
    console.error("Failed to fetch salary components:", error);
    return [];
  }
};

const fetchEmployees = async () => {
  try {
    const { data } = await axios.get("http://localhost:1000/employees");
    return data;
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
};

const fetchSavedSalary = async (employeeId, month, year) => {
  try {
    const monthNumber = (months.findIndex(m => m === month) + 1).toString().padStart(2, '0');
    const { data } = await axios.get("http://localhost:1000/api/salaries", {
      params: { employee: employeeId, month: monthNumber, year }
    });
    return (Array.isArray(data) && data.length > 0) ? data[0] : null;
  } catch (error) {
    console.error("Failed to fetch saved salary:", error);
    return null;
  }
};

const SalaryGeneratePage = () => {
  const [componentOptions, setComponentOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [presentDays, setPresentDays] = useState(0);
  const [paidLeaves, setPaidLeaves] = useState(0);
  const [unpaidLeaves, setUnpaidLeaves] = useState(0);
  const [totalWorkingDays, setTotalWorkingDays] = useState(30);

  const selectedEmployeeDetails = employees.find(emp => emp._id === selectedEmployee);

  const getBasicSalaryAmount = (currentRows) => {
    const basicRow = currentRows.find(row => row.component === "BASIC" && row.allowed);
    return basicRow ? Number(basicRow.amount || 0) : 0;
  };
  
  // Fetch initial data like employees and component definitions
  useEffect(() => {
    const fetchInitialData = async () => {
      const [comps, emps] = await Promise.all([fetchSalaryComponents(), fetchEmployees()]);
      setComponentOptions(comps);
      if (emps.length > 0) {
        setEmployees(emps);
      }
    };
    fetchInitialData();
  }, []);
  
  // Fetch attendance data whenever the selection changes
  useEffect(() => {
    const fetchAttendanceAndLeaves = async () => {
      if (!selectedEmployee || !selectedMonth || !selectedYear) {
        setPresentDays(0); setPaidLeaves(0); setUnpaidLeaves(0); setTotalWorkingDays(30);
        return;
      }
      try {
        const monthIdx = months.findIndex(m => m === selectedMonth);
        const yearNum = Number(selectedYear);
        const totalDays = new Date(yearNum, monthIdx + 1, 0).getDate();
        setTotalWorkingDays(totalDays);

        // Assuming your API can provide leave details for a specific employee and month
        const leaveRes = await axios.get(`http://localhost:1000/api/leaves/employee/${selectedEmployee}?month=${monthIdx + 1}&year=${yearNum}`);
        const { paid, unpaid } = leaveRes.data;
        
        setPaidLeaves(paid || 0);
        setUnpaidLeaves(unpaid || 0);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        const monthIdx = months.findIndex(m => m === selectedMonth);
        const totalDays = new Date(Number(selectedYear), monthIdx + 1, 0).getDate();
        setTotalWorkingDays(totalDays);
        setPaidLeaves(0);
        setUnpaidLeaves(0);
      }
    };
    fetchAttendanceAndLeaves();
  }, [selectedEmployee, selectedMonth, selectedYear]);

  // Update present days based on attendance changes
  useEffect(() => {
    setPresentDays(totalWorkingDays - (paidLeaves + unpaidLeaves));
  }, [totalWorkingDays, paidLeaves, unpaidLeaves]);

  const calculateAmount = (row, compPolicy, allRows) => {
    let newAmount = 0;
    if (!row.allowed) return 0;
    
    const payableDays = presentDays + paidLeaves;
    
    let baseValue = 0;
    if (row.type === "flat") {
        baseValue = Number(row.value) || 0;
    } else if (row.type === "percentage") {
        const basicAmount = getBasicSalaryAmount(allRows);
        baseValue = (basicAmount * Number(row.percent || 0)) / 100;
    }
    
    if (compPolicy?.calculateDays && totalWorkingDays > 0) {
        const perDayRate = baseValue / totalWorkingDays;
        newAmount = perDayRate * payableDays;
    } else {
        newAmount = baseValue;
    }
    
    if (compPolicy?.type === "deduction") {
        newAmount = -Math.abs(newAmount);
    }
    
    return parseFloat(newAmount.toFixed(2));
  };
  
  // This is the primary effect for loading or creating salary data.
  useEffect(() => {
    const loadAndCalculateSalaryData = async () => {
        if (!selectedEmployee || !selectedMonth || !selectedYear || componentOptions.length === 0) {
            setRows([]);
            return;
        }

        const employeeDetails = employees.find(e => e._id === selectedEmployee);
        if (!employeeDetails) return;

        const savedSalary = await fetchSavedSalary(selectedEmployee, selectedMonth, selectedYear);

        let initialRows;
        if (savedSalary && Array.isArray(savedSalary.components)) {
            initialRows = componentOptions.map(comp => {
                const saved = savedSalary.components.find(c => c.name === comp.name);
                return {
                    component: comp.name, type: saved?.type || 'flat',
                    value: saved?.type === 'flat' ? (saved.value || '') : '',
                    percent: saved?.type === 'percentage' ? (saved.percent || '') : '',
                    amount: saved?.amount || 0, allowed: !!saved,
                };
            });
        } else {
            initialRows = componentOptions.map((comp) => {
                const isBasic = comp.name === "BASIC";
                return {
                    component: comp.name, type: comp.defaultType || "flat",
                    value: isBasic ? employeeDetails.salary : (comp.defaultValue || ""),
                    percent: comp.defaultType === "percentage" ? comp.defaultValue : "",
                    amount: 0, allowed: isBasic,
                };
            });
        }

        // After setting initial rows, perform full recalculation
        const recalculatedRows = initialRows.map(row => {
            const compPolicy = componentOptions.find(c => c.name === row.component);
            return { ...row, amount: calculateAmount(row, compPolicy, initialRows) };
        });
        
        // A second pass for percentage components is vital
        const finalCalculatedRows = recalculatedRows.map(row => {
            if (row.type === 'percentage') {
                const compPolicy = componentOptions.find(c => c.name === row.component);
                return { ...row, amount: calculateAmount(row, compPolicy, recalculatedRows) };
            }
            return row;
        });

        setRows(finalCalculatedRows);
    };

    loadAndCalculateSalaryData();
  }, [selectedEmployee, selectedMonth, selectedYear, componentOptions, employees, presentDays, paidLeaves]);


  const handleChange = (idx, field, value) => {
    const updatedRows = [...rows];
    let newRow = { ...updatedRows[idx], [field]: value };
    if (field === "type") { newRow.value = ''; newRow.percent = ''; }
    updatedRows[idx] = newRow;

    // Recalculate all rows to ensure dependencies (like BASIC salary) are updated
    const recalculatedRows = updatedRows.map(row => {
      const compPolicy = componentOptions.find(c => c.name === row.component);
      return { ...row, amount: calculateAmount(row, compPolicy, updatedRows) };
    });

    setRows(recalculatedRows);
  };

  const toggleAllowed = (idx) => {
    const updatedRows = [...rows];
    updatedRows[idx].allowed = !updatedRows[idx].allowed;
    
    // Recalculate all amounts since enabling/disabling a component (like BASIC) affects others
    const recalculatedRows = updatedRows.map(row => {
      const compPolicy = componentOptions.find(c => c.name === row.component);
      if (!row.allowed && row.component === updatedRows[idx].component) {
        return { ...row, amount: 0, value: '', percent: '' };
      }
      return { ...row, amount: calculateAmount(row, compPolicy, updatedRows) };
    });

    setRows(recalculatedRows);
  };

  const totalSalary = rows.reduce((sum, row) => sum + (row.allowed ? Number(row.amount || 0) : 0), 0);
  
  const handleSaveSalary = async () => {
    try {
      setIsSaving(true);
      if (!selectedEmployee || !selectedMonth || !selectedYear) {
        alert('Please select employee, month and year');
        setIsSaving(false);
        return;
      }
      const monthNumber = (months.findIndex(m => m === selectedMonth) + 1).toString().padStart(2, '0');
      const salaryData = {
        employee: selectedEmployee,
        month: monthNumber,
        year: parseInt(selectedYear),
        components: rows.filter(row => row.allowed && row.component).map(row => ({
          name: row.component,
          type: row.type,
          value: row.type === "flat" ? parseFloat(row.value || 0) : undefined,
          percent: row.type === "percentage" ? parseFloat(row.percent || 0) : undefined,
          amount: parseFloat(row.amount),
          isDeduction: componentOptions.find(c => c.name === row.component)?.type === "deduction"
        })),
        basicSalary: getBasicSalaryAmount(rows),
        grossSalary: rows.filter(row => row.allowed && componentOptions.find(c => c.name === row.component)?.type !== "deduction").reduce((sum, row) => sum + Number(row.amount || 0), 0),
        netSalary: totalSalary
      };
      await axios.post("http://localhost:1000/api/salaries", salaryData);
      alert('Salary saved successfully!');
    } catch (error) {
      console.error('Failed to save salary:', error);
      alert(`Failed to save salary: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = (idx) => {
    const updatedRows = rows.filter((_, i) => i !== idx);
    setRows(updatedRows);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Employee Salary Generation</h2>
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Employee</label>
          <select className="form-select" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">Select Employee</option>
            {employees.map((employee) => (<option key={employee._id} value={employee._id}>{employee.name}</option>))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Month</label>
          <select className="form-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Select Month</option>
            {months.map((month) => (<option key={month} value={month}>{month}</option>))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Year</label>
          <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map((year) => (<option key={year} value={year}>{year}</option>))}
          </select>
        </div>
      </div>

      {selectedEmployee && selectedMonth && selectedYear && (
        <>
          <h3 className="mb-3">Salary Components</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Allow</th>
                <th>Component</th>
                <th>Type</th>
                <th>Value / %</th>
                <th>Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const compPolicy = componentOptions.find(c => c.name === row.component);
                return (
                  <tr key={idx}>
                    <td><input type="checkbox" checked={row.allowed} onChange={() => toggleAllowed(idx)} /></td>
                    <td><span className="fw-bold">{row.component}</span>{compPolicy?.calculateDays !== undefined && (<div className="text-muted small">(Calculate days: {compPolicy.calculateDays ? 'Yes' : 'No'})</div>)}</td>
                    <td>
                      <select className="form-select" value={row.type || "flat"} onChange={(e) => handleChange(idx, "type", e.target.value)} disabled={!row.allowed || row.component === 'BASIC'}>
                        <option value="flat">Flat</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </td>
                    <td>
                      {row.type === "flat" ? (<input type="number" className="form-control" value={row.value} onChange={(e) => handleChange(idx, "value", e.target.value)} placeholder="Enter value" disabled={!row.allowed}/>) : 
                      row.type === "percentage" ? (<div className="input-group"><input type="number" className="form-control" value={row.percent} onChange={(e) => handleChange(idx, "percent", e.target.value)} placeholder="% of BASIC" disabled={!row.allowed}/><span className="input-group-text">%</span></div>) : null}
                    </td>
                    <td><strong>{row.amount ? row.amount.toFixed(2) : '0.00'}</strong></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteRow(idx)}>Remove</button></td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={4} className="text-end"><b>Net Salary</b></td>
                <td colSpan={2}><b>{totalSalary.toFixed(2)}</b></td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-secondary mb-4" onClick={() => { setRows([...rows, { component: "", type: "flat", value: "", percent: "", amount: 0, allowed: true }]); }}>+ Add Custom Component</button>
          
          <div className="card mb-4">
            <div className="card-header bg-primary text-white"><h4 className="mb-0">Salary Bill Summary</h4></div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Employee Details</h5>
                  <p><strong>Name:</strong> {selectedEmployeeDetails?.name || 'N/A'}</p>
                  <p><strong>Month:</strong> {selectedMonth} {selectedYear}</p>
                  <p><strong>Working Days:</strong> {totalWorkingDays} | <strong>Paid Days:</strong> {presentDays + paidLeaves}</p>
                </div>
                <div className="col-md-6 text-end"><h5>Salary Summary</h5><p><strong>Net Payable Salary:</strong> ₹{totalSalary.toFixed(2)}</p></div>
              </div>
              <table className="table table-bordered">
                <thead><tr><th>Component</th><th>Amount (₹)</th></tr></thead>
                <tbody>
                  {rows.filter(row => row.allowed).map((row, idx) => ( <tr key={idx}><td>{row.component}</td><td>{row.amount.toFixed(2)}</td></tr> ))}
                  <tr className="table-active"><td><strong>Total Salary</strong></td><td><strong>₹{totalSalary.toFixed(2)}</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div className="card-footer text-end">
              <button className="btn btn-success me-2" onClick={handleSaveSalary} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Salary'}</button>
              <button className="btn btn-secondary">Print Salary Slip</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalaryGeneratePage;