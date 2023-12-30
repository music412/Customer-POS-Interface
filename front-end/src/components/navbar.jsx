import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ListChecks, ShoppingCart } from "phosphor-react";
import {ChartBar } from "phosphor-react";
import {BookOpen } from "phosphor-react";
import {ChartLineUp } from "phosphor-react";
import {Person } from "phosphor-react";
import { IdentificationBadge } from "phosphor-react";
import { Article } from "phosphor-react";
import { FileSearch } from "phosphor-react";
import { CurrencyCircleDollar } from "phosphor-react";
import "./navbar.css";

export const Navbar = () => {
  const location = useLocation();

  const renderNavbarLinks = () => {
    if (location.pathname === "/customer") {
      return (
        <div className="links">
      
          <Link to="/customer">
            <ShoppingCart size={32} />
          </Link>
        </div>
      );
    } 
   
   
    
 
  };

  return <div className="navbar">{renderNavbarLinks()}</div>;
};
