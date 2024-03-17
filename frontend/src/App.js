import React from 'react'
import './App.css'
import {BrowserRouter, Routes ,Route, } from "react-router-dom";
import { Login, SignupPage } from './Routes';
function App() {
  return (
   <BrowserRouter>
   <Routes>
    <Route path='/login' element= {<Login/>}/>
    <Route path='/sign-up' element= {<SignupPage/>}/>
   </Routes>
   </BrowserRouter>
  )
}

export default App
