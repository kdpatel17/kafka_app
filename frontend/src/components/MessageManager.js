import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  );
};

const MessageManager = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [messageKey, setMessageKey] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [eventSource, setEventSource] = useState(null);
  const [toasts, setToasts] = useState([]);
  const messagesRef = useRef(null)

  const pushToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, {id, message, type}]);
  }

  const removeToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  // Fetch available topics on load
  useEffect(() => {
    fetchTopics();
    return () => stopConsumer();
    // eslint-disable-next-line
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await axios.get("http://localhost:8000/topics/list");
      // support both array-of-strings and { topics: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data.topics || res.data;
      setTopics(data);
    } catch (err) {
      console.error("Error fetching topics:", err);
      pushToast("Failed to fetch topics", "error");
    }
  };

  // Produce message
  const sendMessage = async () => {
    if (!selectedTopic || !messageKey || !messageValue) {
      pushToast("Please fill all fields: topic, key and value", "error");
      return;
    }
    try {
      await axios.post(`http://localhost:8000/topics/${selectedTopic}/messages`, {
        key: messageKey,
        value: messageValue,
      });
      pushToast("Message sent", "success")
      setMessageKey("");
      setMessageValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      pushToast("Failed to send message", "error");
    }
  };

  // Start consuming messages via SSE
  const startConsumer = () => {
    if (!selectedTopic) {
      pushToast("Please select a topic to start consumer", "error");
      return;
    }
    if (eventSource) {
      pushToast("Consumer already running", "info");
      return;
    }

    try {
      const es = new EventSource(`http://localhost:8000/topics/${selectedTopic}/stream`);
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const received = {
            key: msg.key ?? "N/A",
            value: msg.value ?? "",
            time: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random(),
          };
          setMessages((prev) => [...prev, received]);
          // auto-scroll
          setTimeout(() => {
            if (messagesRef.current) {
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
          }, 50);
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      };
      es.onerror = (err) => {
        console.error("SSE error:", err);
        pushToast("Consumer connection error — stopped", "error");
        es.close();
        setEventSource(null);
        setListening(false);
      };
      setEventSource(es);
      setListening(true);
      pushToast(`Consumer started for "${selectedTopic}"`, "success");
    } catch (err) {
      console.error("Error starting SSE:", err);
      pushToast("Failed to start consumer", "error");
    }
  };

  const stopConsumer = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setListening(false);
      pushToast("Consumer stopped", "info");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    pushToast("Messages cleared", "info");
  };
   //🔄

 return (
    <div className="message-manager container-card">
      <h2>Message Manager</h2>

      <div className="mm-grid">
        {/* Topic / Produce */}
        <div className="card producer-card">
          <div className="card-head">
            <h3>Producer</h3>
            <button className="button refresh-button small" onClick={fetchTopics} title="Refresh Topics">Refresh Topics</button>
          </div>

          <label className="field-label">Topic</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Select topic"
          >
            <option value="">-- Choose Topic --</option>
            {topics.map((t) => (
              <option key={typeof t === "string" ? t : t.name} value={typeof t === "string" ? t : t.name}>
                {typeof t === "string" ? t : (t.name || JSON.stringify(t))}
              </option>
            ))}
          </select>

          <label className="field-label">Key</label>
          <input
            type="text"
            placeholder="Message key"
            value={messageKey}
            onChange={(e) => setMessageKey(e.target.value)}
          />
          <label className="field-label">Value</label>
          <textarea
            placeholder="Message value"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
            rows={3}
          />

          <div className="producer-actions">
            <button className="button create-button" onClick={sendMessage}>Send</button>
            <button
              className="button cancel-button"
              onClick={() => { setMessageKey(""); setMessageValue(""); }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Consumer */}
        <div className="card consumer-card">
          <div className="card-head">
            <h3>Consumer</h3>
            <div className="consumer-controls">
              {!listening ? (
                <button className="button start-button" onClick={startConsumer} title="Start consumer">Start</button>
              ) : (
                <button className="button stop-button" onClick={stopConsumer} title="Stop consumer">Stop</button>
              )}
              <button className="button refresh-button small" onClick={clearMessages} title="Clear logs">Clear</button>
            </div>
          </div>

          <div className="messages" ref={messagesRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty">No messages received yet.</div>
            ) : (
              messages.map((m) => (
                <div className="message-row" key={m.id}>
                  <div className="message-meta">
                    <span className="badge key-badge">{m.key}</span>
                    <span className="time-text">{m.time}</span>
                  </div>
                  <div className="message-body">{m.value}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toaster */}
      <div className="toaster">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default MessageManager;
