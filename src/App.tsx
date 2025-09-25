import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import AdminAnalytics from "./pages/admin/analytics";
import CustomersPage from "./pages/admin/customers";
import AdminDashboard from "./pages/admin/dashboard";
import AdminLogin from "./pages/admin/login";
import ReportsPage from "./pages/admin/reports";
import ProviderRequests from "./pages/admin/serviceProviders";
import ServicesPage from "./pages/admin/services";
import AdminSettings from "./pages/admin/settings";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import FirstPage from "./pages/firstPage";
import AllServiceProviders from "./pages/serviceNeeder/allServiceProviders";
import BookService from "./pages/serviceNeeder/bookService";
import ServiceNeederHomePage from "./pages/serviceNeeder/homePage";
import ServiceNeederLogin from "./pages/serviceNeeder/loginN";
import ServiceNeederRegister from "./pages/serviceNeeder/registerN";
import TrackService from "./pages/serviceNeeder/trackService";
import ForgotPasswordSP from "./pages/serviceProvider/forgotPasswordSP";
import ServiceProviderHomePage from "./pages/serviceProvider/homePage";
import ServiceProviderLogin from "./pages/serviceProvider/login";
import ServiceProviderRegister from "./pages/serviceProvider/register";
import ServiceProviderServices from "./pages/serviceProvider/services";
import UserType from "./pages/userType";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/user-type" element={<UserType />} />
        <Route
          path="/service-provider/register"
          element={<ServiceProviderRegister />}
        />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/service-provider" element={<ProviderRequests />} />
        <Route
          path="/service-provider/login"
          element={<ServiceProviderLogin />}
        />
        <Route
          path="/service-provider/dashboard"
          element={<ServiceProviderHomePage />}
        />
        <Route
          path="/service-needer/home"
          element={<ServiceNeederHomePage />}
        />
        <Route path="/book-service" element={<BookService />} />
        <Route
          path="/service-needer/register"
          element={<ServiceNeederRegister />}
        />
        <Route path="/service-needer/login" element={<ServiceNeederLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/service-provider/forgot-password"
          element={<ForgotPasswordSP />}
        />
        <Route path="/admin/services" element={<ServicesPage />} />
        <Route
          path="/service-needer/track-service"
          element={<TrackService />}
        />
        <Route
          path="/service-needer/all-service-providers"
          element={<AllServiceProviders />}
        />
        <Route
          path="/service-provider/services"
          element={<ServiceProviderServices />}
        />
        <Route path="/admin/customers" element={<CustomersPage />} />
      </Routes>
    </Router>
  );
}

export default App;
