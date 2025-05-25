'use client';

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

/**
 * Social Media Preview Component
 * This component can be rendered at /social-preview and then screenshot
 * to create the optimal 1200x630 social media preview image
 */
export default function SocialPreview() {
  return (
    <Box
      sx={{
        width: '1200px',
        height: '630px',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #FFD700 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #FFD700 0%, transparent 50%)
          `,
          opacity: 0.1,
        }}
      />
      
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            px: 6,
          }}
        >
          {/* Left Side - Text Content */}
          <Box sx={{ flex: 1, pr: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '3.5rem',
                lineHeight: 1.1,
              }}
            >
              Coinbull
            </Typography>
            
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 600,
                mb: 3,
                fontSize: '2rem',
                lineHeight: 1.2,
              }}
            >
              Create Solana Meme Coins
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.25rem',
                lineHeight: 1.4,
                maxWidth: '500px',
              }}
            >
              Launch verified tokens with pictures, links, and descriptions. 
              Add liquidity pools on Raydium in minutes.
            </Typography>
            
            {/* Features List */}
            <Box sx={{ mt: 4 }}>
              {['🚀 Instant Token Creation', '💰 Raydium Liquidity Pools', '🔒 Security Features'].map((feature, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1.1rem',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {feature}
                </Typography>
              ))}
            </Box>
          </Box>
          
          {/* Right Side - Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '300px',
              height: '300px',
            }}
          >
            <img
              src="/logo.svg"
              alt="Coinbull Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))',
              }}
            />
          </Box>
        </Box>
      </Container>
      
      {/* Bottom Gradient */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(to top, rgba(255, 215, 0, 0.1), transparent)',
        }}
      />
    </Box>
  );
} 