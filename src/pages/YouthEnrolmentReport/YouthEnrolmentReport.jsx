import { useState, useEffect } from 'react';
import axios from 'axios';
import './youthenrolment.scss';

const YouthEnrolment = () => {
  // Define your base API URL here. Please replace with the correct URL.
  const API_BASE_URL = 'https://matbus-backend.onrender.com/api/reports';

  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the table data
  const fetchEnrolments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Update this path if the endpoint is different
      const response = await axios.get(`${API_BASE_URL}/youth-enrolment`);
      if (response.data.success) {
        setEnrolments(response.data.data);
      } else {
        throw new Error('Failed to fetch data from server.');
      }
    } catch (err) {
      console.error('Error fetching enrolments:', err);
      setError('Could not load enrolment data. Please check the server connection.');
      setEnrolments([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    try {
      // Update this path if the PDF endpoint is different
      const response = await axios({
        url: `${API_BASE_URL}/youth-enrolment/pdf`,
        method: 'GET',
        responseType: 'blob', // Important for downloading files
      });

      // Create a download link for the PDF blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Youth_Enrolment_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Could not download the PDF report. The server might be unavailable.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Formats to DD/MM/YYYY
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchEnrolments();
  }, []);

  return (
    <div className="youth-enrolment-container">
      <div className="table-header">
        <h1>Youth Enrolment Report</h1>
        <button
          onClick={handleDownloadPdf}
          className="download-pdf-btn"
          disabled={loading || enrolments.length === 0}
        >
          {loading ? 'Loading...' : 'Download PDF Report'}
        </button>
      </div>

      {loading && <div className="status-message loading">Loading enrolment data...</div>}
      {error && <div className="status-message error">{error}</div>}
      {!loading && !error && enrolments.length === 0 && (
        <div className="status-message">No enrolment records found.</div>
      )}

      {!loading && !error && enrolments.length > 0 && (
        <div className="table-wrapper">
          <table className="enrolment-table">
            <thead>
              <tr>
                <th>Youth ID</th>
                <th>Youth Name</th>
                <th>Course</th>
                <th>MPESA Code</th>
                <th>Amount (Ksh)</th>
                <th>Payment Status</th>
                <th>Enrolment Date</th>
                <th>Completion Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrolments.map((item, index) => (
                <tr key={`${item.youthId}-${index}`}>
                  <td data-label="Youth ID">{item.youthId || 'N/A'}</td>
                  <td data-label="Youth Name">{item.youthName || 'N/A'}</td>
                  <td data-label="Course">{item.course || 'N/A'}</td>
                  <td data-label="MPESA Code">{item.payment?.mpesaCode || 'N/A'}</td>
                  <td data-label="Amount" className="amount">
                    {item.payment?.amount?.toLocaleString() || '0'}
                  </td>
                  <td data-label="Payment Status">
                    <span className={`status-badge payment-${item.payment?.status || 'unknown'}`}>
                      {item.payment?.status || 'N/A'}
                    </span>
                  </td>
                  <td data-label="Enrolment Date">{formatDate(item.enrollmentDate)}</td>
                  <td data-label="Completion Date">{formatDate(item.completionDate)}</td>
                  <td data-label="Status">
                    <span className={`status-badge enrolment-${item.status || 'unknown'}`}>
                      {item.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Total Records: <strong>{enrolments.length}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouthEnrolment;