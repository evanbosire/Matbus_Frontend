import { useState, useEffect } from 'react';
import axios from 'axios';
import './Events.scss';

const Events = () => {
  const API_BASE_URL = 'https://matbus-backend.onrender.com/api/reports';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/events`);
      if (response.data.success) {
        setEvents(response.data.data);
      } else {
        throw new Error('API response was not successful.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      let errorMessage = 'An error occurred while fetching event data.';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = `The API endpoint "${API_BASE_URL}/events" was not found (404). Please check the URL.`;
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
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axios({
        url: `${API_BASE_URL}/events/pdf`,
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
      let filename = `Events_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
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

  // Format date with time
  const formatDateTime = (dateString) => {
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

  // Calculate event duration in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Check if event is upcoming
  const isUpcoming = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    return start > now;
  };

  // Filter events based on status
  const filteredEvents = events.filter(event => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'upcoming') return isUpcoming(event.startDate);
    return event.status === filterStatus;
  });

  // Calculate event statistics
  const calculateStats = () => {
    const stats = {
      total: events.length,
      completed: events.filter(e => e.status === 'completed').length,
      inProgress: events.filter(e => e.status === 'in_progress').length,
      upcoming: events.filter(e => isUpcoming(e.startDate)).length,
      totalVolunteers: events.reduce((sum, event) => sum + (event.volunteers?.length || 0), 0),
      uniqueLocations: [...new Set(events.map(e => e.location))].length
    };
    return stats;
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const stats = calculateStats();

  return (
    <div className="events-container">
      <div className="table-header">
        <div>
          <h1>Community Events Report</h1>
          <p className="subtitle">Track and manage community service events</p>
        </div>
        <div className="header-buttons">
          <button
            onClick={fetchEvents}
            className="refresh-btn"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={downloadPDF}
            className="download-pdf-btn"
            disabled={pdfLoading || events.length === 0}
          >
            {pdfLoading ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      
      {/* Filter Controls */}
      {!loading && !error && events.length > 0 && (
        <div className="filter-controls">
          <div className="filter-label">Filter by Status:</div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All Events ({events.length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({stats.completed})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilterStatus('in_progress')}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilterStatus('upcoming')}
            >
              Upcoming ({stats.upcoming})
            </button>
          </div>
        </div>
      )}

      {loading && <div className="status-message loading">Loading event data...</div>}
      {error && <div className="status-message error">{error}</div>}
      
      {!loading && !error && filteredEvents.length > 0 && (
        <div className="table-wrapper">
          <table className="events-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Volunteers</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => {
                const duration = calculateDuration(event.startDate, event.endDate);
                const upcoming = isUpcoming(event.startDate);
                
                return (
                  <tr key={`${event.eventId}-${index}`}>
                    <td data-label="Event ID" className="event-id">{event.eventId || 'N/A'}</td>
                    <td data-label="Title" className="event-title">{event.title || 'N/A'}</td>
                    <td data-label="Description" className="event-description">
                      {event.description || 'No description'}
                    </td>
                    <td data-label="Location">
                      <span className="location-badge">{event.location || 'N/A'}</span>
                    </td>
                    <td data-label="Start Date">{formatDate(event.startDate)}</td>
                    <td data-label="End Date">{formatDate(event.endDate)}</td>
                    <td data-label="Duration" className="duration">{duration}</td>
                    <td data-label="Status">
                      <span className={`status-badge status-${event.status || 'unknown'} ${upcoming ? 'upcoming' : ''}`}>
                        {upcoming ? 'Upcoming' : event.status === 'in_progress' ? 'In Progress' : event.status || 'Unknown'}
                      </span>
                    </td>
                    <td data-label="Volunteers">
                      <div className="volunteers-list">
                        {event.volunteers && event.volunteers.length > 0 ? (
                          <>
                            <span className="volunteer-count">{event.volunteers.length} volunteer(s)</span>
                            <div className="volunteer-names">
                              {event.volunteers.slice(0, 2).map((volunteer, idx) => (
                                <span key={idx} className="volunteer-name">{volunteer}</span>
                              ))}
                              {event.volunteers.length > 2 && (
                                <span className="more-volunteers">+{event.volunteers.length - 2} more</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="no-volunteers">No volunteers</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <div className="summary">
              Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> event(s)
              {filterStatus !== 'all' && ` (filtered by ${filterStatus.replace('_', ' ')})`}
            </div>
            <div className="total-summary">
              Total Volunteers Across All Events: <strong>{stats.totalVolunteers}</strong>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredEvents.length === 0 && events.length > 0 && (
        <div className="status-message">
          No events found with the selected filter. Try changing the filter criteria.
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="status-message">No event records found.</div>
      )}
    </div>
  );
};

export default Events;