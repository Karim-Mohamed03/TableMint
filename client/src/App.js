import React from 'react';
import './App.css';
import TablePage from './pages/TablePage';
import PaymentPage from "./receiptScreen/PaymentPage";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Order Management</h1>
      </header>
      <main>
        <TablePage />
        <PaymentPage />
      </main>
      <footer>
        <p>© {new Date().getFullYear()} Test Restaurant App</p>
      </footer>
    </div>
  );
}

export default App;