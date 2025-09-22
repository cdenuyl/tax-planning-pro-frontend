import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Eye, EyeOff, Lock, Mail, User, Building, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { authenticateUser, createUser, initializeDefaultUser, USER_ROLES } from '../../utils/auth.js';

const LoginPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.ADVISOR,
    firmName: '',
    title: '',
    phone: '',
    licenseNumber: ''
  });
  
  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  
  useEffect(() => {
    // Initialize default admin user if no users exist
    initializeDefaultUser();
  }, []);
  
  useEffect(() => {
    // Check password strength when password changes
    if (registerForm.password) {
      checkPasswordStrength(registerForm.password);
    }
  }, [registerForm.password]);
  
  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('One uppercase letter');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('One lowercase letter');
    
    if (/\d/.test(password)) score++;
    else feedback.push('One number');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('One special character');
    
    setPasswordStrength({ score, feedback });
  };
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authenticateUser(loginForm.email, loginForm.password);
      
      if (result.success) {
        setSuccess('Login successful!');
        setTimeout(() => {
          if (typeof onLogin === 'function') {
            onLogin(result.user, result.session);
          } else {
            console.error('onLogin is not a function');
          }
        }, 500);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate form
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (passwordStrength.score < 5) {
      setError('Password does not meet security requirements');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await createUser(registerForm);
      
      if (result.success) {
        setSuccess('Account created successfully! You can now log in.');
        setActiveTab('login');
        setRegisterForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: USER_ROLES.ADVISOR,
          firmName: '',
          title: '',
          phone: '',
          licenseNumber: ''
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoginInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };
  
  const handleRegisterInputChange = (field, value) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    if (passwordStrength.score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax-on-a-Me</h1>
          <p className="text-gray-600">Professional Tax Planning Platform</p>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-6">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to access your clients and tax planning tools
                  </CardDescription>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="advisor@firm.com"
                        value={loginForm.email}
                        onChange={(e) => handleLoginInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => handleLoginInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                

              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4 mt-6">
                <div className="space-y-2 text-center">
                  <CardTitle className="text-2xl">Create Account</CardTitle>
                  <CardDescription>
                    Join your team and start managing clients securely
                  </CardDescription>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={registerForm.firstName}
                        onChange={(e) => handleRegisterInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={registerForm.lastName}
                        onChange={(e) => handleRegisterInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="advisor@firm.com"
                        value={registerForm.email}
                        onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={registerForm.password}
                        onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {registerForm.password && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{getPasswordStrengthText()}</span>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <div className="text-xs text-gray-600">
                            Missing: {passwordStrength.feedback.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={registerForm.role}
                      onChange={(e) => handleRegisterInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={USER_ROLES.ADVISOR}>Tax Advisor</option>
                      <option value={USER_ROLES.ASSISTANT}>Assistant</option>
                      <option value={USER_ROLES.ADMIN}>Administrator</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firmName">Firm Name</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="firmName"
                          placeholder="Tax Planning LLC"
                          value={registerForm.firmName}
                          onChange={(e) => handleRegisterInputChange('firmName', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Senior Advisor"
                        value={registerForm.title}
                        onChange={(e) => handleRegisterInputChange('title', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading || passwordStrength.score < 5}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Secure • Professional • Compliant</p>
          <p className="mt-1">© 2025 Tax-on-a-Me. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

