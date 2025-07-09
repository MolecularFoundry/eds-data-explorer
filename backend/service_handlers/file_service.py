from typing import Any, List, Dict, Union
from operations import file_functions
from utils import constants
import os
from typing import Any


class FileService:
    """
    Service class for handling file operations.
    Manages file loading, listing, and metadata extraction.
    """
    
    def __init__(self):
        self._supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
        self._current_file = {
            "filepath": None,
            "data": None
        }

    def list_files(self) -> list:
        """
        List all supported microscopy files in the data directory.
        
        Returns:
            list: List of filenames with supported extensions
        """
        try:
            print(f"\n=== Starting list_files in FileService ===")
            files = file_functions.list_files()
            print("=== Ending list_files in FileService ===\n")
            return files
        except Exception as e:
            print(f"Error listing files: {str(e)}")
            raise e


    def validate_file(self, filename: str) -> bool:
        """
        Check if a file exists and is a supported type.
        
        Args:
            filename (str): Name of the file to validate
            
        Returns:
            bool: True if file exists and is supported, False otherwise
        """
        try:
            if not filename.lower().endswith(self._supported_extensions):
                return False
                
            filepath = os.path.join(constants.DATA_DIR, filename)
            return os.path.exists(filepath)
        except Exception as e:
            print(f"Error validating file: {str(e)}")
            return False

    def get_or_load_file(self, filename: str, signal_idx: int = None) -> Any:
        """
        Helper function that handles the common pattern of:
        1. Getting the full filepath
        2. Checking the cache
        3. Loading the file if not cached
        4. Handling any errors in the process
        
        Args:
            filename (str): Name of the file to load
            signal_idx (int, optional): Index of the specific signal to return
            
        Returns:
            Any: The loaded signal(s) from the file
            
        Raises:
            ValueError: If the file cannot be loaded
        """
        try:
            filepath = constants.full_filepath(filename)
            print(f"Full filepath: {filepath}")
            
            if not os.path.exists(filepath):
                raise ValueError(f"File does not exist: {filepath}")
        
            signal = file_functions.get_cached_file(filepath, signal_idx)
            
            if signal is None:
                signal = file_functions.load_file(filepath, signal_idx)
                
            return signal
            
        except Exception as e:
            print(f"Error loading file {filename}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise








