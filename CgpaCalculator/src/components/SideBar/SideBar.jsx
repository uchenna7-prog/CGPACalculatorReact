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
    description:
      "Calculate your Cumulative GPA across all semesters. Input grades and credit units for every semester to get your overall academic standing.",
  },
  {
    id: "gpa",
    to: "/gpaCalculator",
    icon: "calculate",
    label: "GPA Calculator",
    description:
      "Calculate your GPA for a single semester. Add your courses, credit units, and grades to instantly see your semester result.",
  },

  { id: "predictor",
    to: "/cgpaPredictor",
    icon: "trending_up",
    label: "CGPA Predictor",
    description: "Know your current CGPA and total credit units completed? Enter your expected courses and grades for upcoming semesters to see what your CGPA could be in the future."

  },

  {
    id: "settings",
    to: "/settings",
    icon: "settings",
    label: "Settings",
    description:
      "Customize your calculator experience. Switch theme mode, adjust grading scale, reset saved data, and manage preferences.",
  },
];

function SideBar() {
  const { isCollapsed, isMobile, isOpen, toggleSideBar } =
    useSideBarContext();

  const [expanded, setExpanded] = useState(null);

  const toggle = (id) => {
    if (isCollapsed) return;
    setExpanded((prev) => (prev === id ? null : id));
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
        <header
          className={`${styles.sidebarHeader} ${
            isMobile ? styles.mobileSideHeader : ""
          }`}
        >
          <button className={styles.menuBtn} onClick={toggleSideBar}>
            <i className="material-icons">
              {isMobile && isOpen ? "close" : "menu"}
            </i>
          </button>
        </header>

        <nav className={styles.navLinksContainer}>
          {navItems.map((item) => (
            <div key={item.id} className={styles.navItem}>
              <div className={styles.navRow}>
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
                      expanded === item.id ? styles.arrowOpen : ""
                    }`}
                    onClick={() => toggle(item.id)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
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
                    expanded === item.id
                      ? styles.descriptionOpen
                      : ""
                  }`}
                >
                  <p>{item.description}</p>
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default SideBar;