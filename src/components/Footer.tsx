'use client';

import { Box, Container, Typography, IconButton, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom X (Twitter) icon component since MUI doesn't have the new X logo
const XIcon = styled('svg')(({ theme }) => ({
  width: 20,
  height: 20,
  fill: theme.palette.text.secondary,
  transition: 'fill 0.2s ease-in-out',
  '&:hover': {
    fill: theme.palette.primary.main,
  },
}));

export default function Footer() {
  const socialLinks = [
    {
      name: 'X (Twitter)',
      url: 'https://x.com/redbull_coins',
      icon: (
        <XIcon viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </XIcon>
      ),
    },
    // Add more social links here in the future:
    // {
    //   name: 'Discord',
    //   url: 'https://discord.gg/redbull_coins',
    //   icon: <DiscordIcon />,
    // },
    // {
    //   name: 'Telegram',
    //   url: 'https://t.me/redbull_coins',
    //   icon: <TelegramIcon />,
    // },
  ];

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 4, 
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      <Container maxWidth="lg">
        <Stack 
          direction="column" 
          alignItems="center" 
          spacing={2}
        >
          {/* Social Media Icons */}
          <Stack direction="row" spacing={1}>
            {socialLinks.map((social) => (
              <IconButton
                key={social.name}
                component="a"
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow us on ${social.name}`}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>

          {/* Copyright */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
          >
            Redbull Coins | ©2069
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
} 