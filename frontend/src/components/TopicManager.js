import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TopicManager = () => {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState({
    name: '',
    partitions: 1,
    replicationFactor: 1,
  });
  const [status, setStatus] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState('');

  // Fetch all topics
  const fetchTopics = async () => {
    setLoadingRefresh(true);
    try {
      const response = await axios.get('http://localhost:8000/topics/list');
      setTopics(response.data);
    } catch (error) {
      setStatus(`Error fetching topics: ${error.response?.data?.error || error.message}`);
    } finally {
      setTimeout(() => setLoadingRefresh(false), 5000);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Create topic
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    try {
      const response = await axios.post('http://localhost:8000/topics', {
        name: newTopic.name,
        partitions: newTopic.partitions,
        replication_factor: newTopic.replicationFactor,
      });
      setStatus(response.data.status);
      setNewTopic({ name: '', partitions: 1, replicationFactor: 1 });
      fetchTopics();
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingCreate(false);
    }
  };

  // Delete topic
  const handleDeleteTopic = async () => {
    setLoadingDelete(true);
    try {
      const response = await axios.delete(`http://localhost:8000/topics/${topicToDelete}`);
      setStatus(response.data.status);
      closeDeleteModal();
      fetchTopics();
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  const openDeleteModal = (topic) => {
    setTopicToDelete(topic);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTopicToDelete('');
  };

  // Auto-clear status after 5 seconds
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="topic-manager container-card">
      <h2>Topic Manager</h2>

      {/* Create */}
      <section className="card section">
        <h3>Create Topic</h3>
        <form onSubmit={handleCreateTopic} className="form">
          <div className="form-group">
            <label>Topic Name:</label>
            <input
              type="text"
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Partitions:</label>
            <input
              type="number"
              value={newTopic.partitions}
              onChange={(e) => setNewTopic({ ...newTopic, partitions: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label>Replication Factor:</label>
            <input
              type="number"
              value={newTopic.replicationFactor}
              onChange={(e) => setNewTopic({ ...newTopic, replicationFactor: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <button type="submit" disabled={loadingCreate} className="button create-button">
            {loadingCreate ? 'Creating...' : 'Create Topic'}
          </button>
        </form>
      </section>

      {/* List */}
      <section className="card section">
        <div className="section-header">
          <h3>List of Topics</h3>
          <button onClick={fetchTopics} disabled={loadingRefresh} className="button refresh-button">
            {loadingRefresh ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {topics.length > 0 ? (
          <ul className="topic-list">
            {topics.map((topic) => (
              <li key={topic} className="topic-item">
                {topic}
                <button onClick={() => openDeleteModal(topic)} className="button delete-button small">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No topics found.</p>
        )}
      </section>

      {/* Status */}
      {status && (
        <div className={`status ${status.includes('Error') ? 'error' : 'success'}`}>
          <strong>Status:</strong> {status}
        </div>
      )}

      {/* Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete the topic <strong>{topicToDelete}</strong>?</p>
            <div className="modal-actions">
              <button onClick={closeDeleteModal} className="button cancel-button">Cancel</button>
              <button onClick={handleDeleteTopic} disabled={loadingDelete} className="button delete-button">
                {loadingDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
