import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./page";
import UrbanismePage from "./urbanisme/page";
import AgriculturePage from "./agriculture/page";
import RisquesPage from "./risques/page";
import HabitatPage from "./habitat/page";
import SecuriteRoutierePage from "./securite-routiere/page";
import DataInformationPage from "./donnees/page";
import DecisionTerritorialePage from "./decision-territoriale/page";
import "./globals.css";
import "./understand-compact.css";

const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const pathname = window.location.pathname.replace(basePath, "") || "/";
const requestedPage = new URLSearchParams(window.location.search).get("page");
const routes: Record<string, React.ComponentType> = {
  "/": Home,
  "/urbanisme": UrbanismePage,
  "/agriculture": AgriculturePage,
  "/risques": RisquesPage,
  "/habitat": HabitatPage,
  "/securite-routiere": SecuriteRoutierePage,
  "/donnees": DataInformationPage,
  "/decision-territoriale": DecisionTerritorialePage,
};
const queryRoutes: Record<string, React.ComponentType> = { donnees: DataInformationPage, decision: DecisionTerritorialePage };
const Page = (requestedPage && queryRoutes[requestedPage]) || routes[pathname.replace(/\/$/, "") || "/"] || Home;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><Page /></React.StrictMode>,
);
