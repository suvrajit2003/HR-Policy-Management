import React, { useState, useEffect } from 'react';
import axios from 'axios';

import 'bootstrap-icons/font/bootstrap-icons.css';

const SalarySlipForm = () => {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  const sortComponents = (componentArray) => {
  const sortedArray = [...componentArray];

    sortedArray.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();

      // Rule 1: If component 'a' is "ARREAR", it should come AFTER 'b'.
      if (nameA === 'ARREAR') {
        return 1; // Pushes 'a' to the end
      }
      // Rule 2: If component 'b' is "ARREAR", it should come AFTER 'a'.
      if (nameB === 'ARREAR') {
        return -1; // Pushes 'b' to the end (keeps 'a' before it)
      }
      // Rule 3: For all other components, sort them alphabetically.
      return nameA.localeCompare(nameB);
    });
    
    return sortedArray;
  };

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await axios.get('http://localhost:1000/api/components');
        const data = Array.isArray(response.data) ? response.data : 
        (Array.isArray(response.data.components) ? response.data.components : []);
        
        const processedComponents = data.map(comp => ({
          ...comp,
          calculateDays: comp.calculateDays ? 'yes' : 'no'
        }));
        
        // FIX: Apply sorting right after fetching data
        setComponents(sortComponents(processedComponents));

      } catch (error) {
        console.error('Error fetching components:', error);
        setComponents([]);
      }
    };
    fetchComponents();
  }, []);

  const handleAddComponent = () => {
    const newId = Date.now();
    
    // FIX: Add the new component and then re-sort the entire array
    setComponents((prev) => {
      const newArray = [
        ...prev,
        {
          id: newId,
          name: '',
          type: 'earning',
          calculateDays: 'no',
          isNew: true
        }
      ];
      return sortComponents(newArray);
    });
  };

  const handleComponentChange = (index, field, value) => {
    setComponents((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleRemoveComponent = (index) => {
    const componentToRemove = components[index];
    if (componentToRemove._id) {
      if(window.confirm(`Are you sure you want to delete the "${componentToRemove.name}" component from the database? This action cannot be undone.`)){
        axios.delete(`http://localhost:1000/api/components/${componentToRemove._id}`)
          .then(() => {
            setComponents((prev) => prev.filter((_, i) => i !== index));
            alert('Component deleted successfully from the database.');
          })
          .catch(err => {
            console.error("Error deleting component:", err);
            alert('Failed to delete component from the database.');
          });
      }
    } else {
       setComponents((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const componentsToSave = components.map((component) => ({
        name: component.name,
        type: component.type,
        calculateDays: component.calculateDays === 'yes', 
        ...(component._id && { _id: component._id })
      }));

      const { data } = await axios.post(
        'http://localhost:1000/api/components',
        { components: componentsToSave }
      );
      
      const processedData = data.map(comp => ({
        ...comp,
        calculateDays: comp.calculateDays ? 'yes' : 'no'
      }));

      // FIX: Apply sorting after the data is returned from the save operation
      setComponents(sortComponents(processedData));
      
      alert('✅ Components saved successfully!');
    } catch (error) {
      console.error('Error saving components:', error);
      alert('❌ Failed to save components. Ensure names are unique.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Salary Components</h4>
          <i className="bi bi-cash-stack fs-4"></i>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Component Name</th>
                  <th>Type</th>
                  <th>Calculate Days</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(components) && components.length > 0 ? (
                  components.map((component, index) => (
                    <tr key={component._id || component.id}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={component.name}
                          onChange={(e) =>
                            handleComponentChange(index, 'name', e.target.value)
                          }
                          placeholder="e.g., Arrear, Bonus"
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={component.type}
                          onChange={(e) =>
                            handleComponentChange(index, 'type', e.target.value)
                          }
                        >
                          <option value="earning">Earning</option>
                          <option value="deduction">Deduction</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={component.calculateDays}
                          onChange={(e) =>
                            handleComponentChange(index, 'calculateDays', e.target.value)
                          }
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveComponent(index)}
                        >
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No components found. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={handleAddComponent}
            >
              <i className="bi bi-plus-circle"></i> Add Component
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save"></i> Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipForm;