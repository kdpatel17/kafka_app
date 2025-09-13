import React from 'react';
import './App.css';
import KafkaControl from './components/KafkaControl';
import TopicManager from './components/TopicManager';
import MessageManager from "./components/MessageManager";
import APIManager from "./components/ApiManager";
function App() {
  return (
    <div className="App">
      <h1>Kafka Management Dashboard</h1>
      <KafkaControl />
      <TopicManager />
      <MessageManager/>
      <APIManager />
    </div>
  );
}

export default App;
