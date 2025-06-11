import re

with open("src/app/page.tsx", "r") as f:
    content = f.read()

new_hero = '''      {/* Hero section - centered content without image */}
      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 1.5 } }}>
        <Grid container spacing={{ xs: 1, md: 2 }} sx={{ my: { xs: 0, md: 0.5 } }}>
          <Grid xs={12} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Typography variant="body2" component="h2" color="text.secondary" paragraph sx={{ mb: 1.5 }}>
              Create DEX-tradable SOL coins with Raydium Liquidity Pools in just one step for less money than the competition.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              mt: 0,
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center'
            }}>
              <Button 
                component={Link}
                href="/create-token"
                variant="contained" 
                size="small"
                color="primary"
                fullWidth={false}
              >
                Create Token
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>'''

pattern = r"      \{/\* Hero section.*?\n      </Container>"
content = re.sub(pattern, new_hero, content, flags=re.DOTALL)

with open("src/app/page.tsx", "w") as f:
    f.write(content)

print("Hero section updated!") 