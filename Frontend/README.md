# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh




  const handleSubmitToDatabase = async () => {
    if (salaryOverviewData.length === 0) {
      setError("No salary data available to submit");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    setError(null);

    try {
      const response = await axios.post("http://localhost:1000/save-salary-slips", {
        month: months.find(m => m.value === selectedMonth)?.label,
        year: selectedYear,
        salaryData: salaryOverviewData.filter(slip => slip.status === "success")
      });

      if (response.data.success) {
        setSubmitSuccess(`Salary slips for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear} saved successfully!`);
      } else {
        setError(response.data.message || "Failed to save salary slips");
      }
    } catch (err) {
      console.error("Error submitting salary slips:", err);
      setError(err.response?.data?.message || "Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };