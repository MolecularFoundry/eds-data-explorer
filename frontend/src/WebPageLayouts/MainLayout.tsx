import { Box, styled } from '@mui/material';
import type { ReactNode } from 'react';

const GridContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr 3fr 2fr',    // Three columns: 25% 50% 25%
  gridTemplateRows: '200px 2fr 2fr',     // header, taller middle row, shorter bottom row
  gap: '1rem',
  padding: '1rem',
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#f0f0f0'
});

interface MainLayoutProps {
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  topLeft?: ReactNode;
  topCenter?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomCenter?: ReactNode;
  bottomRight?: ReactNode;
}

const GridSection = styled(Box)({
  padding: '1rem',
  borderRadius: '8px',
  minHeight: '200px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e0e0e0',
  backgroundColor: '#ffffff',
  overflow: 'auto',
  '& > *': { 
    width: '100%',
    height: '100%'
  }
});

// Special header container that spans full width and splits into two
const HeaderContainer = styled(Box)({
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
});

// Individual header section
const HeaderSection = styled(GridSection)({
  minHeight: 'unset',
  padding: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  color: '#333',
});

// Common header section styles
const headerSectionStyles = {
  bgcolor: '#ffffff',
  border: '1px solid #e0e0e0',
  '& > *': { width: '100%' }  // Make children take full width
};

const MainLayout = ({
  headerLeft = 'Header Left',
  headerRight = 'Header Right',
  topLeft = 'Top Left',
  topCenter = 'Top Center',
  topRight = 'Top Right',
  bottomLeft = 'Bottom Left',
  bottomCenter = 'Bottom Center',
  bottomRight = 'Bottom Right'
}: MainLayoutProps) => {
  return (
    <GridContainer>
      {/* Split Header Row */}
      <HeaderContainer>
        <HeaderSection sx={headerSectionStyles}>
          {headerLeft}
        </HeaderSection>
        <HeaderSection sx={headerSectionStyles}>
          {headerRight}
        </HeaderSection>
      </HeaderContainer>

      {/* Top Row */}
      <GridSection>
        {topLeft}
      </GridSection>
      <GridSection>
        {topCenter}
      </GridSection>
      <GridSection>
        {topRight}
      </GridSection>

      {/* Bottom Row */}
      <GridSection>
        {bottomLeft}
      </GridSection>
      <GridSection>
        {bottomCenter}
      </GridSection>
      <GridSection>
        {bottomRight}
      </GridSection>
    </GridContainer>
  );
};

export default MainLayout; 