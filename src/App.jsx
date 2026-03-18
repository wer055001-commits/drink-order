import { useState } from 'react';
import Header from './components/Header';
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import MenuManager from './components/MenuManager';
import RoleSelect from './components/RoleSelect';
import { useStore } from './hooks/useStore';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [activeTab, setActiveTab] = useState('order');
  const { role, isAdmin, isLeader, login, logout, saveUserName, getUserName } = useAuth();

  const {
    shops,
    activeSessions,
    totalActiveOrdersCount,
    loading,
    pastSessions,
    getActiveSessionOrders,
    getSessionOrders,
    startSession,
    closeSession,
    resetSession,
    continueSession,
    extendSession,
    addOrder,
    removeOrder,
    removeHistorySession,
    addShop,
    removeShop,
    addMenuItem,
    removeMenuItem,
    importMenuItems,
    resetShops,
  } = useStore();

  function handleLogin(selectedRole, remember = false) {
    login(selectedRole, remember);
    setActiveTab('order');
  }

  function handleLogout() {
    logout();
    setActiveTab('order');
  }

  if (!role) return <RoleSelect onSelect={handleLogin} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧋</div>
          <p className="text-gray-500 font-medium">資料載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeSessions={activeSessions}
        ordersCount={totalActiveOrdersCount}
        role={role}
        onLogout={handleLogout}
      />

      <main className="pb-8">
        {activeTab === 'order' && (
          <OrderForm
            shops={shops}
            activeSessions={activeSessions}
            onStartSession={startSession}
            onAddOrder={addOrder}
            onCloseSession={closeSession}
            onResetSession={resetSession}
            onContinueSession={continueSession}
            onExtendSession={extendSession}
            getActiveSessionOrders={getActiveSessionOrders}
            isLeader={isLeader}
            onSaveUserName={saveUserName}
          />
        )}
        {activeTab === 'summary' && (
          <OrderSummary
            activeSessions={activeSessions}
            getActiveSessionOrders={getActiveSessionOrders}
            pastSessions={pastSessions}
            getSessionOrders={getSessionOrders}
            onRemoveOrder={removeOrder}
            onCloseSession={closeSession}
            onResetSession={resetSession}
            onRemoveHistory={removeHistorySession}
            isLeader={isLeader}
            getUserName={getUserName}
          />
        )}
        {activeTab === 'menu' && isAdmin && (
          <MenuManager
            shops={shops}
            onAddShop={addShop}
            onRemoveShop={removeShop}
            onAddMenuItem={addMenuItem}
            onRemoveMenuItem={removeMenuItem}
            onImportMenuItems={importMenuItems}
            onResetShops={resetShops}
          />
        )}
      </main>
    </div>
  );
}
