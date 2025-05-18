'use client';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

// Create a custom theme based on the bull image colors with black background
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#CC0000', // Bull red
      light: '#DD3000', // Bull nose color
      dark: '#800000', // Bull outline
    },
    secondary: {
      main: '#FFD700', // Gold/yellow from coin
      light: '#FFCC00',
      dark: '#CC8800',
    },
    background: {
      default: '#000000', // Pure black background
      paper: '#000000',   // Black for cards and components
    },
    text: {
      primary: '#FFFFFF', // White text
      secondary: '#CCCCCC', // Light gray for secondary text
    },
    info: {
      main: '#0047AB', // Blue from background
    },
    error: {
      main: '#CC0000', // Bull red
    },
    warning: {
      main: '#FFD700', // Gold/yellow
    },
    success: {
      main: '#006400', // Dark green (complimentary to the red)
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#FFFFFF', // Ensure white text
    },
    h2: {
      fontWeight: 600,
      color: '#FFFFFF', // Ensure white text
    },
    h3: {
      color: '#FFFFFF', // Ensure white text
    },
    h4: {
      color: '#FFFFFF', // Ensure white text
    },
    h5: {
      color: '#FFFFFF', // Ensure white text
    },
    h6: {
      color: '#FFFFFF', // Ensure white text
    },
    body1: {
      color: '#FFFFFF', // Ensure white text
    },
    body2: {
      color: '#CCCCCC', // Light gray for secondary text
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          scrollbarColor: '#FFD700 #000000',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#000000',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#FFD700',
            minHeight: 24,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent', // Invisible app bar
          boxShadow: 'none', // Remove shadow
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#CC0000',
          '&:hover': {
            backgroundColor: '#800000',
          },
        },
        outlined: {
          borderColor: '#FFD700',
          color: '#FFD700',
          '&:hover': {
            borderColor: '#CC8800',
            backgroundColor: 'rgba(255, 215, 0, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#000000',
            borderColor: '#FFFFFF',
            color: '#FFFFFF',
            '& fieldset': {
              borderColor: '#FFFFFF',
            },
            '&:hover fieldset': {
              borderColor: '#FFD700',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFD700',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#FFFFFF',
          },
          '& .MuiInputBase-input': {
            color: '#FFFFFF',
          },
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          border: '1px solid #FFFFFF',
          '&:hover': {
            borderColor: '#FFD700',
          },
          '&.Mui-focused': {
            borderColor: '#FFD700',
          },
          '& fieldset': {
            borderColor: '#FFFFFF',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FFD700',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FFD700',
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FFFFFF',
          },
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF',
        }
      }
    }
  },
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider; 