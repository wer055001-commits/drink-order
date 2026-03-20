import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import OrderForm from './components/OrderForm';
import OrderSummary from './components/OrderSummary';
import MenuManager from './components/MenuManager';
import ProfilePage from './components/ProfilePage';
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
    updateOrder,
    removeHistorySession,
    announcement,
    setAnnouncement,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-5xl mb-4"
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >🧋</motion.div>
          <p className="text-gray-500 font-medium">資料載入中...</p>
        </div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        activeSessions={activeSessions}
        ordersCount={totalActiveOrdersCount}
        role={role}
        onLogout={handleLogout}
      />

      {announcement && (
        <motion.div
          className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800 font-medium"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          📢 {announcement}
        </motion.div>
      )}

      <main className="pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'order' && (
            <motion.div key="order" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
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
                getUserName={getUserName}
              />
            </motion.div>
          )}
          {activeTab === 'summary' && (
            <motion.div key="summary" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <OrderSummary
                activeSessions={activeSessions}
                getActiveSessionOrders={getActiveSessionOrders}
                pastSessions={pastSessions}
                getSessionOrders={getSessionOrders}
                onRemoveOrder={removeOrder}
                onUpdateOrder={updateOrder}
                onCloseSession={closeSession}
                onResetSession={resetSession}
                onRemoveHistory={removeHistorySession}
                isLeader={isLeader}
                getUserName={getUserName}
                shops={shops}
              />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <ProfilePage
                getUserName={getUserName}
                pastSessions={pastSessions}
                getSessionOrders={getSessionOrders}
              />
            </motion.div>
          )}
          {activeTab === 'menu' && isAdmin && (
            <motion.div key="menu" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <MenuManager
                shops={shops}
                onAddShop={addShop}
                onRemoveShop={removeShop}
                onAddMenuItem={addMenuItem}
                onRemoveMenuItem={removeMenuItem}
                onImportMenuItems={importMenuItems}
                onResetShops={resetShops}
                announcement={announcement}
                onSetAnnouncement={setAnnouncement}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={totalActiveOrdersCount}
        role={role}
      />
    </div>
  );
}
