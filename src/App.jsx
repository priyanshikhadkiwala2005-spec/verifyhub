
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Login Page
import Login from "./pages/auth/Login.jsx";

// Super Admin Layout
import AdminLayout from "./components/layout/AdminLayout.jsx";

// Super Admin Pages
import Overview from "./pages/super-admin/Overview.jsx";
import Retailers from "./pages/super-admin/Retailers.jsx";
import KYCServices from "./pages/super-admin/KYCServices.jsx";
import Pricing from "./pages/super-admin/Pricing.jsx";
import Wallet from "./pages/super-admin/Wallet.jsx";
import VerificationRecords from "./pages/super-admin/VerificationRecords.jsx";
import Reports from "./pages/super-admin/Reports.jsx";
import Settings from "./pages/super-admin/Settings.jsx";

// Retailer Layout
import RetailerLayout from "./components/retailer/RetailerLayout.jsx";

// Retailer Pages
import RetailerOverview from "./pages/retailer/Overview.jsx";
import CompleteKYC from "./pages/retailer/CompleteKYC.jsx";
import AadhaarVerification from "./pages/retailer/AadhaarVerification.jsx";
import PANVerification from "./pages/retailer/PANVerification.jsx";
import BankPennyDrop from "./pages/retailer/BankPennyDrop.jsx";
import ConsentESign from "./pages/retailer/ConsentESign.jsx";
import RetailerWallet from "./pages/retailer/Wallet.jsx";
import VerificationHistory from "./pages/retailer/VerificationHistory.jsx";
import RetailerProfile from "./pages/retailer/Profile.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* ==============================
            SUPER ADMIN ROUTES
        ============================== */}
        <Route
          path="/super-admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={<Navigate to="overview" replace />}
          />

          <Route
            path="overview"
            element={<Overview />}
          />

          <Route
            path="retailers"
            element={<Retailers />}
          />

          <Route
            path="kyc-services"
            element={<KYCServices />}
          />

          <Route
            path="pricing"
            element={<Pricing />}
          />

          <Route
            path="wallet"
            element={<Wallet />}
          />

          <Route
            path="verification-records"
            element={<VerificationRecords />}
          />

          <Route
            path="reports"
            element={<Reports />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>

        {/* ==============================
            RETAILER ROUTES
        ============================== */}
        <Route
          path="/retailer"
          element={<RetailerLayout />}
        >
          <Route
            index
            element={<Navigate to="overview" replace />}
          />

          <Route
            path="overview"
            element={<RetailerOverview />}
          />

          <Route
           path="complete-kyc" 
           element={<CompleteKYC />} />

           <Route
  path="aadhaar-verification"
  element={<AadhaarVerification />}
/>

<Route
  path="pan-verification"
  element={<PANVerification />}
/>

<Route
  path="bank-penny-drop"
  element={<BankPennyDrop />}
/>

<Route
  path="consent-esign"
  element={<ConsentESign />}
/>

<Route 
path="wallet" 
element={<RetailerWallet />} />

<Route
  path="verification-history"
  element={<VerificationHistory />}
/>

<Route 
path="profile" 
element={<RetailerProfile />} />
        </Route>

        

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
