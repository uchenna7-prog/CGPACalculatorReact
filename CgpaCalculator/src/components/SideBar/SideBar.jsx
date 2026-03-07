import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./SideBar.module.css";
import { useSideBarContext } from "../../contexts/SideBarContext";

const navItems = [
  {
    id: "cgpa",
    to: "/",
    icon: "school",
    label: "CGPA Calculator",
    description: [
      "Automatically structures semesters from Year 1 onward",
      "Add unlimited semesters across your academic journey",
      "Calculate GPA for each individual semester",
      "Instantly compute your cumulative CGPA",
      "View a complete academic summary",
      "Saves your records locally for future access",
    ],
  },
  {
    id: "gpa",
    to: "/gpaCalculator",
    icon: "calculate",
    label: "GPA Calculator",
    description: [
      "Calculate GPA for a single semester",
      "Add courses with grades and credit units",
      "Instantly compute semester GPA",
      "Fast and simple quick calculation tool",
    ],
  },
  {
    id: "predictor",
    to: "/cgpaPredictor",
    icon: "trending_up",
    label: "CGPA Predictor",
    description: [
      "Enter your current CGPA and total credit units",
      "Choose how many future semesters to predict",
      "Add projected courses for each semester",
      "Predict GPA for upcoming semesters",
      "See your projected final CGPA instantly",
    ],
  },
  {
    id: "settings",
    to: "/settings",
    icon: "settings",
    label: "Settings",
    description: [
      "Toggle light and dark theme",
      "Select grading scale (4.0 or 5.0 system)",
      "Choose preferred decimal precision",
      "Reset or manage saved academic data",
      "Customize calculation preferences",
    ],
  },
];

export default function SideBar() {
  const { isCollapsed, isMobile, isOpen, toggleSideBar } =
    useSideBarContext();

  const [expanded, setExpanded] = useState(null);

  const toggle = (id) => {
    if (isCollapsed) return;
    setExpanded(prev => (prev === id ? null : id));
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className={styles.overlay} onClick={toggleSideBar} />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${
          isMobile
            ? isOpen
              ? styles.mobileOpen
              : styles.mobileClosed
            : ""
        }`}
      >
        <header className={`${styles.sidebarHeader} ${isMobile ? styles.mobileSideHeader : ""}`}>
          <button className={styles.menuBtn} onClick={toggleSideBar}>
            <i className="material-icons">
              {isMobile && isOpen ? "close" : "menu"}
            </i>
          </button>
        </header>

        <nav className={styles.navLinksContainer}>
          {navItems.map(item => {
            const isExpanded = expanded === item.id;
            return (
              <div
                key={item.id}
                className={`${styles.navItem} ${
                  isExpanded ? styles.navItemExpanded : ""
                }`}
              >
                <div
                  className={`${styles.navRow} ${
                    isExpanded ? styles.navRowExpanded : ""
                  }`}
                >
                  <Link
                    to={item.to}
                    className={`${styles.navBtn} ${
                      isCollapsed ? styles.navBtnCollapsed : ""
                    }`}
                    onClick={() => isMobile && toggleSideBar()}
                  >
                    <i className="material-icons">{item.icon}</i>
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>

                  {!isCollapsed && (
                    <button
                      className={`${styles.arrowBtn} ${
                        isExpanded ? styles.arrowOpen : ""
                      }`}
                      onClick={() => toggle(item.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 6L8 11L13 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {!isCollapsed && (
                  <div
                    className={`${styles.description} ${
                      isExpanded ? styles.descriptionOpen : ""
                    }`}
                  >
                    <ul className={styles.descriptionList}>
                      {item.description.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className={styles.sidebarFooter}>
            <p>
              © {new Date().getFullYear()} All rights reserved
            </p>
            <a
              href="https://uchendu-uchenna-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Built by Uchendu Uchenna
            </a>
          </div>
        )}
      </aside>
    </>
  );
}