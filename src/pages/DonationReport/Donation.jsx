import { useState, useEffect } from 'react';
import axios from 'axios';
import './Donation.scss';

const Donation = () => {
  const API_BASE_URL = 'https://matbus-backend.onrender.com/api/reports';

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/donation`);
      if (response.data.success) {
        setDonations(response.data.data);
      } else {
        throw new Error('API response was not successful.');
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      let errorMessage = 'An error occurred while fetching donation data.';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = `The API endpoint "${API_BASE_URL}/donation" was not found (404). Please check the URL.`;
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
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axios({
        url: `${API_BASE_URL}/donations/pdf`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Create a download link for the PDF blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Try to extract filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Donation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency (Kenghan Shillings)
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Ksh 0';
    return `Ksh ${amount.toLocaleString('en-KE')}`;
  };

  // Calculate status based on donation and approval dates
  const getDonationStatus = (donationDate, approvalDate) => {
    if (approvalDate) return 'Approved';
    const donation = new Date(donationDate);
    const now = new Date();
    const diffHours = (now - donation) / (1000 * 60 * 60);
    if (diffHours > 24) return 'Pending Review';
    return 'New Donation';
  };

  // Calculate total donations
  const calculateTotal = () => {
    return donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  };

  // Calculate average donation
  const calculateAverage = () => {
    if (donations.length === 0) return 0;
    return calculateTotal() / donations.length;
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  return (
    <div className="donation-container">
      <div className="table-header">
        <h1>Donations Report</h1>
        <div className="header-buttons">
          <button
            onClick={fetchDonations}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={downloadPDF}
            className="download-pdf-btn"
            disabled={pdfLoading || donations.length === 0}
          >
            {pdfLoading ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && !error && donations.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Donations</div>
            <div className="summary-value">{donations.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Amount</div>
            <div className="summary-value total-amount">{formatCurrency(calculateTotal())}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Average Donation</div>
            <div className="summary-value">{formatCurrency(calculateAverage())}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Approved Donations</div>
            <div className="summary-value">
              {donations.filter(d => d.approvalDate).length}
            </div>
          </div>
        </div>
      )}

      {loading && <div className="status-message loading">Loading donation data...</div>}
      {error && <div className="status-message error">{error}</div>}
      
      {!loading && !error && donations.length > 0 && (
        <div className="table-wrapper">
          <table className="donation-table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Donor Name</th>
                <th>Amount</th>
                <th>MPESA Code</th>
                <th>Donation Date</th>
                <th>Approval Date</th>
                <th>Status</th>
                <th>Days Since Donation</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item, index) => {
                const status = getDonationStatus(item.donationDate, item.approvalDate);
                const donationDate = new Date(item.donationDate);
                const now = new Date();
                const daysSinceDonation = Math.floor((now - donationDate) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={`${item.donationId}-${index}`}>
                    <td data-label="Donation ID" className="donation-id">{item.donationId || 'N/A'}</td>
                    <td data-label="Donor Name">{item.donor || 'N/A'}</td>
                    <td data-label="Amount" className="amount">{formatCurrency(item.amount)}</td>
                    <td data-label="MPESA Code" className="mpesa-code">{item.mpesaCode || 'N/A'}</td>
                    <td data-label="Donation Date">{formatDate(item.donationDate)}</td>
                    <td data-label="Approval Date">{item.approvalDate ? formatDate(item.approvalDate) : 'Not Approved'}</td>
                    <td data-label="Status">
                      <span className={`status-badge status-${status.toLowerCase().replace(/ /g, '-')}`}>
                        {status}
                      </span>
                    </td>
                    <td data-label="Days Since">
                      <span className={`days-badge ${daysSinceDonation > 30 ? 'old' : 'recent'}`}>
                        {daysSinceDonation} days
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <div className="summary">
              Showing <strong>{donations.length}</strong> donation record(s)
            </div>
            <div className="total-summary">
              Grand Total: <strong>{formatCurrency(calculateTotal())}</strong>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && donations.length === 0 && (
        <div className="status-message">No donation records found.</div>
      )}
    </div>
  );
};

export default Donation;