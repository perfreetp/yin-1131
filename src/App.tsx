import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import PackageLedger from "@/pages/PackageLedger";
import CleaningRegister from "@/pages/CleaningRegister";
import SterilizationRelease from "@/pages/SterilizationRelease";
import ExceptionHandling from "@/pages/ExceptionHandling";
import InventoryBorrow from "@/pages/InventoryBorrow";
import TraceQuery from "@/pages/TraceQuery";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/packages" replace />} />
          <Route path="/packages" element={<PackageLedger />} />
          <Route path="/cleaning" element={<CleaningRegister />} />
          <Route path="/sterilization" element={<SterilizationRelease />} />
          <Route path="/exceptions" element={<ExceptionHandling />} />
          <Route path="/inventory" element={<InventoryBorrow />} />
          <Route path="/trace" element={<TraceQuery />} />
          <Route path="*" element={<Navigate to="/packages" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
