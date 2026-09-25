import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { BookingsPage } from '../features/bookings/BookingsPage';
import { MenuFinalizePage } from '../features/menu/MenuFinalizePage';
import { MenuChatbotPage } from '../features/menuChatbot/MenuChatbotPage';
import { WhatsappPage } from '../features/whatsapp/WhatsappPage';
import { KitchenPrepPage } from '../features/departments/kitchenPrep/KitchenPrepPage';
import { TagPrintPage } from '../features/departments/tagPrint/TagPrintPage';
import { DressPage } from '../features/departments/dress/DressPage';
import { DecorPage } from '../features/departments/decor/DecorPage';
import { CrockeryPage } from '../features/departments/crockery/CrockeryPage';
import { KitchenPage } from '../features/departments/kitchen/KitchenPage';
import { VegetablesPage } from '../features/departments/vegetables/VegetablesPage';
import { CheeseDairyPage } from '../features/departments/cheeseDairy/CheeseDairyPage';
import { VendorOrdersPage } from '../features/departments/vendorOrders/VendorOrdersPage';
import { BakeryPage } from '../features/departments/bakery/BakeryPage';
import { IceWaterPage } from '../features/departments/iceWater/IceWaterPage';
import { LoadingBoysPage } from '../features/departments/loadingBoys/LoadingBoysPage';
import { VehiclePage } from '../features/departments/vehicle/VehiclePage';
import { GasCylinderPage } from '../features/departments/gasCylinder/GasCylinderPage';
import { FreshFlowersPage } from '../features/departments/freshFlowers/FreshFlowersPage';
import { WaitersPage } from '../features/departments/waiters/WaitersPage';
import { OutsourcingPage } from '../features/departments/outsourcing/OutsourcingPage';
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
          path="menu-chatbot"
          element={
            <ProtectedRoute pageKey="menuChatbot">
              <MenuChatbotPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="whatsapp"
          element={
            <ProtectedRoute pageKey="whatsapp">
              <WhatsappPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="kitchen-preparation"
          element={
            <ProtectedRoute pageKey="chef">
              <KitchenPrepPage />
            </ProtectedRoute>
          }
        />
        <Route path="inform-to-chef" element={<Navigate to="/kitchen-preparation" replace />} />

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
          path="menu-kitchen-requirement"
          element={
            <ProtectedRoute pageKey="kitchenRawMaterial">
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        {/* Backward-compatibility redirect from legacy path */}
        <Route
          path="kitchen-raw-material"
          element={<Navigate to="/menu-kitchen-requirement" replace />}
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
          path="vendor-orders"
          element={
            <ProtectedRoute pageKey="vendorOrders">
              <VendorOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="bakery"
          element={
            <ProtectedRoute pageKey="bakery">
              <BakeryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="ice-water-requirement"
          element={
            <ProtectedRoute pageKey="iceWaterRequirement">
              <IceWaterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="loading-boys-aunties"
          element={
            <ProtectedRoute pageKey="loadingBoysAunties">
              <LoadingBoysPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="vehicle-requirement"
          element={
            <ProtectedRoute pageKey="vehicleRequirement">
              <VehiclePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="gas-cylinder"
          element={
            <ProtectedRoute pageKey="gasCylinder">
              <GasCylinderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="fresh-flowers"
          element={
            <ProtectedRoute pageKey="freshFlowers">
              <FreshFlowersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="waiters"
          element={
            <ProtectedRoute pageKey="waiters">
              <WaitersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="outsourcing-team"
          element={
            <ProtectedRoute pageKey="outsourcingTeam">
              <OutsourcingPage />
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
