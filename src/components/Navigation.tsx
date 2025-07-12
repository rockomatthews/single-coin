import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import MultiChainWalletButton from './MultiChainWalletButton';

export const Navigation = () => {
  const pathname = usePathname();
  
  const pages = [
    // { title: 'Home', path: '/' },
    { title: 'Create Token', path: '/create-token' },
    { title: 'My Tokens', path: '/my-tokens' },
  ];
  
  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'transparent' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', mr: 2, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: { xs: 60, md: 80 }, 
                height: { xs: 60, md: 80 },
                mr: '10px',
                position: 'relative'
              }}>
                <Image 
                  src="/images/logo.png" 
                  alt="Redbull Coins Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'secondary.main',
                  textDecoration: 'none',
                  fontFamily: '"Nitro Chargers", Arial, sans-serif',
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                REDBULL COINS
              </Typography>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                component={Link}
                href={page.path}
                sx={{ 
                  my: 2, 
                  color: 'white', 
                  display: 'block',
                  borderBottom: pathname === page.path ? '2px solid #FFD700' : 'none',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1, md: 2 },
                  '&:hover': {
                    borderBottom: '2px solid #FFD700',
                  }
                }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <MultiChainWalletButton />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 