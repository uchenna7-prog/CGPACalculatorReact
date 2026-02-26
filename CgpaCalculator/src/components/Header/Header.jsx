import styles from "./Header.module.css";
import { useSideBarContext } from "../../contexts/SideBarContext";

function Header() {
  const { isMobile, toggleSideBar } = useSideBarContext();

  return (
    <header className={styles.header}>
      
      {isMobile && (
        <button
          className={styles.menuButton}
          onClick={toggleSideBar}
          aria-label="Toggle Sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
      )}

      <div className={styles.brandContainer}>
        <i className={`fas fa-graduation-cap ${styles.brandIcon}`}></i>

        <h1 className={styles.appTitle}>
          CGPA Calculator for Nigerian Students
        </h1>
      </div>
    </header>
  );
}

export default Header;