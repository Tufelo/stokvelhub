import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '20px',
});

const StyledPaper = styled(Paper)({
  padding: '40px',
  maxWidth: '450px',
  width: '100%',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  background: 'white',
});

const StyledAvatar = styled(Avatar)({
  width: 80,
  height: 80,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  margin: '0 auto 20px',
});

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <GradientBackground>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <StyledPaper elevation={6}>
          <Box textAlign="center" mb={3}>
            <StyledAvatar>
              <AccountCircleIcon sx={{ fontSize: 50, color: 'white' }} />
            </StyledAvatar>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
              StokvelHub
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              {isRegister ? 'Create your account' : 'Welcome back!'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} variant="filled">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '10px',
                py: 1.5,
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b42a3 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <Box textAlign="center" mt={3}>
            <Button
              onClick={() => setIsRegister(!isRegister)}
              sx={{ color: '#667eea', textTransform: 'none', fontWeight: 500 }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </Button>
          </Box>
        </StyledPaper>
      </motion.div>
    </GradientBackground>
  );
};

export default Login;