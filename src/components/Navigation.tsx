import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export const Navigation = () => {
  const pathname = usePathname();
  
  const pages = [
    { title: 'Home', path: '/' },
    { title: 'Create Token', path: '/create-token' },
    { title: 'My Tokens', path: '/my-tokens' },
  ];
  
  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'transparent' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', mr: 2, alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <Image 
                src="/images/logo.png" 
                alt="Coinbull Logo" 
                width={50}
                height={50}
                style={{ marginRight: '10px' }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'secondary.main',
                  textDecoration: 'none',
                }}
              >
                COINBULL
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
            <WalletMultiButton />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 