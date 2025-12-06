import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Auth Pages
import Auth from '@/pages/Auth';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageUsers from '@/pages/admin/ManageUsers';
import ManagePatients from '@/pages/admin/ManagePatients';
import ManageDoctors from '@/pages/admin/ManageDoctors';
import AdminAppointments from '@/pages/admin/Appointments';
import AddAppointment from '@/pages/admin/AddAppointment';
import AdminMedicalRecords from '@/pages/admin/MedicalRecords';
import AdminLabTests from '@/pages/admin/LabTests';
import AdminBilling from '@/pages/admin/Billing';
import Analytics from '@/pages/admin/Analytics';
import Reports from '@/pages/admin/Reports';
import AdminPrescriptions from '@/pages/admin/Prescriptions';
import UserRoles from '@/pages/admin/UserRoles';
import PatientAnalytics from '@/pages/admin/PatientAnalytics';
import DoctorAnalytics from '@/pages/admin/DoctorAnalytics';
import ManageStaff from '@/pages/admin/ManageStaff';
import StaffAnalytics from '@/pages/admin/StaffAnalytics';
import AdminDepartments from '@/pages/admin/Departments';
import DepartmentAnalytics from '@/pages/admin/DepartmentAnalytics';

// Doctor Pages
import DoctorDashboard from '@/pages/doctor/DoctorDashboard';
import MyPatients from '@/pages/doctor/MyPatients';
import DoctorAppointments from '@/pages/doctor/DoctorAppointments';
import Schedule from '@/pages/doctor/Schedule';
import DoctorMedicalRecords from '@/pages/doctor/MedicalRecords';
import DoctorPrescriptions from '@/pages/doctor/Prescriptions';
import DoctorLabTests from '@/pages/doctor/LabTests';
import DoctorMessages from '@/pages/doctor/Messages';
import DoctorBilling from '@/pages/doctor/Billing';
import DoctorVideoConsultation from '@/pages/doctor/VideoConsultation';
import DoctorReviews from '@/pages/doctor/Reviews';
import DoctorDepartment from '@/pages/doctor/Department';

// Patient Pages
import PatientDashboard from '@/pages/patient/PatientDashboard';
import MyHealth from '@/pages/patient/MyHealth';
import BookAppointment from '@/pages/patient/BookAppointment';
import PatientMedicalRecords from '@/pages/patient/MedicalRecords';
import PatientPrescriptions from '@/pages/patient/Prescriptions';
import PatientLabTests from '@/pages/patient/LabTests';
import PatientVideoConsultation from '@/pages/patient/VideoConsultation';
import PatientBilling from '@/pages/patient/Billing';
import PatientMessages from '@/pages/patient/Messages';
import PatientDoctors from '@/pages/patient/Doctors';
import PatientAIHealthAssistant from '@/pages/patient/AIHealthAssistant';
import PatientDepartments from '@/pages/patient/Departments';
import PatientAppointments from '@/pages/patient/PatientAppointments';
import PatientSettings from '@/pages/patient/PatientSettings';

// Shared Pages
import Profile from '@/pages/Profile';

import Settings from '@/pages/Settings';
import AIAssistant from '@/pages/common/AIAssistant';

// Components
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { USER_ROLES } from '@/utils/constants';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/auth';

    switch (user?.role) {
      case USER_ROLES.ADMIN:
        return '/admin/dashboard';
      case USER_ROLES.DOCTOR:
        return '/doctor/dashboard';
      case USER_ROLES.PATIENT:
        return '/patient/dashboard';
      default:
        return '/auth';
    }
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <ManageUsers />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/user-roles"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <UserRoles />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <ManagePatients />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patient-analytics"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <PatientAnalytics />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <ManageDoctors />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctor-analytics"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <DoctorAnalytics />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <ManageStaff />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff-analytics"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <StaffAnalytics />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminAppointments />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments/add"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AddAppointment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medical-records"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminMedicalRecords />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lab-tests"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminLabTests />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminBilling />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prescriptions"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminPrescriptions />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <Analytics />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <AdminDepartments />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/department-analytics"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <MainLayout>
                    <DepartmentAnalytics />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* ==================== DOCTOR ROUTES ==================== */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <MyPatients />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorAppointments />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <Schedule />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/medical-records"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorMedicalRecords />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorPrescriptions />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/lab-tests"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorLabTests />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/messages"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorMessages />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/billing"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorBilling />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/video-consultations"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorVideoConsultation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reviews"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorReviews />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/department"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <MainLayout>
                    <DoctorDepartment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* ==================== PATIENT ROUTES ==================== */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/health"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <MyHealth />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <BookAppointment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientAppointments />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/medical-records"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientMedicalRecords />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientPrescriptions />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/lab-tests"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientLabTests />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/billing"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientBilling />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/messages"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientMessages />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/video-consultations"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientVideoConsultation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/doctors"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientDoctors />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/ai-health"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientAIHealthAssistant />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/settings"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <PatientSettings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* ==================== SHARED ROUTES ==================== */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.PATIENT]}>
                  <MainLayout>
                    <AIAssistant />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={
              <MainLayout>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h4" gutterBottom>Access Denied</Typography>
                  <Typography variant="body1">You don't have permission to access this page.</Typography>
                  <Button sx={{ mt: 2 }} variant="contained" onClick={() => window.location.href = getDefaultRoute()}>Go to My Dashboard</Button>
                </Box>
              </MainLayout>
            } />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;