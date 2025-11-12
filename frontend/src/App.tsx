/**
 * Main Application Component
 * 
 * This is the root component of the React application, rendered in main.tsx.
 * It serves as the entry point for the application's component tree.
 * 
 * Data Flow:
 * ↓ = Data passed down to child components
 * ↑ = Callbacks/events passed up from child components
 * → = Data flow through context
 * 
 * Component Structure:
 * - App.tsx (You are here)
 *   ├─ MainLayout (WebPageLayouts/MainLayout.tsx)
 *   │   ↓ headerLeft: Top-left header section for file selection
 *   │   ↓ headerRight: Top-right header section for signal selection
 *   │   ↓ topLeft: Main content area for image selection/viewing
 *   │   ↓ topCenter: Main content area for spectrum visualization
 *   │   ↓ topRight: Main content area for periodic table
 *   │   ↓ bottomLeft: Lower section for metadata display
 *   │   ↓ bottomCenter: Lower section for spectrum range visualization
 *   │   ↓ bottomRight: Lower section for emission line analysis
 *   │   Handles the responsive grid-based layout of the application (the main webpage),
 *   │   organizing all major components into a structured dashboard view (provides the grid layout)
 *   │
 *   ├─ Contexts (src/contexts/)
 *   │   ├─ EmissionLineContext
 *   │   │   → Shares emission line spectra data between components
 *   │   │   → Flow: PeriodicTable → EmissionLineContext → SpectrumViewer, EmissionLineAnalysis
 *   │   │   → Manages element selection and emission lines (Kα1, Kα2, Kβ1, etc.)
 *   │   │
 *   │   ├─ SpectrumRangeContext
 *   │   │   → Manages X-ray energy ranges between components
 *   │   │   → Flow: SpectrumViewer → SpectrumRangeContext → SpectrumToImage
 *   │   │   → Handles energy values (KeV) and channel values (0-4095)
 *   │   │
 *   │   └─ EmissionRangeContext
 *   │       → Shares selected ranges for emission line analysis
 *   │       → Flow: EmissionLineAnalysis → EmissionRangeContext → SpectrumViewer
 *   │       → Manages spectrum and map display states
 *   │
 *   │Components (What's displayed on the webpage)
 *   ├─ FileSelector
 *   │   ↓ selectedFile: Current selected file path
 *   │   ↑ onFileSelect: Notifies parent of file selection
 *   ├─ SignalSelector
 *   │   ↓ selectedFile: Current file to get signals from
 *   │   ↑ onSignalSelect: Notifies parent of signal selection
 *   ├─ HAADFViewer
 *   │   ↓ selectedFile: File to display HAADF image from
 *   ├─ MetadataViewer
 *   │   ↓ selectedFile: File to show metadata for
 *   │   ↓ selectedSignalIndex: Specific signal's metadata to show
 *   ├─ SpectrumViewerRoot
 *   │   ↓ selectedFile: File to get spectrum from
 *   │   ↓ selectedSignal: Signal containing spectrum data
 *   │   ↓ regionSpectrumData: Spectrum data for selected region
 *   │   ↓ selectedRegion: Currently selected region coordinates
 *   └─ ImageViewer
 *       ↓ selectedFile: File to display image from
 *       ↓ selectedSignal: Signal containing image data
 *       ↑ onRegionSelected: Notifies parent of region selection with spectrum data
 */



import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import MainLayout from './WebPageLayouts/MainLayout';
import { useAuth } from './contexts/AuthContext';
import { AuthGuard, LoginPage, ORCIDCallback } from './components/Authentication';
import { SpectrumProvider } from './contexts/SpectrumViewerToSpectrumRangeVisualizer';
import { EmissionLineProvider } from './contexts/EmissionLineFromTableContext';
import { EmissionRangeProvider } from './contexts/EmissionRangeSelectionContext';
import { EmissionRangeToImageProvider } from './contexts/EmissionAnalysisToEmissionRangeImageContext';
import FileSelector from './components/FileSelector';
import SignalSelector from './components/SignalSelector';
import ImageViewer from './components/ImageViewer';
import SpectrumViewerRoot from './components/SpectrumViewer/SpectrumViewerRoot';
import PeriodicTable from './components/PeriodicTable/PeriodicTable';
import MetadataViewer from './components/MetadataViewer';
import SpectrumToImage from './components/SpectrumRangeVisualizer/SpectrumRangeVisualizer';
import EmissionSpectraWidthSum from './components/EmissionLineAnalysis';
import EmissionLineRangeVisualizer from './components/EmissionLineRangeVisualizer/EmissionLineRangeVisualizer';
import type { SignalInfo } from './types/shared';
import type { SpectrumData } from './components/SpectrumViewer/types';

/**
 * App Component
 * 
 * Root component of the application that manages the main application state
 * and composes the layout using the new grid-based layout.
 * 
 * Context Providers:
 * - SpectrumProvider: Provides spectrum range and visualization settings
 * - EmissionLineProvider: Provides selected emission line data for periodic table integration
 */
function App() {
  // Get authentication state
  const { isAuthenticated, isLoading, loginWithCredentials, loginWithORCID } = useAuth();
  
  // State for test mode toggle (temporary)
  const [showTest, setShowTest] = useState(false);
  
  // File and signal selection state
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);
  
  // Region selection state for spectrum data
  const [regionSpectrumData, setRegionSpectrumData] = useState<SpectrumData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  // Handler for region selection
  const handleRegionSelected = (
    region: {x1: number, y1: number, x2: number, y2: number},
    spectrumData: SpectrumData
  ) => {
    setSelectedRegion(region);
    setRegionSpectrumData(spectrumData);
  };

  // Show test view if enabled
  if (showTest) {
    return (
      <Box>
        <Button 
          variant="contained" 
          onClick={() => setShowTest(false)}
          sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
        >
          Show Main App
        </Button>
      </Box>
    );
  }

  return (
    <Routes>
      {/* ORCID Callback Route */}
      <Route path="/orcid/callback" element={<ORCIDCallback />} />
      
      {/* Main Application Route */}
      <Route path="/*" element={
        <AuthGuard 
          isAuthenticated={isAuthenticated} 
          isLoading={isLoading}
          fallback={
            <LoginPage 
              onLogin={loginWithCredentials}
              onORCIDLogin={loginWithORCID}
              isLoading={isLoading}
            />
          }
        >
          <MainApplication 
            showTest={showTest}
            setShowTest={setShowTest}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            selectedSignal={selectedSignal}
            setSelectedSignal={setSelectedSignal}
            regionSpectrumData={regionSpectrumData}
            selectedRegion={selectedRegion}
            handleRegionSelected={handleRegionSelected}
          />
        </AuthGuard>
      } />
    </Routes>
  );
}

/**
 * Main Application Component
 * 
 * Contains the main application UI that's shown after authentication.
 * This is separated to keep the App component clean and focused on routing.
 */
interface MainApplicationProps {
  showTest: boolean;
  setShowTest: (show: boolean) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  selectedSignal: SignalInfo | null;
  setSelectedSignal: (signal: SignalInfo | null) => void;
  regionSpectrumData: SpectrumData | null;
  selectedRegion: {x1: number, y1: number, x2: number, y2: number} | null;
  handleRegionSelected: (region: {x1: number, y1: number, x2: number, y2: number}, spectrumData: SpectrumData) => void;
}

function MainApplication({
  showTest,
  setShowTest,
  selectedFile,
  setSelectedFile,
  selectedSignal,
  setSelectedSignal,
  regionSpectrumData,
  selectedRegion,
  handleRegionSelected
}: MainApplicationProps) {
  // Show test view if enabled
  if (showTest) {
    return (
      <Box>
        <Button 
          variant="contained" 
          onClick={() => setShowTest(false)}
          sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
        >
          Show Main App
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      className="App" 
      sx={{ 
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Test toggle button */}
      <Button 
        variant="contained" 
        onClick={() => setShowTest(true)}
        sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
      >
        Test Context
      </Button>

      {/* Main application layout with context providers */}
      <SpectrumProvider>        {/* Provides spectrum range data to SpectrumViewer and SpectrumToImage */}
        <EmissionLineProvider>  {/* Provides emission line data between PeriodicTable and SpectrumViewer */}
          <EmissionRangeProvider> {/* Provides range data between EmissionLineAnalysis and SpectrumViewer */}
            <EmissionRangeToImageProvider> {/* Provides emission line range data to EmissionLineRangeVisualizer */}
            <MainLayout
              headerLeft={
                <FileSelector
                  selectedFile={selectedFile}       // ↓ Prop: Current file path
                  onFileSelect={setSelectedFile}    // ↑ Callback: Updates selected file
                />
              }
              headerRight={
                selectedFile ? (
                  <SignalSelector
                    selectedFile={selectedFile}         // ↓ Prop: Current file to load signals from
                    onSignalSelect={setSelectedSignal}  // ↑ Callback: Updates selected signal
                  />
                ) : (
                  <Box sx={{ 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                  }}>
                    Select a file to view available signals
                  </Box>
                )
              }
              topLeft={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    typography: 'h5', 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.primary',
                    fontWeight: 'medium'
                  }}>
                    Select 2D Range
                  </Box>
                  <Box sx={{ flex: 1, position: 'relative' }}>
                    {selectedSignal?.capabilities.hasImage ? (
                      <ImageViewer
                        selectedFile={selectedFile}               // ↓ Prop: File to load image from
                        selectedSignal={selectedSignal}           // ↓ Prop: Signal containing image data
                        onRegionSelected={handleRegionSelected}   // ↑ Callback: Updates region selection
                      />
                    ) : (
                      <Box sx={{ 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {selectedFile 
                          ? "Select a signal with image capabilities to view image"
                          : "Select a file to view image"}
                      </Box>
                    )}
                  </Box>
                </Box>
              }
              topCenter={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  bgcolor: 'white'
                }}>
                  {selectedSignal?.capabilities.hasSpectrum ? (
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <SpectrumViewerRoot
                        selectedFile={selectedFile}               // ↓ Prop: File to load spectrum from
                        selectedSignal={selectedSignal}           // ↓ Prop: Signal containing spectrum data
                        regionSpectrumData={regionSpectrumData}   // ↓ Prop: Spectrum data from selected region
                        selectedRegion={selectedRegion}           // ↓ Prop: Selected region coordinates
                      />
                      {/* Uses SpectrumProvider context for range selection */}
                      {/* Uses EmissionLineProvider context for emission line overlay */}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {selectedFile 
                        ? "Select a signal with spectrum capabilities to view spectrum"
                        : "Select a file to view spectrum"}
                    </Box>
                  )}
                </Box>
              }
              topRight={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    typography: 'h5', 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.primary',
                    fontWeight: 'medium'
                  }}>
                    Periodic Table
                  </Box>
                  <Box sx={{ 
                    flex: 1, 
                    position: 'relative',
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'flexStart',  // prev: center
                    justifyContent: 'flexStart', // prev: center
                    p: 2
                  }}>
                    <Box sx={{
                      transform: 'scale(0.8)',  // Scale down to 80%
                      transformOrigin: 'center top'  // Scale from center
                    }}>
                      <PeriodicTable />
                    </Box>
                  </Box>
                  {/* Uses EmissionLineProvider context to share selected elements */}
                </Box>
              }
              bottomLeft={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    typography: 'h5', 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.primary',
                    fontWeight: 'medium'
                  }}>
                    Metadata
                  </Box>
                  <Box sx={{ 
                    flex: 1, 
                    position: 'relative',
                    overflow: 'auto',
                    p: 2
                  }}>
                    {selectedFile ? (
                      <MetadataViewer 
                        selectedFile={selectedFile}     // ↓ Prop: File to show metadata for
                        selectedSignalIndex={selectedSignal ? selectedSignal.index : null}  // ↓ Prop: Signal index for specific metadata
                      />
                    ) : (
                      <Box sx={{ 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        Select a file to view metadata
                      </Box>
                    )}
                  </Box>
                </Box>
              }
              bottomCenter={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',  // Split into two equal columns
                  gap: '8px',
                  bgcolor: 'white'
                }}>
                  
                  {/* Left section: Spectrum Range Images */}
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    {/* Header for spectrum section */}
                    <Box sx={{ 
                      typography: 'subtitle1', 
                      p: 1, 
                      textAlign: 'center',
                      bgcolor: '#f5f5f5',
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 'medium'
                    }}>
                      Spectrum Range Images
                    </Box>
                    
                    {/* Content area for spectrum images */}
                    <Box sx={{ 
                      flex: 1, 
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'auto'
                    }}>
                      {selectedSignal?.capabilities.hasSpectrum ? (
                        <SpectrumToImage />
                      ) : (
                        <Box sx={{ 
                          color: '#666', 
                          textAlign: 'center' 
                        }}>
                          {selectedFile 
                            ? "Select a signal with spectrum capabilities"
                            : "Select a file to view spectrum ranges"}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Right section: Emission Line Images (placeholder) */}
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    {/* Header for emission section */}
                    <Box sx={{ 
                      typography: 'subtitle1', 
                      p: 1, 
                      textAlign: 'center',
                      bgcolor: '#f5f5f5',
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 'medium'
                    }}>
                      Emission Line Images
                    </Box>
                    
                    {/* Placeholder content for emission images */}
                    <Box sx={{ 
                      flex: 1, 
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'auto'
                    }}>
                      {selectedSignal?.capabilities.hasSpectrum ? (
                        <EmissionLineRangeVisualizer />
                      ) : (
                        <Box sx={{ 
                          color: '#666', 
                          textAlign: 'center' 
                        }}>
                          {selectedFile 
                            ? "Select a signal with spectrum capabilities"
                            : "Select a file to view emission ranges"}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              }
              bottomRight={
                <Box sx={{ 
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'white'
                }}>
                  <Box sx={{ 
                    typography: 'h5', 
                    p: 2, 
                    textAlign: 'center',
                    color: 'text.primary',
                    fontWeight: 'medium'
                  }}>
                    Emission Line Analysis
                  </Box>
                  <Box sx={{ 
                    flex: 1, 
                    position: 'relative',
                    overflow: 'auto',
                    p: 2
                  }}>
                    {selectedSignal?.capabilities.hasSpectrum ? (
                      <EmissionSpectraWidthSum
                        selectedFile={selectedFile}
                        selectedSignalIndex={selectedSignal.index}
                      />
                    ) : (
                      <Box sx={{ 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        {selectedFile 
                          ? "Select a signal with spectrum capabilities to view emission line analysis"
                          : "Select a file to view emission line analysis"}
                      </Box>
                    )}
                  </Box>
                </Box>
              }
            />
            </EmissionRangeToImageProvider>
          </EmissionRangeProvider>
        </EmissionLineProvider>
      </SpectrumProvider>
    </Box>
  );
}

export default App;
