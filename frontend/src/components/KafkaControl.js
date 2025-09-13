import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KafkaControl = () => {
  const [status, setStatus] = useState('');
  const [kafkaStatus, setKafkaStatus] = useState('unknown');
  const [refreshButtonText, setRefreshButtonText] = useState('Refresh Status');
  const [startButtonText, setStartButtonText] = useState('Start Kafka');
  const [stopButtonText, setStopButtonText] = useState('Stop Kafka');

  const fetchKafkaStatus = async () => {
    setRefreshButtonText('Refreshing...');
    try {
      const response = await axios.get('http://localhost:8000/kafka/status');
      setKafkaStatus(response.data.status);
      setStatus('Kafka status fetched successfully.');
    } catch (error) {
      setKafkaStatus('stopped');
      setStatus(
        `Error fetching Kafka status: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setTimeout(() => setRefreshButtonText('Refresh Status'), 5000);
    }
  };

  const startKafka = async () => {
    setStartButtonText('Starting...');
    try {
      await axios.post('http://localhost:8000/kafka/start');
      setStatus('Kafka start requested');
      await fetchKafkaStatus();
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setTimeout(() => setStartButtonText('Start Kafka'), 5000);
    }
  };

  const stopKafka = async () => {
    setStopButtonText('Stopping...');
    try {
      await axios.post('http://localhost:8000/kafka/stop');
      setStatus('Kafka stop requested');
      await fetchKafkaStatus();
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setTimeout(() => setStopButtonText('Stop Kafka'), 5000);
    }
  };

  const getStatusColor = () => {
    if (kafkaStatus.includes('running')) return '#27ae60';
    if (kafkaStatus.includes('stopped')) return '#f39c12';
    return '#95a5a6';
  };

  useEffect(() => {
    fetchKafkaStatus();
    const interval = setInterval(fetchKafkaStatus, 1800000); // every 30 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="kafka-control container-card">
      <h2>Kafka Control</h2>
      <section className="card section">
        <h3>Kafka Status & Actions</h3>
        <div className="kafka-row">
          <div className="kafka-status">
            <div
              className="indicator-light"
              style={{ backgroundColor: getStatusColor() }}
            />
            <span className="status-text" style={{ color: getStatusColor() }}>
              {kafkaStatus}
            </span>
          </div>
          <div className="kafka-actions">
            <button onClick={fetchKafkaStatus} className="button refresh-button">
              {refreshButtonText}
            </button>
            <button
              onClick={startKafka}
              disabled={kafkaStatus.includes('running')}
              className="button start-button"
            >
              {startButtonText}
            </button>
            <button
              onClick={stopKafka}
              disabled={kafkaStatus.includes('stopped')}
              className="button stop-button"
            >
              {stopButtonText}
            </button>
          </div>
        </div>
      </section>

      {status && (
        <div
          className={`status ${status.includes('Error') ? 'error' : 'success'}`}
        >
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
};

export default KafkaControl;
