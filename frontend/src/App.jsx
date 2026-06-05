import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import RecruitmentFlow from './pages/RecruitmentFlow';
import './styles.css';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <Topbar />
        <div className="single-page-workspace">
          <RecruitmentFlow />
        </div>
      </main>
    </div>
  );
}
