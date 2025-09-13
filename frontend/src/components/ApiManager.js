import React, { useState, useEffect } from "react";
import axios from "axios";

const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

const ApiManager = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [apiName, setApiName] = useState("");
  const [dataPath, setDataPath] = useState("");
  const [apiSchema, setApiSchema] = useState(null);
  const [messages, setMessages] = useState([]);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  // Fetch topics on load
  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await axios.get("http://localhost:8000/topics/list");
      const data = Array.isArray(res.data) ? res.data : res.data.topics || res.data;
      setTopics(data);
    } catch (err) {
      console.error("Error fetching topics:", err);
      pushToast("Failed to fetch topics", "error");
    }
  };

  const testAPI = async () => {
    if (!apiUrl || !selectedTopic || !apiName) {
      pushToast("Please provide API URL, Topic, and API Name", "error");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/api/test", {
        url: apiUrl,
        token: apiToken || null,
        topic: selectedTopic,
        api_name: apiName,
        data_path: dataPath || null,
      });
      pushToast(res.data.status, "success");
    } catch (err) {
      console.error("API test failed:", err);
      pushToast("API test failed", "error");
    }
  };

  const fetchSchema = async () => {
    if (!apiUrl || !selectedTopic || !apiName) {
      pushToast("Please provide API URL, Topic, and API Name", "error");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/api/schema", {
        url: apiUrl,
        token: apiToken || null,
        topic: selectedTopic,
        api_name: apiName,
        data_path: dataPath || null,
      });
      setApiSchema(res.data.schema);
      pushToast("Schema fetched", "success");
    } catch (err) {
      console.error("Schema fetch failed:", err);
      pushToast("Failed to fetch schema", "error");
    }
  };

  const produceFromAPI = async () => {
    if (!apiUrl || !selectedTopic || !apiName) {
      pushToast("Please provide API URL, Topic, and API Name", "error");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/api/produce", {
        url: apiUrl,
        token: apiToken || null,
        topic: selectedTopic,
        api_name: apiName,
        data_path: dataPath || null,
      });
      pushToast(res.data.status, "success");
    } catch (err) {
      console.error("Produce failed:", err);
      pushToast("Failed to produce from API", "error");
    }
  };

  const fetchMessages = async () => {
    if (!selectedTopic || !apiName) {
      pushToast("Please select a topic and provide API Name", "error");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/api/fetch-data", {
        url: apiUrl,
        token: apiToken || null,
        topic: selectedTopic,
        api_name: apiName,
        data_path: dataPath || null,
      });

      // if backend returns messages directly
      if (res.data.sample) {
        const data = Array.isArray(res.data.sample)
          ? res.data.sample
          : [res.data.sample];
        setMessages(data);
        pushToast(`Fetched ${data.length} messages`, "success");
      } else {
        pushToast(res.data.status || "Data fetched", "success");
      }
    } catch (err) {
      console.error("Fetch messages failed:", err);
      pushToast("Failed to fetch messages", "error");
    }
  };

  return (
    <div className="api-manager container-card">
      <h2>API Manager</h2>

      <div className="card api-card">
        <div className="card-head">
          <h3>API Configuration</h3>
          <button
            className="button refresh-button small"
            onClick={fetchTopics}
          >
            Refresh Topics
          </button>
        </div>

        <label className="field-label">Kafka Topic</label>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          aria-label="Select topic"
        >
          <option value="">-- Choose Topic --</option>
          {topics.map((t) => (
            <option
              key={typeof t === "string" ? t : t.name}
              value={typeof t === "string" ? t : t.name}
            >
              {typeof t === "string" ? t : t.name}
            </option>
          ))}
        </select>

        <label className="field-label">API URL</label>
        <input
          type="text"
          placeholder="https://api.example.com/data"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
        />

        <label className="field-label">API Token (optional)</label>
        <input
          type="password"
          placeholder="Enter authentication token"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
        />

        <label className="field-label">API Name</label>
        <input
          type="text"
          placeholder="Unique API identifier"
          value={apiName}
          onChange={(e) => setApiName(e.target.value)}
        />

        <label className="field-label">Data Path (optional)</label>
        <input
          type="text"
          placeholder="Optional nested path (e.g. results/items)"
          value={dataPath}
          onChange={(e) => setDataPath(e.target.value)}
        />

        <div className="api-actions">
          <button className="button start-button" onClick={testAPI}>
            Test API
          </button>
          <button className="button refresh-button" onClick={fetchSchema}>
            Get Schema
          </button>
          <button className="button create-button" onClick={produceFromAPI}>
            Produce from API
          </button>
          <button className="button list-button" onClick={fetchMessages}>
            Fetch Messages
          </button>
        </div>

        {apiSchema && (
          <div className="schema-box">
            <h4>Schema</h4>
            <pre>{JSON.stringify(apiSchema, null, 2)}</pre>
          </div>
        )}

        {messages.length > 0 && (
          <div className="messages-box">
            <h4>Collected Messages</h4>
            <table>
              <thead>
                <tr>
                  {Object.keys(messages[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, idx) => (
                  <tr key={idx}>
                    {Object.keys(messages[0]).map((key) => (
                      <td key={key}>{String(msg[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toaster */}
      <div className="toaster">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ApiManager;
