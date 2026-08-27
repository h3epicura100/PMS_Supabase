import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { BookingsPage } from '../features/bookings/BookingsPage';
import { MenuFinalizePage } from '../features/menu/MenuFinalizePage';
import { InformChefPage } from '../features/departments/informChef/InformChefPage';
import { TagPrintPage } from '../features/departments/tagPrint/TagPrintPage';
import { DressPage } from '../features/departments/dress/DressPage';
import { DecorPage } from '../features/departments/decor/DecorPage';
import { CrockeryPage } from '../features/departments/crockery/CrockeryPage';
import { KitchenPage } from '../features/departments/kitchen/KitchenPage';
import { VegetablesPage } from '../features/departments/vegetables/VegetablesPage';
import { CheeseDairyPage } from '../features/departments/cheeseDairy/CheeseDairyPage';
import { MastersPage } from '../features/masters/MastersPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="dashboard"
          element={
            <ProtectedRoute pageKey="dashboard">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="bookings"
          element={
            <ProtectedRoute pageKey="bookings">
              <BookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="menu-finalize"
          element={
            <ProtectedRoute pageKey="menuFinalize">
              <MenuFinalizePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="inform-to-chef"
          element={
            <ProtectedRoute pageKey="chef">
              <InformChefPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="tag-print"
          element={
            <ProtectedRoute pageKey="tagPrints">
              <TagPrintPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="dress"
          element={
            <ProtectedRoute pageKey="dress">
              <DressPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="decor-list"
          element={
            <ProtectedRoute pageKey="decor">
              <DecorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="crockery-list"
          element={
            <ProtectedRoute pageKey="crockery">
              <CrockeryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="kitchen-raw-material"
          element={
            <ProtectedRoute pageKey="kitchenRawMaterial">
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="vegetables"
          element={
            <ProtectedRoute pageKey="vegetables">
              <VegetablesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="cheese-dairy-products"
          element={
            <ProtectedRoute pageKey="cheeseDairy">
              <CheeseDairyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="masters"
          element={
            <ProtectedRoute pageKey="masters">
              <MastersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectedRoute pageKey="settings">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
