import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ErrorToast from '@/components/ErrorToast';
import Overview from '@/pages/Overview';
import CabinetDetail from '@/pages/CabinetDetail';
import Cleanup from '@/pages/Cleanup';
import Overdue from '@/pages/Overdue';

export default function App() {
  return (
    <Router>
      <ErrorToast />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/cabinet/:id" element={<CabinetDetail />} />
          <Route path="/cleanup" element={<Cleanup />} />
          <Route path="/overdue" element={<Overdue />} />
        </Route>
      </Routes>
    </Router>
  );
}
