import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * 应用根组件
 * 提供路由器配置
 */
const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
