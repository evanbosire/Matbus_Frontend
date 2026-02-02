import { useState, useEffect } from 'react';
import axios from 'axios';
import './Supplies.scss';

const Supplies = () => {
  const API_BASE_URL = 'https://matbus-backend.onrender.com/api/reports';

  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSupplies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/supplies`);
      if (response.data.success) {
        setSupplies(response.data.data);
      } else {
        throw new Error('API response was not successful.');
      }
    } catch (err) {
      console.error('Error fetching supplies:', err);
      let errorMessage = 'An error occurred while fetching supply data.';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = `The API endpoint "${API_BASE_URL}/supplies" was not found (404). Please check the URL.`;
            break;
          case 500:
            errorMessage = 'Server error (500). Please try again later.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to view this resource.';
            break;
          default:
            errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection or the server might be down.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      setSupplies([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axios({
        url: `${API_BASE_URL}/supplies/pdf`,
        method: 'GET',
        responseType: 'blob', // Important for downloading files
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Create a download link for the PDF blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Try to extract filename from response headers, fallback to default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Supply_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      let errorMessage = 'Failed to download PDF report.';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = 'PDF report endpoint not found (404). The server might not have PDF generation configured.';
            break;
          case 500:
            errorMessage = 'Server error while generating PDF. Please try again later.';
            break;
          default:
            errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      alert(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency (Kenghan Shillings)
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Ksh 0';
    return `Ksh ${amount.toLocaleString('en-KE')}`;
  };

  // Calculate a status based on dates (example logic)
  const getStatus = (requestDate, acceptedDate) => {
    if (acceptedDate) return 'Accepted';
    const request = new Date(requestDate);
    const now = new Date();
    const diffHours = (now - request) / (1000 * 60 * 60);
    if (diffHours > 24) return 'Pending';
    return 'New Request';
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  return (
    <div className="supplies-container">
      <div className="table-header">
        <h1>Supply Requests Report</h1>
        <div className="header-buttons">
          <button
            onClick={fetchSupplies}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={downloadPDF}
            className="download-pdf-btn"
            disabled={pdfLoading || supplies.length === 0}
          >
            {pdfLoading ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {loading && <div className="status-message loading">Loading supply data...</div>}
      {error && <div className="status-message error">{error}</div>}
      
      {!loading && !error && supplies.length > 0 && (
        <div className="table-wrapper">
          <table className="supplies-table">
            <thead>
              <tr>
                <th>Supply ID</th>
                <th>Material</th>
                <th>Request Date</th>
                <th>Quantity</th>
                <th>Price/Unit</th>
                <th>Total Price</th>
                <th>Supplier</th>
                <th>Accepted Date</th>
                <th>Status</th>
                <th>Payment ID</th>
                <th>MPESA Code</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((item, index) => {
                const status = getStatus(item.requestDate, item.acceptedDate);
                return (
                <tr key={`${item.supplyId}-${index}`}>
                  <td data-label="Supply ID">{item.supplyId || 'N/A'}</td>
                  <td data-label="Material">{item.material || 'N/A'}</td>
                  <td data-label="Request Date">{formatDate(item.requestDate)}</td>
                  <td data-label="Quantity" className="quantity">{item.quantity || '0'}</td>
                  <td data-label="Price/Unit" className="currency">{formatCurrency(item.pricePerUnit)}</td>
                  <td data-label="Total Price" className="currency total">{formatCurrency(item.totalPrice)}</td>
                  <td data-label="Supplier">{item.supplier || 'N/A'}</td>
                  <td data-label="Accepted Date">{formatDate(item.acceptedDate)}</td>
                  <td data-label="Status">
                    <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </td>
                  <td data-label="Payment ID">{item.supplyPaymentId || 'N/A'}</td>
                  <td data-label="MPESA Code" className="mpesa-code">{item.mpesaCode || 'N/A'}</td>
                </tr>
              )})}
            </tbody>
          </table>
          <div className="table-footer">
            <div className="summary">
              Showing <strong>{supplies.length}</strong> supply record(s)
            </div>
            <div className="total-summary">
              Total Value: <strong>{formatCurrency(supplies.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}</strong>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && supplies.length === 0 && (
        <div className="status-message">No supply records found.</div>
      )}
    </div>
  );
};

export default Supplies;