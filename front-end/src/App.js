import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";


import { Navbar } from "./components/navbar";

import { Customer } from "./pages/customer/customer";


function App() {

  const backend = "http://project3loginbackend.onrender.com"

  return (
    <div className="App">
      <Router>
        <Navbar /> 
        <Routes>

          <Route path="/" element={<Customer />} />

        </Routes>
     
      
  
      </Router>
    

    </div>
  );
}

export default App;
