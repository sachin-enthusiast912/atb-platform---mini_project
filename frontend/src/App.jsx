import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { TestCaseList } from './components/testcases/TestCaseList';
import { TestCaseForm } from './components/testcases/TestCaseForm';
import { TestCaseDetail } from './components/testcases/TestCaseDetail';
import { BugList } from './components/bugs/BugList';
import { BugForm } from './components/bugs/BugForm';
import { BugDetail } from './components/bugs/BugDetail';
import { ExecutionList } from './components/executions/ExecutionList';
import { ExecutionDetail } from './components/executions/ExecutionDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="test-cases" element={<TestCaseList />} />
            <Route path="test-cases/new" element={<TestCaseForm />} />
            <Route path="test-cases/:id" element={<TestCaseDetail />} />
            <Route path="test-cases/:id/edit" element={<TestCaseForm />} />
            
            <Route path="bugs" element={<BugList />} />
            <Route path="bugs/new" element={<BugForm />} />
            <Route path="bugs/:id" element={<BugDetail />} />
            <Route path="bugs/:id/edit" element={<BugForm />} />
            
            <Route path="executions" element={<ExecutionList />} />
            <Route path="executions/:id" element={<ExecutionDetail />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;