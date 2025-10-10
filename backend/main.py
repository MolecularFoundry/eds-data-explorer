"""
Backend Service Architecture
--------------------------
This FastAPI application serves as the central backend server, managing data flow between
the frontend and backend services. Here's the architecture:

1. Frontend -> Backend (main.py):
   - Frontend api.ts makes HTTP requests to endpoints here
   - Each endpoint maps to a frontend function
   - Example: frontend getSpectrum() -> GET /spectrum endpoint

2. Main -> Service Layer:
   - Endpoints delegate to service handlers (service_handlers/*.py)
   - file_service.py: Handles file operations
   - signal_service.py: Handles signal processing

3. Service -> Operations:
   - Services use operations modules (operations/*.py) for core tasks
   - file_functions.py: File I/O
   - signal_functions.py: Signal processing
   - spectrum_functions.py: Spectrum analysis
   - metadata_functions.py: Metadata handling
   - Example: signal_service uses spectrum_functions.extract_spectrum_data()

4. Error Flow:
   - HTTP errors handled in main.py
   - logic errors in services
   - Processing errors in operations
   - All errors are logged and propagated up
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles #Allows displaying of Crucible Data Explorer App
import hyperspy.api as hs
import os
import time
from service_handlers import file_service, signal_service, data_service
print("=== IMPORTING ORCID SERVICE ===")
from external_services import orcid_service
print("=== ORCID SERVICE IMPORTED SUCCESSFULLY ===")
from operations import periodic_table_functions
from pydantic import BaseModel



######################## Begin FastAPI server block ##############################

# This section of code creates the FastAPI instance and configures it
# This FastAPI instance presents the user with the Crucible Data Explorer App
# Calls to retrieve data from the user/webpage/frontend are also made to
# and returned from this FastAPI instance



# Create FastAPI instance
app = FastAPI()



### THIS SECTION OF CODE IS FOR DEVELOPMENT ONLY ###
### MUST ADD SECURITY FOR PRODUCTION ###
# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

ENV = os.getenv("ENV", "development")

if ENV != "development": 
    # Mount static files directory to serve React build files
    # Mount assets directory so /assets/... requests work directly (React build expects this)
    # This directory should be built during docker deployment
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    # Mount main static files for favicon and other root-level static files
    # This allows /2020LBL_Favicon.ico to be served directly

    # Create a custom static file handler for root-level files
    @app.get("/2020LBL_Favicon.ico")
    async def favicon():
        from fastapi.responses import FileResponse
        return FileResponse("static/2020LBL_Favicon.ico")

    @app.get("/2020-Favicon-Template-228x228_v3.png")  
    async def favicon_png():
        from fastapi.responses import FileResponse
        return FileResponse("static/2020-Favicon-Template-228x228_v3.png")


######################## End FastAPI server block ##############################






# Track last call times to detect React StrictMode double-invocations
last_calls = {}

def log_call(endpoint: str, params: dict = None) -> None:
    """Helper to log endpoint calls and detect React StrictMode double-invocations"""
    print("\n=== Starting log_call() in main.py ===")
    current_time = time.time()
    call_key = f"{endpoint}:{str(params)}"
    
    if call_key in last_calls:
        time_diff = current_time - last_calls[call_key]
        if time_diff < 0.1:  # If calls are within 100ms, likely StrictMode
            print(f"\n[React StrictMode] Duplicate call to {endpoint}")
            if params:
                print(f"Parameters: {params}")
            print(f"Time since last call: {time_diff*1000:.2f}ms")
        else:
            print(f"\n[New Request] {endpoint}")
            if params:
                print(f"Parameters: {params}")
    else:
        print(f"\n[First Request] {endpoint}")
        if params:
            print(f"Parameters: {params}")
    
    last_calls[call_key] = current_time
    print("=== Ending log_call() in main.py ===\n")




################################################################################
#################### API Endpoints for getting data ############################
################################################################################

"""
Lists all .emd files in the sample_data directory
Returns: List of filenames
Called by: Frontend getFiles() function
"""
@app.get("/files")
async def get_file_list():
    print("\n=== Starting get_file_list() ===")
    log_call("/files")
    try:
        files = file_service.list_files()
        print("=== Ending get_file_list() in main.py ===\n")
        return JSONResponse(content=files)
    except Exception as e:
        print(f"ERROR in get_file_list(): {str(e)}")
        print("=== Ending get_file_list() in main.py with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""Gets a list of signals from a file
Args:
    filename: Name of the file to get signals from
Returns:
    List of signals from the file
"""
@app.get("/signals")
async def get_signals(filename: str = Query(...)):
    print("\n=== Starting get_signals() from main.py ===")
    print(f"Filename: {filename}")
    log_call("/signals", {"filename": filename})
    
    try:
        signals = signal_service.get_signal_list(filename)
        print("=== Ending get_signals() from main.py ===\n")
        return JSONResponse(content={"signals": signals})  # Wrap signals in an object
    except Exception as e:
        print(f"ERROR in get_signals(): {str(e)}")
        print("=== Ending get_signals() from main.py with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""
Gets image data from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: Dictionary containing image data and shape
Called by: Frontend getImageData() function
"""
@app.get("/image-data")
async def get_image_data(
    filename: str = Query(...),
    signal_idx: int = Query(...)
):
    print("\n=== Starting get_image_data() from main.py ===")
    print(f"Filename: {filename}, Signal Index: {signal_idx}")
    log_call("/image-data", {"filename": filename, "signal_idx": signal_idx})
    try:
        image_data = signal_service.get_image_data(filename, signal_idx)
        if image_data is None:
            raise ValueError("Failed to extract image data")
        print("=== Ending get_image_data() successfully ===\n")
        return JSONResponse(content=image_data)
    except Exception as e:
        print(f"ERROR in get_image_data(): {str(e)}")
        print("=== Ending get_image_data() with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/spectrum")
async def get_spectrum(
    filename: str = Query(...), 
    signal_idx: int = Query(...)
):
    """
    Gets spectrum data in the new format that includes both x and y values with units
    Args:
        filename: Name of the file (required)
        signal_idx: Index of the signal in the file (required)
    Returns: Dictionary containing:
        - x: array of energy values
        - y: array of intensity values
        - x_label: label for x-axis
        - x_units: units for x-axis
        - y_label: label for y-axis
    Called by: Frontend getNewSpectrum() function
    """
    print("\n=== Starting get_spectrum() in main.py ===")
    print(f"Filename: {filename}, Signal Index: {signal_idx}")
    log_call("/spectrum", {"filename": filename, "signal_idx": signal_idx})
    try:
        spectrum_data = signal_service.get_spectrum_data(filename, signal_idx)
        print("=== Ending get_spectrum() in main.py ===\n")
        return JSONResponse(content=spectrum_data)
    except Exception as e:
        print(f"ERROR in get_spectrum() in main.py: {str(e)}")
        print("=== Ending get_spectrum() with error in main.py ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""
Gets HAADF data from a specific signal in a file
Args:
    filename: Name of the file (required)
Returns: Dictionary containing HAADF data and shape
Called by: Frontend getHAADFData() function
"""
@app.get("/haadf-data")
async def get_haadf_data(
    filename: str = Query(...)
):
    print("\n=== Starting get_haadf_data() from main.py ===")
    print(f"Filename: {filename}")
    log_call("/haadf-data", {"filename": filename})
    try:
        haadf_data = signal_service.get_haadf_data(filename)
        if haadf_data is None:
            print("=== Ending get_haadf_data() - No HAADF data found ===\n")
            return JSONResponse(
                status_code=404,
                content={"error": "No HAADF data found in file"}
            )
        print("=== Ending get_haadf_data() successfully ===\n")
        return JSONResponse(content=haadf_data)
    except Exception as e:
        print(f"ERROR in get_haadf_data(): {str(e)}")
        print("=== Ending get_haadf_data() with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""
Gets metadata from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: Dictionary containing metadata for the specific signal
Called by: Frontend getMetadata() function
"""
@app.get("/metadata")
async def get_metadata(filename: str = Query(...), signal_idx: int = Query(...)):
    try:
        print("\n=== Starting get_metadata() in main.py ===")
        print(f"Requested metadata for file: {filename}, signal: {signal_idx}")
        
        metadata = signal_service.get_metadata(filename, signal_idx)
        print("=== Ending get_metadata() successfully ===\n")
        return metadata
        
    except Exception as e:
        print(f"ERROR in get_metadata(): {str(e)}")
        print("=== Ending get_metadata() with error ===\n")
        raise HTTPException(status_code=500, detail=str(e))


"""
Gets axes data from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: Dictionary containing axes data for the specific signal
Called by: Frontend getAxesData() function
"""
@app.get("/axes-data")
async def get_axes_data(filename: str = Query(...), signal_idx: int = Query(...)):
    try:
        print("\n=== Starting get_axes_data() in main.py ===")
        print(f"Requested axes data for file: {filename}, signal: {signal_idx}")
        
        axes_data = signal_service.get_axes_data(filename, signal_idx)
        print("=== Ending get_axes_data() successfully ===\n")
        return axes_data
        
    except Exception as e:
        print(f"ERROR in get_axes_data(): {str(e)}")
        print("=== Ending get_axes_data() with error ===\n")
        raise HTTPException(status_code=500, detail=str(e))

################################################################################
#################### API Endpoints for Emission Line Analysis ##################
################################################################################
@app.get("/zero-peak-width")
async def get_zero_peak_width(filename: str = Query(...), signal_idx: int = Query(...)):
    try:
        print(f"\n=== Starting get_zero_peak_width() in main.py ===")
        print(f"Requested zero peak width for file: {filename}, signal: {signal_idx}")
        
        zero_peak_width = data_service.get_zero_peak_width(filename, signal_idx)
        print("=== Ending get_zero_peak_width() successfully ===\n")
        return zero_peak_width
    
    except Exception as e:
        print(f"ERROR in get_zero_peak_width(): {str(e)}")
        print("=== Ending get_zero_peak_width() with error ===\n")
        raise HTTPException(status_code=500, detail=str(e))

################################################################################
#################### API Endpoints for periodic table ##########################
################################################################################


@app.get("/emission-spectra")
async def get_emission_spectra(atomic_number: int):
    try:
        print(f"\n=== Starting get_emission_spectra() in main.py ===")
        print(f"Requested emission spectra for atomic number: {atomic_number}")
        
        spectra = data_service.get_emission_spectra(atomic_number)

        return spectra
    
    except Exception as e:
        print(f"ERROR in get_emission_spectra() in main.py: {str(e)}")
        print("=== Ending get_emission_spectra() with error in main.py ===\n")
        raise HTTPException(status_code=500, detail=str(e))


################################################################################
#################### API Endpoints for manipulating data #######################
################################################################################

"""
Gets the spectrum data for a specific region of the image
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
"""
@app.get("/region-spectrum")
async def get_region_spectrum(filename: str, signal_idx: int, x1: int, y1: int, x2: int, y2: int):
    try:
        print(f"\n=== Starting get_region_spectrum() in main.py ===")
        print(f"Requested region spectrum for file: {filename}, signal: {signal_idx}")
        print(f"Region: ({x1}, {y1}) to ({x2}, {y2})")
        
        region = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        data = signal_service.get_spectrum_from_2d_range(filename, signal_idx, region)
        print("=== Ending get_region_spectrum() successfully ===\n")
        return data
        
    except Exception as e:
        print(f"ERROR in get_region_spectrum(): {str(e)}")
        print("=== Ending get_region_spectrum() with error ===\n")
        raise HTTPException(status_code=500, detail=str(e))


"""
Get the spectrum data for a specific range of energy channels.

Parameters:
- filename: Name of the file containing the signal
- signal_idx: Index of the signal in the file
- start: Starting energy channel index
- end: Ending energy channel index

Returns:
- Array of spectrum data points for the selected energy range
"""
@app.get("/energy-range-spectrum")
async def energy_range_spectrum(
    filename: str = Query(..., description="Name of the file to process"),
    signal_idx: int = Query(..., description="Index of the signal in the file"),
    start: int = Query(..., description="Start index of the energy range"),
    end: int = Query(..., description="End index of the energy range")
):

    try:
        return await signal_service.spectrum_to_2d(filename, signal_idx, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


"""
Get the spectrum sum for a specific energy range.

Parameters:
- filename: Name of the file containing the signal
- signal_idx: Index of the signal in the file
- start: Starting energy value in keV
- end: Ending energy value in keV

Returns:
- Total sum of x-ray counts within the specified energy range
"""
@app.get("/emission-spectra-width-sum")
async def emission_spectra_width_sum(
    filename: str = Query(..., description="Name of the file to process"),
    signal_idx: int = Query(..., description="Index of the signal in the file"),
    start: float = Query(..., description="Start energy value in keV"),
    end: float = Query(..., description="End energy value in keV")
):
    """
    Get the spectrum sum for a specific energy range.

    Parameters:
    - filename: Name of the file containing the signal
    - signal_idx: Index of the signal in the file
    - start: Starting energy value in keV
    - end: Ending energy value in keV

    Returns:
    - Total sum of x-ray counts within the specified energy range
    """
    try:
        return await signal_service.get_emission_spectra_width_sum(filename, signal_idx, start, end)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




################################################################################
#################### Calls to LBNL database ####################################
################################################################################




################################################################################
######################## ORCID Authentication Endpoints ########################
################################################################################

# Pydantic models for ORCID authentication requests and responses
class ORCIDCodeRequest(BaseModel):
    """
    Request model for ORCID authorization code exchange.
    
    Attributes:
        code: The authorization code received from ORCID after user authentication
    """
    code: str

class ORCIDTokenResponse(BaseModel):
    """
    Response model for successful ORCID authentication.
    
    Attributes:
        orcid_id: The user's ORCID identifier (e.g., "0000-0000-0000-0000")
        access_token: The access token for making API calls to ORCID
        name: The user's name (if available)
        expires_in: Token expiration time in seconds
    """
    orcid_id: str
    access_token: str
    name: str = None
    expires_in: int = None

@app.get("/api/auth/orcid/login-url")
async def get_orcid_login_url():
    """
    Get the ORCID authorization URL for user authentication.
    
    This endpoint returns the URL that the frontend should redirect users to
    for ORCID authentication. After authentication, ORCID will redirect back
    to the configured redirect URI.
    
    Returns:
        Dict containing the ORCID authorization URL
    
    Raises:
        HTTPException: If ORCID service configuration is invalid
    """
    print("\n=== BACKEND: /api/auth/orcid/login-url endpoint called ===")
    print(f"ORCID service object: {orcid_service}")
    print(f"ORCID service configured: {getattr(orcid_service, 'is_configured', 'UNKNOWN')}")
    try:
        print("Calling orcid_service.get_authorization_url()...")
        authorization_url = orcid_service.get_authorization_url()
        print(f"Successfully generated authorization URL (length: {len(authorization_url)})")
        return {"authorization_url": authorization_url}
    except ValueError as e:
        print(f"ValueError in get_orcid_login_url: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ORCID configuration error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in get_orcid_login_url: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate ORCID login URL: {str(e)}")

@app.post("/api/auth/orcid/exchange", response_model=ORCIDTokenResponse)
async def exchange_orcid_code(request: ORCIDCodeRequest):
    """
    Exchange an ORCID authorization code for an access token.
    
    This endpoint handles the OAuth 2.0 authorization code flow by:
    1. Receiving the authorization code from the frontend
    2. Exchanging it with ORCID for an access token
    3. Returning the user's ORCID iD and authentication details
    
    Args:
        request: Contains the authorization code from ORCID
    
    Returns:
        ORCIDTokenResponse: Contains the user's ORCID iD, access token, and profile info
    
    Raises:
        HTTPException: If the code exchange fails or ORCID returns an error
    """
    print("\n=== BACKEND: /api/auth/orcid/exchange endpoint called ===")
    print(f"Authorization code received (first 20 chars): {request.code[:20]}...")
    print(f"ORCID service object: {orcid_service}")
    print(f"ORCID service configured: {getattr(orcid_service, 'is_configured', 'UNKNOWN')}")
    try:
        print("Calling orcid_service.exchange_code_for_token()...")
        # Exchange the authorization code for a token using the ORCID service
        token_data = await orcid_service.exchange_code_for_token(request.code)
        
        print("Token exchange successful! Creating response...")
        print(f"Received ORCID iD: {token_data['orcid_id']}")
        print(f"User name: {token_data.get('name', 'Not provided')}")
        
        # Return the authentication data to the frontend
        response = ORCIDTokenResponse(
            orcid_id=token_data["orcid_id"],
            access_token=token_data["access_token"],
            name=token_data.get("name"),
            expires_in=token_data.get("expires_in")
        )
        print("Returning successful response to frontend")
        return response
    
    except ValueError as e:
        print(f"ValueError in exchange_orcid_code: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid authorization code: {str(e)}")
    except Exception as e:
        print(f"Unexpected error in exchange_orcid_code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")


################################################################################
#################### Catch-all route to serve React app ########################
################!!!!  MUST BE LAST ROUTE DEFINED IN FASTAPI !!!!!###############
################!!!!       MUST BE AT BOTTOM OF FILE        !!!!!###############
################################################################################


# Catch-all route to serve React app for any non-API routes
# This MUST be the last route defined in FastAPI
# It enables React Router to handle client-side routing properly
@app.get("/{path:path}")
async def serve_react_app(path: str):
    """
    Serves the React application for any route that doesn't match API endpoints.
    This allows React Router to handle client-side routing properly.
    
    Args:
        path: The requested path (automatically captured by FastAPI)
    
    Returns:
        The React app's index.html file for all non-API routes
    """
    from fastapi.responses import FileResponse
    
    # Always return the React app's main HTML file
    # React Router will handle the client-side routing
    return FileResponse("static/index.html")