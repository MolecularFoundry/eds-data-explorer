from utils import constants
import hyperspy.api as hs
import os
import time
import gc
from typing import Any

def list_files():
    """
Lists all supported microscopy files in the sample_data directory.

Supported formats:
https://hyperspy.org/hyperspy-doc/v1.0/user_guide/io.html#supported-formats
Includes:
- .emd (EMD files)
- .tif (TIFF files)
- .dm3 (Digital Micrograph 3)
- .dm4 (Digital Micrograph 4)
- .ser (TIA Series)
- .emi (FEI EMI)

Returns:
    list: List of filenames with supported extensions
"""
    print(f"\n=== Starting list_files() in file_functions.py ===")
    try: # below is not full list of supported extensions
         # all supported extensions: https://hyperspy.org/hyperspy-doc/v1.0/user_guide/io.html#supported-formats
        supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi') 
        print("\nReturning list from list_files() in file_functions.py")
        files = [f for f in os.listdir(constants.DATA_DIR) if f.lower().endswith(supported_extensions)]
        print("=== Ending list_files() in file_functions.py ===\n")
        return files
    except Exception as e:
        print(f"Error accessing directory {constants.DATA_DIR}: {str(e)}")
        print("\nReturning empty list from list_files() in file_functions.py")
        return []

def get_cached_file(file_path, signal_idx=None):
    print("\n=== Starting get_cached_file() in file_functions.py ===")
    print(f"Checking cache for filepath: {file_path}")
    print(f"Current cached filepath: {constants.CURRENT_FILE['filepath']}")
    
    if constants.CURRENT_FILE["filepath"] == file_path:
        print("Filepath match found in cache")
        if constants.CURRENT_FILE["data"] is not None:
            if signal_idx is not None:
                print(f"=== Returning signal at index {signal_idx} from cache ===")
                return constants.CURRENT_FILE["data"][signal_idx] # Most frontend functions call this function with signal_idx
            else:
                print(f"=== Returning all signals from cache ===")
                return constants.CURRENT_FILE["data"] # For get signal list return all signals
        else:
            print("Cache entry exists but data is None")
            return None
    else:
        print("No matching filepath in cache")
        return None



"""
Direct data retrieval function that loads EMD files using HyperSpy.
This is the core function that actually reads the raw EMD file data from disk.

How it works:
1. Attempts to load the EMD file using different signal types (EMD, EDS_TEM, EDS_SEM, EELS)
2. Uses HyperSpy's hs.load() function which directly reads the binary EMD file
3. Returns the loaded signal object containing the raw spectrum data

Args:
    filepath (str): Full path to the EMD file to load
    
Returns:
    hyperspy.signals.Signal: A HyperSpy signal object containing the loaded data
    
Raises:
    ValueError: If the file cannot be loaded with any of the supported signal types
"""
def load_file(filepath, signal_idx=None):
    print(f"\n=== Starting load_file in file_functions.py ===")
    
    # Clear existing cache if loading a different file
    if constants.CURRENT_FILE["filepath"] != filepath:
        print("Clearing existing cache")
        constants.CURRENT_FILE["data"] = None
        gc.collect()  # Force garbage collection
        
    signal_types = [None, 'EMD', 'EDS_TEM', 'EDS_SEM']  # None means try without specifying type
    
    for signal_type in signal_types:
        try:
            print(f"Attempting to load file: {os.path.basename(filepath)}")
            print(f"Using signal type: {signal_type if signal_type else 'auto-detect'}")
            
            # Start timer
            start_time = time.time()
            
            # Load the file
            if signal_type:
                signal = hs.load(filepath, reader=signal_type)
            else:
                signal = hs.load(filepath)
            
            # End timer
            load_time = time.time() - start_time
            print(f"File loaded successfully in {load_time:.2f} seconds")
            
            # Return a list of signals for standardization, all functions that call
            # this function expect a list of signals
            if not isinstance(signal, list):
                if signal_idx is not None:
                    signal = signal[signal_idx]
                else:
                    signal = [signal]
            
            # Update cache
            constants.CURRENT_FILE["filepath"] = filepath
            constants.CURRENT_FILE["data"] = signal
            
            print("=== Ending load_file in file_functions.py ===\n")
            return signal
            
        except Exception as e:
            print(f"Failed with signal_type {signal_type}: {str(e)}")
            continue
    
    print("=== Ending load_file with error in file_functions.py ===\n")
    raise ValueError("Could not load file with any signal type")




